import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function Seccion({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ink-800/80 pt-10">
      <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-ink-50">
        {titulo}
      </h2>
      <div className="prose-measure space-y-4 text-[15px] leading-7 text-ink-300">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  const { hash } = useLocation();

  // El scroll a la sección tiene que ocurrir después de pintar el contenido.
  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-12">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-brass-500">
          Información legal
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tightest text-ink-50 sm:text-5xl">
          Privacidad y términos
        </h1>
        <p className="prose-measure mt-4 text-ink-400">
          Qué datos guarda ByteBooks, para qué los usa y bajo qué condiciones se usa el
          servicio.
        </p>
      </header>

      <div className="space-y-12">
        <Seccion id="privacidad" titulo="Privacidad">
          <p>
            <strong className="font-medium text-ink-100">Qué guardamos.</strong> Al crear
            una cuenta guardamos tu nombre, tu apellido y tu email. La contraseña se
            almacena cifrada y nadie —tampoco el equipo del sitio— puede leerla. Si
            completás tu perfil, guardamos también la descripción y la foto que subas.
          </p>
          <p>
            <strong className="font-medium text-ink-100">Qué generás al usar el sitio.</strong>{" "}
            Tu lista de favoritos y las reseñas que publicás quedan asociadas a tu cuenta.
            Las reseñas son públicas e incluyen tu nombre; los favoritos son visibles en tu
            perfil.
          </p>
          <p>
            <strong className="font-medium text-ink-100">Servicios de terceros.</strong> Las
            imágenes que subís se alojan en Cloudinary. Algunas portadas se muestran desde
            Open Library y la importación de fichas consulta Google Books. Esos servicios
            tienen sus propias políticas de privacidad.
          </p>
          <p>
            <strong className="font-medium text-ink-100">Tus derechos.</strong> Podés editar
            tu perfil cuando quieras y pedir que se elimine tu cuenta junto con tus reseñas
            y favoritos.
          </p>
        </Seccion>

        <Seccion id="terminos" titulo="Términos de uso">
          <p>
            ByteBooks es un catálogo de consulta y un espacio de reseñas. No vende, presta
            ni distribuye libros ni sus contenidos.
          </p>
          <p>
            <strong className="font-medium text-ink-100">Tu cuenta.</strong> Sos responsable
            de lo que se publica desde tu cuenta y de mantener tu contraseña a resguardo.
          </p>
          <p>
            <strong className="font-medium text-ink-100">Lo que publicás.</strong> Las
            reseñas tienen que ser propias. No se admiten insultos, contenido ilegal ni
            spam. Moderación y administración pueden eliminar reseñas o fichas que
            incumplan estas condiciones.
          </p>
          <p>
            <strong className="font-medium text-ink-100">Disponibilidad.</strong> El
            servicio se ofrece tal como está, sin garantía de disponibilidad
            ininterrumpida ni de exactitud en los datos bibliográficos, que provienen en
            parte de fuentes externas.
          </p>
        </Seccion>
      </div>
    </div>
  );
}
