// Gallery component 
export default function Gallery({ gallery }) {
  if (!gallery || gallery.length === 0) return null;

  return (
    <section className="p-10">
      <h2 className="text-3xl font-bold mb-6">Galería</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gallery.map((img, i) => (
          <img
            key={i}
            src={img}
            className="w-full h-40 object-cover rounded"
            alt={`gallery-${i}`}
          />
        ))}
      </div>
    </section>
  );
}
