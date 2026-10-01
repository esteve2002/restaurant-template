// FeaturedDishes component 
export default function FeaturedDishes({ featuredDishes }) {
  if (!featuredDishes || featuredDishes.length === 0) return null;

  return (
    <section className="p-10 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6">Platos destacados</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredDishes.map((dish, i) => (
          <div key={i} className="bg-white shadow rounded p-4">
            {dish.image && (
              <img
                src={dish.image}
                className="w-full h-40 object-cover rounded"
                alt={dish.name}
              />
            )}
            <h3 className="text-xl font-bold mt-3">{dish.name}</h3>
            <p className="text-gray-600">{dish.description}</p>
            <p className="font-bold mt-2">{dish.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
