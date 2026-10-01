"use client";

import { useEffect, useState } from "react";
import { themes } from "@/lib/themes";

export default function DemoPage() {
  const [data, setData] = useState(null);
  const [design, setDesign] = useState(null);

  useEffect(() => {
    const restaurant = localStorage.getItem("restaurant");
    const designData = localStorage.getItem("design");

    if (restaurant) setData(JSON.parse(restaurant));
    if (designData) setDesign(JSON.parse(designData));
  }, []);

  if (!data || !design) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-3xl font-bold">Cargando diseño…</h2>
      </div>
    );
  }

  const theme = themes[design.layout] || themes["clean-default"];

  return (
    <div className={theme.container}>
      <section className="p-12">
        <h1 className={theme.title}>{data.name}</h1>

        <iframe
          src={design.hero3D}
          className="w-full h-[400px] rounded-xl my-10"
        />

        <button className={theme.button}>Ver menú</button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-12">
        {data.featuredDishes.map((dish, i) => (
          <div key={i} className={theme.card}>
            <img src={dish.image} className="rounded-xl mb-4" />
            <h3 className="text-xl font-bold">{dish.name}</h3>
            <p className="opacity-80">{dish.description}</p>
            <span className="block mt-2 font-semibold">{dish.price}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
