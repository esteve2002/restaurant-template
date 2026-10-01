// Reviews component 
export default function Reviews({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="p-10 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6">Opiniones</h2>
      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white shadow p-4 rounded">
            <p className="font-bold">
              {r.author} — ⭐ {r.rating}
            </p>
            <p className="text-gray-700">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
