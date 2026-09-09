import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="mx-auto max-w-xl py-10 text-center sm:py-20">
      <p className="num mb-6 font-display text-7xl font-semibold tracking-tightest text-ink-800 sm:text-8xl">
        404
      </p>

      <h1 className="font-display text-3xl font-semibold tracking-tightest text-ink-50 sm:text-4xl">
        Esta página no existe
      </h1>

      <p className="prose-measure mx-auto mt-4 text-ink-400">
        No hay nada en{" "}
        <code className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-[13px] text-ink-200">
          {pathname}
        </code>
        . Puede que el libro se haya eliminado o que el enlace esté incompleto.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Ir al catálogo
        </Link>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Volver atrás
        </button>
      </div>
    </div>
  );
}
