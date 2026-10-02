"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FoodScene from "@/components/restaurant/FoodScene";

const TABLE_IMAGE = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80";
const CUISINES = {
  hamburgueseria: "Hamburguesería",
  sushi: "Cocina japonesa",
  italiano: "Cocina italiana",
  mexicano: "Cocina mexicana",
  tapas: "Cocina de tapas",
  general: "Restaurante",
};
const EMPTY_DISH = { name: "", description: "", price: "" };
const INITIAL_MANUAL_FORM = {
  name: "",
  category: "general",
  subtitle: "",
  about: "",
  heroImage: "",
  brandColor: "#8e4931",
  address: "",
  phone: "",
  hours: "",
  dishes: [{ ...EMPTY_DISH }, { ...EMPTY_DISH }, { ...EMPTY_DISH }],
};

function normalizeRestaurantUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Escribe la dirección de la web del restaurante.");

  let parsed;
  try {
    parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("No reconocemos esa dirección. Prueba con restaurante.com.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("La dirección debe empezar por http:// o https://.");
  }
  if (!parsed.hostname.includes(".") || parsed.username || parsed.password) {
    throw new Error("Introduce el dominio público del restaurante, sin usuario ni contraseña.");
  }
  if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase())) {
    throw new Error("La web debe estar publicada y ser accesible desde internet.");
  }

  return parsed.toString();
}

function normalizeImageUrl(value) {
  if (!value.trim()) return "";
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error("La foto debe tener una URL pública válida.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("La foto debe usar una dirección http o https.");
  }
  return parsed.toString();
}

