// Contact component 
export default function Contact({ address, mapUrl, phone, hours }) {
  return (
    <section className="p-10 bg-gray-900 text-white">
      <h2 className="text-3xl font-bold mb-6">Contacto</h2>

      {address && <p className="mb-2">📍 {address}</p>}
      {phone && <p className="mb-2">📞 {phone}</p>}
      {hours && <p className="mb-4">⏰ {hours}</p>}

      {mapUrl && (
        <a href={mapUrl} target="_blank" className="underline">
          Ver en Google Maps
        </a>
      )}
    </section>
  );
}
