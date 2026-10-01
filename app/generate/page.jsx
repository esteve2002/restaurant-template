"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!url) {
      setError("Introduce una URL válida.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1️⃣ Scraping real
      const scrapeRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const scrape = await scrapeRes.json();

      // Guardar datos del restaurante
      localStorage.setItem("restaurant", JSON.stringify(scrape));

      // 2️⃣ Interpretación del diseño
      const designRes = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrape),
      });

      const design = await designRes.json();

      // Guardar diseño
      localStorage.setItem("design", JSON.stringify(design));

      // 3️⃣ Ir a la demo
      window.location.href = "/preview/demo";

    } catch (err) {
      console.error(err);
      setError("Hubo un error generando la web.");
    }

    setLoading(false);
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Generar web de restaurante</h1>

      <label className="block mb-2 font-medium">URL del restaurante</label>
      <input
        type="text"
        placeholder="https://www.restaurante-ejemplo.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-3 w-full rounded mb-4"
      />

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded w-full"
      >
        {loading ? "Generando..." : "Generar web"}
      </button>
    </div>
  );
}