async function readApiResponse(response, fallbackMessage) {
  const responseText = await response.text();
  let payload;

  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(`El servidor respondió con un formato inesperado (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(payload?.error || `${fallbackMessage} (HTTP ${response.status}).`);
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("El servidor devolvió una respuesta vacía. Inténtalo de nuevo.");
  }

  return payload;
}

export default function GeneratePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [urlReady, setUrlReady] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState(INITIAL_MANUAL_FORM);

  async function openProposal(restaurant, design) {
    const enhancedRestaurant = {
      ...restaurant,
      subtitle: design.aiCopy?.subtitle || restaurant.subtitle,
      about: design.aiCopy?.about || restaurant.about,
    };
    localStorage.setItem("restaurant", JSON.stringify(enhancedRestaurant));
    localStorage.setItem("design", JSON.stringify(design));

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant: enhancedRestaurant, design }),
      });
      if (!response.ok) {
        if (response.status < 500) {
          await readApiResponse(response, "No se pudo guardar la propuesta");
        }
        throw new Error("No se pudo crear un enlace compartible.");
      }

      const proposal = await readApiResponse(response, "No se pudo guardar la propuesta");
      if (!proposal.id) throw new Error("La propuesta se guardó sin devolver un enlace.");
      localStorage.removeItem("proposal-share-warning");
      router.push(`/preview/${proposal.id}`);
    } catch (err) {
      console.warn("Se abrirá la vista local porque no se pudo compartir la propuesta.", err);
      localStorage.setItem("proposal-share-warning", "true");
      router.push("/preview/demo");
    }
  }

  function handleUrlBlur() {
    if (!url.trim()) return;
    try {
      setUrl(normalizeRestaurantUrl(url));
      setUrlReady(true);
      setError("");
    } catch (err) {
      setUrlReady(false);
      setError(err.message);
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    let normalizedUrl;
    try {
      normalizedUrl = normalizeRestaurantUrl(url);
      setUrl(normalizedUrl);
      setUrlReady(true);
    } catch (err) {
      setUrlReady(false);
      setError(err.message);
      return;
    }

    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      setStage("Leyendo la web del restaurante...");
      const scrapeRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: controller.signal,
      });
      const scrape = await readApiResponse(scrapeRes, "No se pudo leer la web");

      setStage("Creando una propuesta visual...");
      const designRes = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrape),
        signal: controller.signal,
      });
      const design = await readApiResponse(designRes, "No se pudo preparar el diseño");

      await openProposal(scrape, design);
    } catch (err) {
      console.error(err);
      setError(err.name === "AbortError"
        ? "La generación ha tardado demasiado. Revisa la URL e inténtalo de nuevo."
        : err instanceof Error ? err.message : "Hubo un error generando la web.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setStage("");
    }
  }

  function updateManualField(event) {
    const { name, value } = event.target;
    setManualForm((current) => ({ ...current, [name]: value }));
  }

  function updateManualDish(index, field, value) {
    setManualForm((current) => ({
      ...current,
      dishes: current.dishes.map((dish, dishIndex) => dishIndex === index ? { ...dish, [field]: value } : dish),
    }));
  }

  async function handleManualGenerate(event) {
    event.preventDefault();
    const name = manualForm.name.trim();
    if (!name) {
      setError("Escribe el nombre del restaurante para continuar.");
      return;
    }

    let sourceUrl;
    let heroImage;
    try {
      sourceUrl = url.trim() ? normalizeRestaurantUrl(url) : "";
      heroImage = normalizeImageUrl(manualForm.heroImage);
    } catch (err) {
      setError(err.message);
      return;
    }

    const featuredDishes = manualForm.dishes
      .map((dish) => ({ name: dish.name.trim(), description: dish.description.trim(), price: dish.price.trim() }))
      .filter((dish) => dish.name)
      .map((dish, index) => ({ ...dish, image: index === 0 ? heroImage : "" }));
    const address = manualForm.address.trim();
    const restaurant = {
      sourceUrl,
      name,
      cuisine: CUISINES[manualForm.category],
      subtitle: manualForm.subtitle.trim(),
      about: manualForm.about.trim(),
      heroImage,
      featuredDishes,
      menu: { Entrantes: [], Principales: featuredDishes, Postres: [], Bebidas: [] },
      reviews: [],
      gallery: heroImage ? [heroImage] : [],
      social: {},
      themeColor: manualForm.brandColor,
      themeColors: [manualForm.brandColor],
      location: {
        address,
        mapUrl: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "",
        phone: manualForm.phone.trim(),
        hours: manualForm.hours.trim(),
      },
    };

    setLoading(true);
    setError("");
    setStage("Preparando la propuesta...");
    try {
      const designResponse = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant),
      });
      const design = await readApiResponse(designResponse, "No se pudo preparar el diseño");
      await openProposal(restaurant, design);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo preparar la propuesta.");
    } finally {
      setLoading(false);
      setStage("");
    }
  }

  return (
    <main className="builder-page">
      <header className="builder-nav">
        <Link className="landing-wordmark" href="/">mise<span>.</span></Link>
        <Link href="/">Volver al inicio <span aria-hidden="true">↗</span></Link>
      </header>
      <div className="builder-layout">
        <section className="builder-intro">
          <p className="landing-kicker"><span /> TU PRÓXIMA WEB EMPIEZA AQUÍ</p>
          <h1>Primero,<br />cuéntanos <em>dónde.</em></h1>
          <p>Usaremos la información pública de tu restaurante para preparar una propuesta visual que puedas recorrer y comparar.</p>
          <div className="builder-assurance"><span aria-hidden="true">↳</span><p>Necesitamos una web publicada. Las páginas privadas y las redes sociales no se pueden analizar.</p></div>
          <div className="builder-scene">
            <FoodScene type="general" accent="#a94635" fallbackImage={TABLE_IMAGE} />
          </div>
        </section>

        <section className="builder-form-panel" aria-labelledby="builder-heading">
          <div className="builder-form-topline"><span>{manualMode ? "FICHA MANUAL" : "PASO 01"}</span><span>{manualMode ? "DATOS DEL RESTAURANTE" : "URL DEL RESTAURANTE"}</span></div>
          {manualMode ? (
            <>
              <h2 id="builder-heading">Cuéntanos lo esencial.</h2>
              <p className="builder-form-description">Con unos pocos datos creamos una primera propuesta. Completa solo lo que tengas a mano.</p>
              <form className="manual-form" onSubmit={handleManualGenerate}>
                <div className="manual-grid">
                  <label className="manual-field manual-field-wide" htmlFor="manual-name">Nombre del restaurante<input id="manual-name" name="name" autoComplete="organization" value={manualForm.name} onChange={updateManualField} placeholder="La mesa de siempre" required disabled={loading} /></label>
                  <label className="manual-field" htmlFor="manual-category">Tipo de cocina<select id="manual-category" name="category" value={manualForm.category} onChange={updateManualField} disabled={loading}><option value="general">Restaurante</option><option value="hamburgueseria">Hamburguesería</option><option value="sushi">Japonesa</option><option value="italiano">Italiana</option><option value="mexicano">Mexicana</option><option value="tapas">Tapas</option></select></label>
                  <label className="manual-field" htmlFor="manual-color">Color de marca<span className="manual-color-input"><input id="manual-color" name="brandColor" type="color" value={manualForm.brandColor} onChange={updateManualField} disabled={loading} /><span>{manualForm.brandColor.toUpperCase()}</span></span></label>
                  <label className="manual-field manual-field-wide" htmlFor="manual-subtitle">Frase de presentación<input id="manual-subtitle" name="subtitle" value={manualForm.subtitle} onChange={updateManualField} placeholder="Una cocina para compartir" disabled={loading} /></label>
                  <label className="manual-field manual-field-wide" htmlFor="manual-about">Historia o especialidad<textarea id="manual-about" name="about" rows="3" value={manualForm.about} onChange={updateManualField} placeholder="¿Qué hace especial a este restaurante?" disabled={loading} /></label>
                  <label className="manual-field manual-field-wide" htmlFor="manual-image">Foto destacada (URL, opcional)<input id="manual-image" name="heroImage" type="url" inputMode="url" value={manualForm.heroImage} onChange={updateManualField} placeholder="https://..." disabled={loading} /></label>
                </div>

                <fieldset className="manual-dishes">
                  <legend>Platos destacados</legend>
                  {manualForm.dishes.map((dish, index) => (
                    <div className="manual-dish-row" key={index}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <label className="manual-field" htmlFor={`manual-dish-${index}`}>Nombre<input id={`manual-dish-${index}`} value={dish.name} onChange={(event) => updateManualDish(index, "name", event.target.value)} placeholder="Plato de temporada" disabled={loading} /></label>
                      <label className="manual-field" htmlFor={`manual-dish-description-${index}`}>Descripción<input id={`manual-dish-description-${index}`} value={dish.description} onChange={(event) => updateManualDish(index, "description", event.target.value)} placeholder="Ingredientes, sabor..." disabled={loading} /></label>
                      <label className="manual-field manual-price-field" htmlFor={`manual-dish-price-${index}`}>Precio<input id={`manual-dish-price-${index}`} value={dish.price} onChange={(event) => updateManualDish(index, "price", event.target.value)} placeholder="12 €" disabled={loading} /></label>
                    </div>
                  ))}
                </fieldset>

                <div className="manual-grid">
                  <label className="manual-field manual-field-wide" htmlFor="manual-address">Dirección<input id="manual-address" name="address" autoComplete="street-address" value={manualForm.address} onChange={updateManualField} placeholder="Calle, ciudad" disabled={loading} /></label>
                  <label className="manual-field" htmlFor="manual-phone">Teléfono<input id="manual-phone" name="phone" type="tel" autoComplete="tel" value={manualForm.phone} onChange={updateManualField} placeholder="+34 ..." disabled={loading} /></label>
                  <label className="manual-field" htmlFor="manual-hours">Horario<input id="manual-hours" name="hours" value={manualForm.hours} onChange={updateManualField} placeholder="Lun–sáb, 13:00–23:00" disabled={loading} /></label>
                  <label className="manual-field manual-field-wide" htmlFor="manual-source-url">Web original (opcional)<input id="manual-source-url" type="text" inputMode="url" autoComplete="url" value={url} onBlur={handleUrlBlur} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="restaurante.com" disabled={loading} /></label>
                </div>

                {error && <p className="builder-error" role="alert">{error}</p>}
                {loading && <p className="builder-progress" role="status"><span />{stage}</p>}
                <button className="builder-submit" type="submit" disabled={loading}><span>{loading ? "Preparando propuesta..." : "Crear propuesta"}</span><span aria-hidden="true">{loading ? "···" : "↗"}</span></button>
              </form>
              <button className="builder-manual-link" type="button" onClick={() => { setManualMode(false); setError(""); }}>← Volver a probar con una URL</button>
            </>
          ) : (
            <>
              <h2 id="builder-heading">¿Cuál es su página web?</h2>
              <p className="builder-form-description">Pega el enlace de la web oficial. También aceptamos dominios sin “https://”.</p>
              <form onSubmit={handleGenerate} noValidate>
                <label htmlFor="restaurant-url">Dirección del sitio</label>
                <div className={`builder-input-wrap${urlReady ? " is-ready" : ""}`}>
                  <span aria-hidden="true">↗</span>
                  <input
                    id="restaurant-url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="restaurante.com"
                    value={url}
                    onBlur={handleUrlBlur}
                    onChange={(event) => { setUrl(event.target.value); setUrlReady(false); setError(""); }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "builder-error" : "builder-hint"}
                    disabled={loading}
                  />
                  {urlReady && <span className="builder-valid-mark" aria-label="Dirección válida">✓</span>}
                </div>
                {error
                  ? <p id="builder-error" className="builder-error" role="alert">{error}</p>
                  : <p id="builder-hint" className="builder-hint">Ejemplo: <span>www.restaurante.es</span></p>}
                {loading && <p className="builder-progress" role="status"><span />{stage}</p>}
                <button className="builder-submit" type="submit" disabled={loading}>
                  <span>{loading ? "Preparando propuesta..." : "Analizar restaurante"}</span>
                  <span aria-hidden="true">{loading ? "···" : "↗"}</span>
                </button>
              </form>
              <button className="builder-manual-link" type="button" onClick={() => { setManualMode(true); setError(""); }}>Prefiero completar la ficha manualmente <span aria-hidden="true">↗</span></button>
              <div className="builder-privacy"><span aria-hidden="true">◇</span><p>Solo analizamos páginas públicas. No guardamos contraseñas ni iniciamos sesión.</p></div>
            </>
          )}
        </section>
      </div>
      <footer className="builder-footer"><span>MISE / ESTUDIO DIGITAL PARA RESTAURANTES</span><Link href="/">Descubre el proyecto <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}
