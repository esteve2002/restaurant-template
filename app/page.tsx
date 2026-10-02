import Link from "next/link";
import Image from "next/image";
import FoodScene from "@/components/restaurant/FoodScene";

const TABLE_IMAGE = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1500&q=85";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-wordmark" href="/">mise<span>.</span></Link>
        <Link className="landing-nav-link" href="/generate">Crear una propuesta <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="landing-kicker"><span /> DISEÑO DIGITAL PARA HOSTELERÍA</p>
          <h1>Tu restaurante merece una web que <em>abra el apetito.</em></h1>
          <p className="landing-description">Convertimos la web que ya tienes en el punto de partida para una experiencia digital más clara, atractiva y hecha a la medida de tu restaurante.</p>
          <div className="landing-actions">
            <Link className="landing-primary" href="/generate">Probar con mi restaurante <span aria-hidden="true">↗</span></Link>
            <span className="landing-action-note">Una URL. Una nueva perspectiva.</span>
          </div>
          <div className="landing-proof"><span>01</span><p>Tu identidad, tus platos y tu historia, reunidos en un solo lugar.</p></div>
        </div>

        <div className="landing-visual">
          <Image src={TABLE_IMAGE} alt="Mesa preparada en un restaurante" width={1500} height={1100} priority unoptimized />
          <div className="landing-food-model">
            <FoodScene type="tapas" accent="#bd583f" fallbackImage={TABLE_IMAGE} />
          </div>
          <div className="landing-photo-caption"><span>UNA EXPERIENCIA A TU MEDIDA</span><strong>Todo empieza<br />con tu historia.</strong></div>
          <div className="landing-photo-index">M / 01</div>
        </div>
        <div className="landing-scroll-note">DESLIZA PARA DESCUBRIR <span aria-hidden="true">↓</span></div>
      </section>

      <section className="landing-process" aria-labelledby="process-heading">
        <div className="landing-section-heading">
          <p className="landing-kicker">DE LA WEB ACTUAL A UNA NUEVA IDEA</p>
          <h2 id="process-heading">Un buen comienzo<br />en tres pasos.</h2>
        </div>
        <div className="landing-steps">
          <article><span>01</span><h3>Comparte tu web</h3><p>Partimos de una página pública para conocer el restaurante y lo que lo hace especial.</p></article>
          <article><span>02</span><h3>Encontramos lo esencial</h3><p>Organizamos la carta, las imágenes y los datos que ya cuentas a tus clientes.</p></article>
          <article><span>03</span><h3>Imagina lo que sigue</h3><p>Explora una propuesta visual propia y compárala con tu sitio actual.</p></article>
        </div>
      </section>

      <footer className="landing-footer"><Link className="landing-wordmark" href="/">mise<span>.</span></Link><p>Una mejor mesa también se sirve en la web.</p><Link href="/generate">Empezar <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}