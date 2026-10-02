import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

const REQUEST_TIMEOUT_MS = 18000;
const MENU_LINK_PATTERN = /menu|carta|comida|food|platos|nuestra-oferta/i;
const RESTAURANT_PATTERN = /restaurant|restaurante|hamburg|burger|pizza|pizzer|sushi|maki|nigiri|tapas|taco|burrito|cocina|gastronom|comida|caf[eé]|bistro|brasserie|asador|steakhouse|food|chef/i;
const SOCIAL_DOMAINS = ["instagram.com", "facebook.com", "tiktok.com", "youtube.com", "x.com", "twitter.com", "linkedin.com"];
const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; RestaurantSiteBuilder/1.0)" };

function absoluteUrl(value, baseUrl) {
  if (!value || value.startsWith("data:")) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function isPublicIp(address) {
  const family = isIP(address);
  if (family === 4) {
    const [first, second, third] = address.split(".").map(Number);
    return !(
      first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100))) ||
      (first === 203 && second === 0 && third === 113)
    );
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedIpv4) return isPublicIp(mappedIpv4[1]);
    return !(
      normalized === "::" || normalized === "::1" ||
      /^(fc|fd|fe[89ab])/.test(normalized) ||
      normalized.startsWith("2001:db8:") ||
      normalized.startsWith("2001:10:")
    );
  }

  return false;
}

async function isPublicHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;

  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every(({ address }) => isPublicIp(address));
  } catch {
    return false;
  }
}

async function fetchPublicPage(pageUrl, signal) {
  let currentUrl = new URL(pageUrl);
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    if (!["http:", "https:"].includes(currentUrl.protocol) || !(await isPublicHost(currentUrl.hostname))) {
      const error = new Error("La web redirige a una dirección que no es pública.");
      error.code = "URL_NOT_PUBLIC";
      throw error;
    }

    const response = await fetch(currentUrl, {
      signal,
      headers: FETCH_HEADERS,
      cache: "no-store",
      redirect: "manual",
    });
    if (response.status < 300 || response.status > 399) return { response, url: currentUrl };
    const location = response.headers.get("location");
    if (!location) return { response, url: currentUrl };
    currentUrl = new URL(location, currentUrl);
  }

  const error = new Error("La web realizó demasiadas redirecciones. Comprueba que el dominio sea correcto.");
  error.code = "TOO_MANY_REDIRECTS";
  throw error;
}

function parseStructuredData($) {
  const entries = [];
  $("script[type='application/ld+json']").each((index, element) => {
    try {
      entries.push(JSON.parse($(element).contents().text()));
    } catch {
      // Ignore malformed JSON-LD and keep extracting regular HTML.
    }
  });

  const flattened = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      flattened.push(value);
      Object.values(value).forEach(visit);
    }
  };
  entries.forEach(visit);
  return flattened;
}

function isRestaurantSchema(item) {
  const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
  return types.some((type) => /restaurant|foodestablishment|bakery|cafeorcoffeeshop|barorpub/i.test(type || ""));
}

function imageUrl(element, $, baseUrl) {
  const source = $(element);
  const candidates = [
    source.attr("src"),
    source.attr("data-src"),
    source.attr("data-lazy-src"),
    source.attr("data-original"),
    source.attr("srcset")?.split(",").pop()?.trim().split(/\s+/)[0],
    source.attr("data-srcset")?.split(",").pop()?.trim().split(/\s+/)[0],
  ];
  for (const candidate of candidates) {
    const resolved = absoluteUrl(candidate, baseUrl);
    if (resolved) return resolved;
  }
  return "";
}

function addDish(dishes, menu, dish) {
  if (!dish.name && !dish.price && !dish.description && !dish.image) return;
  if (dishes.some((item) => item.name === dish.name && item.price === dish.price)) return;
  dishes.push(dish);

  const text = `${dish.name} ${dish.description}`.toLowerCase();
  if (/postre|tarta|dulce|helado|dessert/.test(text)) menu.Postres.push(dish);
  else if (/vino|cerveza|refresco|bebida|drink|cocktail/.test(text)) menu.Bebidas.push(dish);
  else if (/entrante|starter|aperitivo|ensalada/.test(text)) menu.Entrantes.push(dish);
  else menu.Principales.push(dish);
}

