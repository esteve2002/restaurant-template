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

    // Nombre del restaurante
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

    // Galería de imágenes
    const gallery = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !gallery.includes(src)) {
        gallery.push(src);
      }
    });

    // Platos destacados y menú
    const featuredDishes = [];
    const menu = {
      Entrantes: [],
      Principales: [],
      Postres: [],
      Bebidas: [],
    };

    $("article, .product, .menu-item, .dish, .card").each((i, el) => {
      const dishName = $(el).find("h3, .name, .title").first().text().trim();
      const price = $(el).find(".price, .amount").first().text().trim();
      const image = $(el).find("img").first().attr("src") || "";
      const description = $(el).find("p, .description").first().text().trim();

      if (dishName || price || image || description) {
        const dish = { name: dishName, price, image, description };
        featuredDishes.push(dish);

        const lower = dishName.toLowerCase();

        if (lower.includes("postre") || lower.includes("tarta")) {
          menu.Postres.push(dish);
        } else if (
          lower.includes("vino") ||
          lower.includes("cerveza") ||
          lower.includes("refresco")
        ) {
          menu.Bebidas.push(dish);
        } else if (
          lower.includes("entrante") ||
          lower.includes("starter") ||
          lower.includes("aperitivo")
        ) {
          menu.Entrantes.push(dish);
        } else {
          menu.Principales.push(dish);
        }
      }
    });

    // Dirección, teléfono, horarios
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

    const result = {
      name,
      subtitle,
      heroImage,
      about: "",
      featuredDishes,
      menu,
      reviews: [],
      gallery,
      location: {
        address,
        mapUrl: "",
        phone,
        hours,
      },
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Error en /api/generate:", error);
    return NextResponse.json(
      { error: "Error generando la web del restaurante." },
      { status: 500 }
    );
  }
}
