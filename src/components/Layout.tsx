import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();

  function handleGoToLogin() {
    dismissSessionExpired();
    navigate("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast
                   focus:rounded-lg focus:bg-brass-500 focus:px-4 focus:py-2 focus:text-sm
                   focus:font-medium focus:text-ink-950"
      >
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido" className="container-page flex-1 py-10 sm:py-14">
        {children}
      </main>

      <footer className="mt-8 border-t border-ink-800/80">
        <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold tracking-tight text-ink-100">
              ByteBooks
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Catálogo y reseñas de libros.
            </p>
          </div>

          <nav aria-label="Enlaces legales" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/legal#privacidad"
              className="text-sm text-ink-400 transition-colors duration-200 hover:text-ink-100"
            >
              Privacidad
            </Link>
            <Link
              to="/legal#terminos"
              className="text-sm text-ink-400 transition-colors duration-200 hover:text-ink-100"
            >
              Términos
            </Link>
          </nav>
        </div>
      </footer>

      {sessionExpired && (
        <Modal title="Sesión expirada" onClose={dismissSessionExpired} size="sm" hideTitle>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-ink-700/70 bg-ink-850">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-brass-400" aria-hidden="true">
                <path
                  d="M7 10V7a5 5 0 0110 0v3M5.5 10h13a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0118.5 20h-13A1.5 1.5 0 014 18.5v-7A1.5 1.5 0 015.5 10z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 className="mb-2 font-display text-lg font-semibold tracking-tight text-ink-50">
              Tu sesión expiró
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-ink-300">
              Volvé a iniciar sesión para seguir guardando favoritos y publicando reseñas.
            </p>

            <div className="flex flex-col gap-1.5">
              <button onClick={handleGoToLogin} className="btn-primary w-full py-2.5">
                Iniciar sesión
              </button>
              <button onClick={dismissSessionExpired} className="btn-ghost w-full">
                Seguir navegando sin cuenta
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
