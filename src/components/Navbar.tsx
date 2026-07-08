import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout as apiLogout } from "../api/auth";

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
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-zinc-100 tracking-tight">
          ByteBooks
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "text-zinc-100 text-sm" : "text-zinc-400 text-sm hover:text-zinc-200"
            }
          >
            Libros
          </NavLink>

          {auth ? (
            <>
              <NavLink
                to="/favoritos"
                className={({ isActive }) =>
                  isActive ? "text-zinc-100 text-sm" : "text-zinc-400 text-sm hover:text-zinc-200"
                }
              >
                Favoritos
              </NavLink>
              <NavLink
                to={`/usuarios/${auth.userId}`}
                className={({ isActive }) =>
                  isActive ? "text-zinc-100 text-sm" : "text-zinc-400 text-sm hover:text-zinc-200"
                }
              >
                Mi perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="text-zinc-400 text-sm hover:text-zinc-200"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "text-zinc-100 text-sm" : "text-zinc-400 text-sm hover:text-zinc-200"
                }
              >
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/register"
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded"
              >
                Registrarse
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
