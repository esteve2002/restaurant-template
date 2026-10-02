"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import FoodScene from "@/components/restaurant/FoodScene";
import { colorSaturation, contrastOnWhite } from "@/lib/restaurantColors";

const socialNames = {
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "tiktok.com": "TikTok",
  "youtube.com": "YouTube",
  "x.com": "X",
  "twitter.com": "X",
  "linkedin.com": "LinkedIn",
};
const cuisineNames = {
  hamburgueseria: "Hamburguesería",
  sushi: "Cocina japonesa",
  italiano: "Cocina italiana",
  mexicano: "Cocina mexicana",
  tapas: "Cocina de tapas",
  gourmet: "Cocina de autor",
  general: "Restaurante",
};
const accentFallbacks = {
  hamburgueseria: "#6f351f",
  sushi: "#a61920",
  italiano: "#9b3c2e",
  mexicano: "#9e482a",
  tapas: "#a13f35",
  gourmet: "#755020",
  general: "#8e4931",
};

function cleanDishName(value) {
  const name = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  for (let size = 4; size <= name.length / 2; size += 1) {
    if (name.length % size === 0 && name === name.slice(0, size).repeat(name.length / size)) {
      return name.slice(0, size);
    }
  }
  return name;
}

export default function DemoPage({ proposalId = null }) {
  const [data, setData] = useState(null);
  const [design, setDesign] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("compare");
  const [copied, setCopied] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProposal() {
      try {
        if (proposalId) {
          const response = await fetch(`/api/proposals/${encodeURIComponent(proposalId)}`, { cache: "no-store" });
          const proposal = await response.json();
          if (!response.ok) throw new Error(proposal?.error || "No se pudo cargar esta propuesta.");
          if (active) {
            setData(proposal.restaurant);
            setDesign(proposal.design);
            setView(proposal.restaurant?.sourceUrl ? "compare" : "redesign");
          }
          return;
        }

        const restaurant = localStorage.getItem("restaurant");
        const designData = localStorage.getItem("design");
        if (!restaurant || !designData) {
          if (active) setError("No encontramos los datos de esta propuesta.");
          return;
        }
        if (active) {
          const restaurantData = JSON.parse(restaurant);
          setData(restaurantData);
          setDesign(JSON.parse(designData));
          setView(restaurantData.sourceUrl ? "compare" : "redesign");
          setLocalOnly(true);
        }
      } catch {
        if (active) setError(proposalId
          ? "No se pudo abrir este enlace. Comprueba la configuración de propuestas compartidas."
          : "No se pudieron cargar los datos guardados. Genera una propuesta nueva.");
      }
    }
    loadProposal();
    return () => { active = false; };
  }, [proposalId]);

  async function copyProposalLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("No se pudo copiar el enlace. Copia la dirección desde el navegador.");
    }
  }

  if (error) {
    return (
      <main className="preview-message">
        <p>{error}</p>
        <a href="/generate">Volver a generar</a>
      </main>
    );
  }

  if (!data || !design) {
    return <main className="preview-message" role="status">Preparando la propuesta...</main>;
  }

  const dishes = Array.isArray(data.featuredDishes) ? data.featuredDishes : [];
  const gallery = Array.isArray(data.gallery) ? data.gallery : [];
  const menu = data.menu && typeof data.menu === "object" ? data.menu : {};
  const menuSections = Object.entries(menu).filter(([, items]) => Array.isArray(items) && items.length);
  const colors = Array.isArray(design.colors) ? design.colors : [];
  const accent = [design.brandColor, ...colors].find((color) => contrastOnWhite(color) >= 4.5) || accentFallbacks[design.type] || accentFallbacks.general;
  const secondaryAccent = design.signatureColor || colors.find((color) => colorSaturation(color) >= 0.4) || "#e2b672";
  const featuredDish = dishes
    .map((dish) => ({ ...dish, name: cleanDishName(dish?.name) }))
    .find((dish) => dish.name && !/^(entrantes?|principales?|postres?|bebidas?|starters?|desserts?|drinks?|men[uú]deld[ií]a)$/i.test(dish.name.replace(/[\s_-]/g, "")));
  const heroImage = data.heroImage || gallery[0] || dishes.find((dish) => dish.image)?.image;
  const socialLinks = Object.entries(data.social || {});
  const reviews = Array.isArray(data.reviews) ? data.reviews : data.reviews ? [data.reviews] : [];
  const rating = Number(data.rating?.ratingValue || data.rating?.value || 0);

  return (
    <div className="comparison-shell">
      <header className="comparison-toolbar">
        <a className="comparison-brand" href="#inicio">{data.name}<span>{design.aiEnhanced ? "REDISEÑO IA" : "REDISEÑO"}</span></a>
        <div className="comparison-modes" role="group" aria-label="Modo de vista">
          {data.sourceUrl && <>
            <button type="button" aria-pressed={view === "compare"} onClick={() => setView("compare")}>Comparar</button>
            <button type="button" aria-pressed={view === "original"} onClick={() => setView("original")}>Web original</button>
          </>}
          <button type="button" aria-pressed={view === "redesign"} onClick={() => setView("redesign")}>Rediseño</button>
        </div>
        {proposalId
          ? <button className="comparison-share-link" type="button" onClick={copyProposalLink}>{copied ? "Enlace copiado" : "Copiar enlace ↗"}</button>
          : localOnly && <span className="comparison-local-note">Solo visible en este navegador · configura Supabase para compartir</span>}
        {data.sourceUrl && <a className="comparison-open-source" href={data.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir web original ↗</a>}
      </header>

      <div className={`comparison-workspace comparison-mode-${view}`}>
        {view !== "redesign" && data.sourceUrl && (
          <section className="comparison-pane original-pane" aria-label="Web original">
            <div className="comparison-pane-heading"><span><i /> WEB ACTUAL</span><a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir aparte ↗</a></div>
            <iframe
              className="original-site-frame"
              src={data.sourceUrl}
              title={`Web actual de ${data.name}`}
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <p className="original-site-note">Algunos sitios no permiten mostrarse dentro de otras páginas. <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir web original en otra pestaña ↗</a></p>
          </section>
        )}

        {view !== "original" && (
          <section className="comparison-pane redesign-pane" aria-label="Rediseño propuesto">
            <div className="comparison-pane-heading"><span><i /> NUEVA PROPUESTA</span><a href="#carta">Ver carta ↓</a></div>
            <div className="comparison-preview-viewport">
              <main
                className={`restaurant-page restaurant-${design.type || "general"}`}
                style={{
                  "--restaurant-accent": accent,
                  "--restaurant-accent-soft": secondaryAccent,
                  "--restaurant-signature": secondaryAccent,
                  "--restaurant-paper": design.paperColor || undefined,
                  "--restaurant-ink": design.inkColor || undefined,
                  "--restaurant-font": design.font || "Georgia, serif",
                }}
              >
      <header className="restaurant-nav">
        <a className="restaurant-wordmark" href="#inicio">{data.name}</a>
        <nav aria-label="Navegación principal">
          <a href="#carta">Carta</a>
          {gallery.length > 1 && <a href="#galeria">Galería</a>}
          <a href="#visitanos">Visítanos</a>
        </nav>
        {data.location?.phone && <a className="nav-reserve" href={`tel:${data.location.phone}`}>Reservar mesa</a>}
      </header>

      <section className="restaurant-hero" id="inicio">
        <div className="hero-copy">
          <p className="restaurant-eyebrow">{data.cuisine || cuisineNames[design.type] || "Restaurante"}</p>
          <h1>{data.name}</h1>
          {data.subtitle && <p className="hero-subtitle">{data.subtitle}</p>}
          <div className="hero-actions">
            <a className="button-primary" href="#carta">Explorar la carta <span aria-hidden="true">↗</span></a>
            {data.location?.phone && <a className="button-text" href={`tel:${data.location.phone}`}>Llamar para reservar <span aria-hidden="true">↗</span></a>}
          </div>
          {data.location?.address && <p className="hero-location">{data.location.address}</p>}
        </div>
        <div className="hero-scene" aria-label={`Imagen destacada de ${data.name}`}>
          {heroImage
            ? <Image className="hero-scene-image" src={heroImage} alt={`${data.name}, especialidad de la casa`} width={1400} height={1000} priority unoptimized />
            : <div className="hero-scene-placeholder" aria-hidden="true" />}
          <div className="hero-scene-wash" />
          <div className="hero-scene-index"><span>01</span>{data.cuisine || cuisineNames[design.type] || "De la casa"}</div>
          <div className="hero-food-stage">
            <FoodScene type={design.type || "general"} accent={secondaryAccent} />
          </div>
          {featuredDish && <div className="hero-caption"><span>Recomendación de la casa</span><strong>{featuredDish.name}</strong></div>}
        </div>
      </section>

      {data.about && (
        <section className="restaurant-intro">
          <p className="restaurant-eyebrow">Nuestra esencia</p>
          <p>{data.about}</p>
        </section>
      )}

      {Array.isArray(data.contentSections) && data.contentSections.length > 0 && (
        <section className="restaurant-section source-content-section">
          {data.contentSections.map((section, index) => (
            <article key={`${section.title}-${index}`}><p className="restaurant-eyebrow">{section.title}</p><p>{section.text}</p></article>
          ))}
        </section>
      )}

      <section className="restaurant-section menu-section" id="carta">
        <div className="section-heading">
          <div><p className="restaurant-eyebrow">Hecho para disfrutar</p><h2>La carta</h2></div>
          {data.menuUrl && <a className="button-text" href={data.menuUrl} target="_blank" rel="noreferrer">Carta original <span aria-hidden="true">↗</span></a>}
          {data.sourceUrl && <a className="button-text" href={data.sourceUrl} target="_blank" rel="noreferrer">Web original <span aria-hidden="true">↗</span></a>}
        </div>
        {menuSections.length ? (
          <div className="menu-sections">
            {menuSections.map(([section, items]) => (
              <div className="menu-category" key={section}>
                <h3>{section}</h3>
                {items.map((dish, index) => (
                  <article className="menu-line" key={`${dish.name}-${index}`}>
                    <div><h4>{dish.name || "Especialidad de la casa"}</h4>{dish.description && <p>{dish.description}</p>}</div>
                    {dish.price && <span>{dish.price}</span>}
                  </article>
                ))}
              </div>
            ))}
          </div>
        ) : dishes.length ? (
          <div className="dish-grid">
            {dishes.slice(0, 9).map((dish, index) => (
              <article className="dish-card" key={`${dish.name}-${index}`}>
                {dish.image && <Image src={dish.image} alt={dish.name || "Plato de la casa"} width={720} height={540} unoptimized loading="lazy" />}
                <div className="dish-card-copy"><h3>{dish.name || "Especialidad de la casa"}</h3>{dish.description && <p>{dish.description}</p>}{dish.price && <strong>{dish.price}</strong>}</div>
              </article>
            ))}
          </div>
        ) : <p className="empty-note">Consulta nuestras especialidades y platos de temporada.</p>}
      </section>

      {(rating > 0 || reviews.length > 0) && (
        <section className="restaurant-section reviews-section">
          <div className="section-heading"><div><p className="restaurant-eyebrow">La experiencia</p><h2>Dicen de nosotros</h2></div>{rating > 0 && <strong className="restaurant-rating">{rating.toFixed(1)} <span aria-label="estrellas">★</span></strong>}</div>
          <div className="review-grid">
            {reviews.map((review, index) => {
              const author = typeof review.author === "string" ? review.author : review.author?.name;
              const reviewText = review.reviewBody || review.description || review.name;
              return reviewText ? <article className="review-quote" key={`${author || "review"}-${index}`}><p>“{reviewText}”</p>{author && <span>{author}</span>}</article> : null;
            })}
          </div>
        </section>
      )}

      {gallery.length > 1 && (
        <section className="restaurant-section gallery-section" id="galeria">
          <div className="section-heading"><div><p className="restaurant-eyebrow">Un vistazo a la experiencia</p><h2>En imágenes</h2></div></div>
          <div className="restaurant-gallery">
            {gallery.map((image, index) => <Image src={image} alt={`${data.name}, imagen ${index + 1}`} width={720} height={540} unoptimized loading="lazy" key={`${image}-${index}`} />)}
          </div>
        </section>
      )}

      <footer className="restaurant-contact" id="visitanos">
        <div className="contact-copy"><p className="restaurant-eyebrow">Te esperamos</p><h2>Nos vemos en la mesa.</h2></div>
        <div className="contact-details">
          {data.location?.address && <a href={data.location.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location.address)}`} target="_blank" rel="noreferrer">{data.location.address}</a>}
          {data.location?.hours && <p>{data.location.hours}</p>}
          {data.location?.phone && <a href={`tel:${data.location.phone}`}>{data.location.phone}</a>}
          {socialLinks.length > 0 && <div className="social-links">{socialLinks.map(([network, href]) => <a href={href} target="_blank" rel="noreferrer" key={network}>{socialNames[network] || network}</a>)}</div>}
        </div>
          </footer>
              </main>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}