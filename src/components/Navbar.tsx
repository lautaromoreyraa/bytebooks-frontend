import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout as apiLogout } from "../api/auth";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "relative rounded-md px-2 py-1.5 text-sm transition-colors duration-200",
    "after:absolute after:inset-x-2 after:-bottom-px after:h-px after:origin-left",
    "after:bg-brass-500 after:transition-transform after:duration-200 after:ease-out",
    isActive
      ? "text-ink-50 after:scale-x-100"
      : "text-ink-400 hover:text-ink-100 after:scale-x-0",
  ].join(" ");
}

export default function Navbar() {
  const { auth, logout } = useAuth();

  async function handleLogout() {
    try {
      await apiLogout();
    } catch {
      // ignore — token may already be expired
    }
    logout();
  }

  return (
    <header className="sticky top-0 z-sticky border-b border-ink-800/80 bg-ink-950/85 backdrop-blur-md">
      {/* En pantallas angostas la navegación baja a su propia línea en lugar de
          desbordar el ancho del documento. */}
      <div
        className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-1
                   py-2.5 sm:h-16 sm:flex-nowrap sm:py-0"
      >
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-md py-1 pr-1"
          aria-label="ByteBooks — ir al inicio"
        >
          {/* Misma marca que public/favicon.svg: si cambia una, cambiar la otra.
              Va acá en línea, y no como <img>, porque las barras reaccionan al
              hover con clases de Tailwind. */}
          <svg
            viewBox="0 0 32 32"
            className="h-7 w-7 flex-shrink-0"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="32" height="32" rx="7" className="fill-ink-850" />
            <rect
              x="7"
              y="7"
              width="3"
              height="18"
              rx="1.5"
              className="fill-brass-400 transition-all duration-300 ease-out group-hover:fill-brass-300"
            />
            <rect x="13" y="9" width="12" height="2.6" rx="1.3" className="fill-ink-100" />
            <rect
              x="13"
              y="14.7"
              width="12"
              height="2.6"
              rx="1.3"
              className="fill-ink-100/75"
            />
            <rect
              x="13"
              y="20.4"
              width="7.5"
              height="2.6"
              rx="1.3"
              className="fill-brass-500 transition-all duration-300 ease-out group-hover:w-[12px]"
            />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tightest text-ink-50">
            ByteBooks
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="flex w-full items-center justify-end gap-1 sm:w-auto sm:gap-2"
        >
          <NavLink to="/" end className={navLinkClass}>
            Libros
          </NavLink>

          {auth ? (
            <>
              <NavLink to="/favoritos" className={navLinkClass}>
                Favoritos
              </NavLink>
              <NavLink to={`/usuarios/${auth.userId}`} className={navLinkClass}>
                <span className="hidden sm:inline">Mi perfil</span>
                <span className="sm:hidden">Perfil</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="btn-ghost px-2 py-1.5 text-sm"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Ingresar
              </NavLink>
              <NavLink to="/register" className="btn-primary px-3 py-1.5">
                Crear cuenta
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
