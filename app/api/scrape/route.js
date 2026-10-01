import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna URL." },
        { status: 400 }
      );
    }

    // Descargar HTML
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo acceder a la URL: ${res.status}` },
        { status: 500 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Nombre del restaurante (intentos genéricos)
    const name =
      $("h1").first().text().trim() ||
      $("meta[property='og:site_name']").attr("content") ||
      $("title").text().trim() ||
      "";

    // Subtítulo / descripción corta
    const subtitle =
      $("h2").first().text().trim() ||
      $("meta[name='description']").attr("content") ||
      "";

    // Imagen principal (hero)
    const heroImage =
      $("meta[property='og:image']").attr("content") ||
      $("img").first().attr("src") ||
      "";

    // Galería de imágenes (todas las <img>)
    const gallery = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !gallery.includes(src)) {
        gallery.push(src);
      }
    });

    // Menú genérico: buscar bloques de productos
    const featuredDishes = [];
    const menuSections = {
      Entrantes: [],
      Principales: [],
      Postres: [],
      Bebidas: [],
    };

    // Intento genérico: artículos, cards, productos
    $("article, .product, .menu-item, .dish, .card").each((i, el) => {
      const name = $(el).find("h3, .name, .title").first().text().trim();
      const price = $(el).find(".price, .amount").first().text().trim();
      const image = $(el).find("img").first().attr("src") || "";
      const description = $(el).find("p, .description").first().text().trim();

      if (name || price || image || description) {
        const dish = { name, price, image, description };

        // Lo metemos como destacado
        featuredDishes.push(dish);

        // Clasificación muy básica por nombre
        const lower = name.toLowerCase();
        if (lower.includes("postre") || lower.includes("tarta") || lower.includes("dulce")) {
          menuSections.Postres.push(dish);
        } else if (
          lower.includes("bebida") ||
          lower.includes("vino") ||
          lower.includes("cerveza") ||
          lower.includes("refresco")
        ) {
          menuSections.Bebidas.push(dish);
        } else if (
          lower.includes("entrante") ||
          lower.includes("starter") ||
          lower.includes("aperitivo")
        ) {
          menuSections.Entrantes.push(dish);
        } else {
          menuSections.Principales.push(dish);
        }
      }
    });

    // Dirección, teléfono, horarios (si existen)
    const address =
      $("address").text().trim() ||
      $("p:contains('Dirección')").text().trim() ||
      "";

    const phone =
      $("a[href^='tel']").first().text().trim() ||
      $("p:contains('Tel')").text().trim() ||
      "";

    const hours =
      $("p:contains('Horario')").text().trim() ||
      $("time").text().trim() ||
      "";

    const location = {
      address,
      mapUrl: "",
      phone,
      hours,
    };

    const result = {
      name,
      subtitle,
      heroImage,
      about: "", // esto lo puedes rellenar luego con IA si quieres
      featuredDishes,
      menu: menuSections,
      reviews: [], // se puede añadir luego
      gallery,
      location,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error en /api/scrape:", error);
    return NextResponse.json(
      { error: "Error haciendo scraping del restaurante." },
      { status: 500 }
    );
  }
}
