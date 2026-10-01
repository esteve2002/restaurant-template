"use client";

export default function Hero({ name, subtitle, hero3D, colors }) {
  return (
    <section className="mb-12">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Texto */}
        <div>
          <p className="uppercase tracking-[0.25em] text-sm mb-4" style={{ color: colors.accent }}>
            Restaurante
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: colors.secondary }}
          >
            {name}
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            {subtitle}
          </p>

          <div className="flex gap-4">
            <a
              href="#menu"
              className="px-6 py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: colors.primary, color: "#000" }}
            >
              Ver menú
            </a>
            <a
              href="#reservas"
              className="px-6 py-3 rounded-full text-sm font-semibold border"
              style={{ borderColor: colors.primary, color: colors.secondary }}
            >
              Reservar mesa
            </a>
          </div>
        </div>

        {/* 3D Spline */}
        <div className="relative w-full h-[420px] md:h-[520px] rounded-3xl overflow-hidden border border-white/10 bg-black">
          {hero3D ? (
            <iframe
              src={hero3D}
              className="w-full h-full"
              frameBorder="0"
              title="Hero 3D restaurante"
              style={{ transform: "scale(1.02)", transformOrigin: "center" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              Modelo 3D no disponible
            </div>
          )}

          {/* Overlay sutil */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
