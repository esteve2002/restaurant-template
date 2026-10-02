import { NextResponse } from "next/server";
import { colorSaturation, contrastOnWhite } from "@/lib/restaurantColors";
import { interpretRestaurant } from "@/lib/geminiRestaurant";

export async function POST(req) {
  try {
    const data = await req.json();
    const featuredDishes = Array.isArray(data.featuredDishes) ? data.featuredDishes : [];
    const gallery = Array.isArray(data.gallery) ? data.gallery : [];
    const menu = data.menu && typeof data.menu === "object" ? data.menu : {};
    const contentText = Array.isArray(data.contentSections)
      ? data.contentSections.flatMap((section) => [section?.title, section?.text])
      : [];
    const menuText = Object.values(menu).flatMap((items) => Array.isArray(items) ? items.map((item) => item?.name) : []);
    const allNames = [data.name, data.subtitle, data.about, data.cuisine, ...contentText, ...menuText, ...featuredDishes.map((dish) => dish?.name)]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase();

    let type = "general";

    if (/burger|hamburgues|hamburger/.test(allNames)) {
      type = "hamburgueseria";
    } else if (/sushi|maki|nigiri|japonesa|japonés/.test(allNames)) {
      type = "sushi";
    } else if (/pizza|pasta|italiano|italiana/.test(allNames)) {
      type = "italiano";
    } else if (/taco|burrito|mexican[oa]/.test(allNames)) {
      type = "mexicano";
    } else if (/tapa|croqueta|español[oa]/.test(allNames)) {
      type = "tapas";
    } else if (/vino|carpaccio|degustación|fine dining/.test(allNames)) {
      type = "gourmet";
    }

    const themes = {
      hamburgueseria: {
        colors: ["#f2b632", "#28231f"],
        font: "Impact, sans-serif",
        layout: "bold-cards",
        accent: "#6f351f",
      },
      sushi: {
        colors: ["#ffffff", "#e60000", "#000000"],
        font: "Georgia, serif",
        layout: "minimal-clean",
        accent: "#a61920",
      },
      italiano: {
        colors: ["#006600", "#cc0000", "#f2e6d9"],
        font: "Georgia, serif",
        layout: "rustic-premium",
        accent: "#9b3c2e",
      },
      mexicano: {
        colors: ["#ff6600", "#009933", "#cc0000"],
        font: "Trebuchet MS, sans-serif",
        layout: "vibrant-cards",
        accent: "#9e482a",
      },
      tapas: {
        colors: ["#990000", "#f2f2f2"],
        font: "Georgia, serif",
        layout: "grid-gallery",
        accent: "#a13f35",
      },
      gourmet: {
        colors: ["#000000", "#d4af37"],
        font: "Georgia, serif",
        layout: "luxury-minimal",
        accent: "#755020",
      },
      general: {
        colors: ["#333333", "#ffffff"],
        font: "Georgia, serif",
        layout: "clean-default",
        accent: "#8e4931",
      },
    };

    let aiCopy = null;
    try {
      aiCopy = await interpretRestaurant(data, type);
    } catch (error) {
      console.warn("Gemini no pudo interpretar la propuesta; se usará el diseño estándar.", error.message);
    }
    if (type === "general" && aiCopy?.type) type = aiCopy.type;

    const theme = themes[type];
    const sourceColors = Array.isArray(data.themeColors)
      ? data.themeColors.filter((color) =>
          typeof color === "string" &&
          (/^#[\da-f]{3,8}$/i.test(color) || /^rgba?\([\d\s.,%/+-]+\)$/i.test(color) || /^hsla?\([\d\s.,%/+-]+\)$/i.test(color))
        )
      : [];
    const brandColor = sourceColors.find((color) => contrastOnWhite(color) >= 4.5) || theme.accent;
    const signatureColor = sourceColors.find((color) => colorSaturation(color) >= 0.4) || theme.colors[0];
    const paperColor = sourceColors.find((color) => contrastOnWhite(color) <= 1.3 && colorSaturation(color) < 0.18) || null;
    const inkColor = sourceColors.find((color) => contrastOnWhite(color) >= 7) || null;
    const colors = [...new Set([brandColor, signatureColor, ...sourceColors, ...theme.colors])];

    const result = {
      type,
      ...theme,
      colors,
      brandColor,
      signatureColor,
      paperColor,
      inkColor,
      aiEnhanced: Boolean(aiCopy),
      aiCopy,
      galleryPreview: gallery.slice(0, 8),
      hasMenu: Object.values(menu).some((items) => Array.isArray(items) && items.length > 0),
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
