import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();

    const { name, featuredDishes, gallery, menu } = data;

    // Detectar tipo de restaurante según platos
    const allNames = featuredDishes.map(d => d.name.toLowerCase()).join(" ");

    let type = "general";

    if (allNames.includes("burger") || allNames.includes("hamburguesa")) {
      type = "hamburgueseria";
    } else if (allNames.includes("sushi") || allNames.includes("maki") || allNames.includes("nigiri")) {
      type = "sushi";
    } else if (allNames.includes("pizza") || allNames.includes("pasta")) {
      type = "italiano";
    } else if (allNames.includes("taco") || allNames.includes("burrito")) {
      type = "mexicano";
    } else if (allNames.includes("tapa") || allNames.includes("croqueta")) {
      type = "tapas";
    } else if (allNames.includes("vino") || allNames.includes("carpaccio")) {
      type = "gourmet";
    }

    // Temas visuales según tipo
    const themes = {
      hamburgueseria: {
        colors: ["#ffcc00", "#b30000"],
        font: "Bebas Neue",
        layout: "bold-cards",
        animations: "pop-bounce",
        hero3D: "https://spline.design/hamburguesa-3d",
      },
      sushi: {
        colors: ["#ffffff", "#e60000", "#000000"],
        font: "Noto Serif JP",
        layout: "minimal-clean",
        animations: "fade-smooth",
        hero3D: "https://spline.design/sushi-3d",
      },
      italiano: {
        colors: ["#006600", "#cc0000", "#f2e6d9"],
        font: "Playfair Display",
        layout: "rustic-premium",
        animations: "parallax-soft",
        hero3D: "https://spline.design/pizza-3d",
      },
      mexicano: {
        colors: ["#ff6600", "#009933", "#cc0000"],
        font: "Montserrat",
        layout: "vibrant-cards",
        animations: "shake-fun",
        hero3D: "https://spline.design/taco-3d",
      },
      tapas: {
        colors: ["#990000", "#f2f2f2"],
        font: "Inter",
        layout: "grid-gallery",
        animations: "slide-up",
        hero3D: "https://spline.design/tapas-3d",
      },
      gourmet: {
        colors: ["#000000", "#d4af37"],
        font: "Cormorant Garamond",
        layout: "luxury-minimal",
        animations: "slow-fade",
        hero3D: "https://spline.design/wine-3d",
      },
      general: {
        colors: ["#333333", "#ffffff"],
        font: "Inter",
        layout: "clean-default",
        animations: "fade",
        hero3D: "https://spline.design/food-3d",
      },
    };

    const theme = themes[type];

    const result = {
      type,
      ...theme,
      galleryPreview: gallery.slice(0, 6),
      hasMenu: menu && Object.values(menu).some(arr => arr.length > 0),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Error en /api/design:", error);
    return NextResponse.json(
      { error: "Error interpretando el diseño del restaurante." },
      { status: 500 }
    );
  }
}
