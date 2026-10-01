// About component 
export default function About({ about }) {
  return (
    <section className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Sobre nosotros</h2>
      <p className="text-lg text-gray-700 leading-relaxed">{about}</p>
    </section>
  );
}