function readDishCards($, baseUrl, dishes, menu) {
  $("article, .product, .menu-item, .dish, [class*='menu-item'], [class*='dish']").each((index, element) => {
    const card = $(element);
    addDish(dishes, menu, {
      name: card.find("h3, h4, .name, .title").first().text().trim(),
      price: card.find(".price, .amount, [class*='price']").first().text().trim(),
      image: imageUrl(card.find("img").first(), $, baseUrl) || imageUrl(card.find("source").first(), $, baseUrl),
      description: card.find("p, .description").first().text().trim(),
    });
  });
}

function schemaAddress(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return [value.streetAddress, value.postalCode, value.addressLocality, value.addressRegion, value.addressCountry]
    .filter(Boolean)
    .join(", ");
}

function formatOpeningHours(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(formatOpeningHours).filter(Boolean).join(" · ");
  if (!value || typeof value !== "object") return "";

  const days = Array.isArray(value.dayOfWeek) ? value.dayOfWeek : [value.dayOfWeek];
  const dayNames = days.filter(Boolean).map((day) => String(day).split(/[\/#]/).pop()).join(", ");
  const times = [value.opens, value.closes].filter(Boolean).join("–");
  return [dayNames, times].filter(Boolean).join(": ");
}

export async function POST(req) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = await req.json();
    let requestedUrl;
    try {
      requestedUrl = new URL(body?.url);
    } catch {
      return NextResponse.json({ error: "Introduce una URL válida, por ejemplo https://restaurante.com." }, { status: 400 });
    }
    if (!["http:", "https:"].includes(requestedUrl.protocol)) {
      return NextResponse.json({ error: "La URL debe comenzar por http:// o https://." }, { status: 400 });
    }
    if (requestedUrl.username || requestedUrl.password) {
      return NextResponse.json({ error: "Introduce el dominio público del restaurante, sin usuario ni contraseña." }, { status: 400 });
    }
    if (!requestedUrl.hostname.includes(".") && !isIP(requestedUrl.hostname)) {
      return NextResponse.json({ error: "La web debe estar publicada y tener un dominio accesible desde internet." }, { status: 400 });
    }
    if (!(await isPublicHost(requestedUrl.hostname))) {
      return NextResponse.json({ error: "Solo se pueden leer sitios web con una dirección pública." }, { status: 400 });
    }

    const { response, url: pageUrl } = await fetchPublicPage(requestedUrl, controller.signal);
    if (!response.ok) {
      const reason = response.status === 401 || response.status === 403
        ? "El sitio denegó el acceso automático. Prueba con otra URL pública del restaurante."
        : response.status === 404
          ? "No encontramos esa página (404). Comprueba que la dirección sea la web oficial."
          : response.status === 429
            ? "El sitio está limitando las solicitudes. Espera un momento y vuelve a intentarlo."
            : response.status >= 500
              ? "El sitio está teniendo problemas ahora mismo. Vuelve a intentarlo más tarde."
              : `El sitio respondió con un error HTTP ${response.status}. Comprueba la dirección.`;
      return NextResponse.json(
        { error: reason },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      return NextResponse.json(
        { error: "La URL no apunta a una página web HTML. Prueba con la página principal del restaurante." },
        { status: 415 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pageDocuments = [{ $, url: pageUrl }];
    const menuLinks = new Set();
    $("a[href]").each((index, element) => {
      const anchor = $(element);
      const href = absoluteUrl(anchor.attr("href"), pageUrl);
      const label = `${anchor.text()} ${anchor.attr("aria-label") || ""}`;
      if (!href) return;
      try {
        const linkUrl = new URL(href);
        if (linkUrl.origin === pageUrl.origin && linkUrl.pathname !== pageUrl.pathname && MENU_LINK_PATTERN.test(`${label} ${linkUrl.pathname}`)) {
          linkUrl.hash = "";
          menuLinks.add(linkUrl.toString());
        }
      } catch {
        // Ignore non-navigation links.
      }
    });

    const linkedMenuPages = [...menuLinks].slice(0, 4);
    const menuResponses = await Promise.all(linkedMenuPages.map(async (url) => {
      try {
        const { response: menuResponse, url: menuUrl } = await fetchPublicPage(url, controller.signal);
        if (!menuResponse.ok || !menuResponse.headers.get("content-type")?.includes("text/html")) return null;
        return { html: await menuResponse.text(), url: menuUrl };
      } catch {
        return null;
      }
    }));
    for (const menuPage of menuResponses) {
      if (menuPage) pageDocuments.push({ $: cheerio.load(menuPage.html), url: menuPage.url });
    }

    const structuredData = pageDocuments.flatMap((page) => parseStructuredData(page.$));
    const restaurantSchema = structuredData.find(isRestaurantSchema) || {};
    const meta = (...selectors) => {
      for (const selector of selectors) {
        const value = $(selector).attr("content")?.trim();
        if (value) return value;
      }
      return "";
    };

    const name = restaurantSchema.name || $("h1").first().text().trim() || meta("meta[property='og:site_name']") || $("title").text().trim() || pageUrl.hostname.replace(/^www\./, "");
    const subtitle = $("h2").first().text().trim() || restaurantSchema.slogan || meta("meta[name='description']", "meta[property='og:description']") || restaurantSchema.description || "";
    const about = restaurantSchema.description || meta("meta[name='description']", "meta[property='og:description']") ||
      $("[id*='about'], [class*='about'], [id*='story'], [class*='story']").first().text().trim();
    const structuredImages = Array.isArray(restaurantSchema.image) ? restaurantSchema.image : [restaurantSchema.image];
    const heroImage = absoluteUrl(meta("meta[property='og:image']", "meta[name='twitter:image']"), pageUrl) ||
      absoluteUrl(structuredImages.find((image) => typeof image === "string") || structuredImages.find((image) => image?.url)?.url, pageUrl) ||
      imageUrl($("main img").first(), $, pageUrl) || imageUrl($("img").first(), $, pageUrl);

    const gallery = new Set(heroImage ? [heroImage] : []);
    const featuredDishes = [];
    const menu = { Entrantes: [], Principales: [], Postres: [], Bebidas: [] };
    const contentSections = [];
    const pageText = [];
    for (const page of pageDocuments) {
      const pageBase = page.url;
      pageText.push(page.$("body").text().replace(/\s+/g, " ").trim());
      page.$("img, picture source").each((index, element) => {
        const image = imageUrl(element, page.$, pageBase);
        if (image) gallery.add(image);
      });
      readDishCards(page.$, pageBase, featuredDishes, menu);
      page.$("h2, h3").each((index, element) => {
        const heading = page.$(element).text().trim();
        const text = page.$(element).parent().text().replace(/\s+/g, " ").trim();
        if (heading && text.length > heading.length && !contentSections.some((section) => section.title === heading)) {
          contentSections.push({ title: heading, text: text.slice(0, 500) });
        }
      });
    }

    for (const item of structuredData) {
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      if (!types.some((type) => /menuitem/i.test(type || ""))) continue;
      const itemImage = typeof item.image === "string" ? item.image : item.image?.url;
      addDish(featuredDishes, menu, {
        name: item.name || "",
        price: item.offers?.price ? `${item.offers.price} ${item.offers.priceCurrency || ""}`.trim() : "",
        image: absoluteUrl(itemImage, pageUrl),
        description: item.description || "",
      });
    }

    const address = schemaAddress(restaurantSchema.address) || $("address").first().text().trim() || $("p:contains('Dirección')").first().text().trim();
    const phone = restaurantSchema.telephone || $("a[href^='tel']").first().text().trim() || $("p:contains('Tel')").first().text().trim();
    const hours = formatOpeningHours(restaurantSchema.openingHoursSpecification || restaurantSchema.openingHours) ||
      $("p:contains('Horario')").first().text().trim() || $("time").text().trim();
    const inlineStyles = pageDocuments.map((page) => `${page.$("style").text()} ${page.$("[style]").map((index, element) => page.$(element).attr("style")).get().join(" ")}`).join(" ");
    const colorCounts = new Map();
    for (const color of inlineStyles.match(/#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi) || []) {
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }
    const themeColor = meta("meta[name='theme-color']");
    const themeColors = [themeColor, ...[...colorCounts.entries()].sort((first, second) => second[1] - first[1]).map(([color]) => color)]
      .filter((color, index, colors) => color && colors.indexOf(color) === index).slice(0, 8);
    const social = {};
    const sameAs = Array.isArray(restaurantSchema.sameAs) ? restaurantSchema.sameAs : [restaurantSchema.sameAs];
    for (const socialUrl of sameAs) {
      if (!socialUrl) continue;
      const host = new URL(socialUrl).hostname.replace(/^www\./, "");
      const network = SOCIAL_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`));
      if (network) social[network] = socialUrl;
    }
    $("a[href]").each((index, element) => {
      const href = absoluteUrl($(element).attr("href"), pageUrl);
      if (!href) return;
      const host = new URL(href).hostname.replace(/^www\./, "");
      const network = SOCIAL_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`));
      if (network && !social[network]) social[network] = href;
    });

    const detectionText = `${name} ${subtitle} ${restaurantSchema.servesCuisine || ""} ${restaurantSchema.menu || ""} ${pageText.join(" ")}`;
    const hasMenuSignal = menuLinks.size > 0 || featuredDishes.length > 0 || Boolean(restaurantSchema.menu || restaurantSchema.hasMenu);
    const hasRestaurantContact = Boolean(address || phone || restaurantSchema.servesCuisine);
    if (!isRestaurantSchema(restaurantSchema) && !(RESTAURANT_PATTERN.test(detectionText) && (hasMenuSignal || hasRestaurantContact))) {
      return NextResponse.json(
        { error: "No encontramos señales suficientes de que esta URL sea un restaurante. Prueba con la web principal o la página de su carta." },
        { status: 422 }
      );
    }

    const location = restaurantSchema.address && typeof restaurantSchema.address === "object"
      ? restaurantSchema.address
      : {};
    const mapAddress = schemaAddress(location) || address;
    const result = {
      sourceUrl: requestedUrl.toString(),
      name,
      subtitle,
      about,
      contentSections: contentSections.slice(0, 20),
      cuisine: restaurantSchema.servesCuisine || "",
      heroImage,
      featuredDishes: featuredDishes.slice(0, 80),
      menu,
      reviews: (Array.isArray(restaurantSchema.review) ? restaurantSchema.review : restaurantSchema.review ? [restaurantSchema.review] : []).slice(0, 20),
      rating: restaurantSchema.aggregateRating || null,
      gallery: [...gallery].slice(0, 48),
      social,
      themeColor,
      themeColors,
      menuUrl: linkedMenuPages[0] || "",
      location: {
        address,
        mapUrl: mapAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}` : "",
        phone,
        hours,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error en /api/generate:", error);
    const timedOut = error.name === "AbortError";
    const privateRedirect = error.code === "URL_NOT_PUBLIC";
    const tooManyRedirects = error.code === "TOO_MANY_REDIRECTS";
    return NextResponse.json(
      { error: timedOut ? "La web tardó demasiado en responder. Comprueba la URL e inténtalo de nuevo." : privateRedirect || tooManyRedirects ? error.message : error instanceof TypeError ? "No se pudo conectar con esa web. Comprueba el dominio y que sea accesible desde internet." : "No se pudo leer esa web. Puede requerir JavaScript o bloquear solicitudes automáticas; prueba con la página principal o una URL pública de su carta." },
      { status: timedOut ? 504 : privateRedirect ? 400 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}