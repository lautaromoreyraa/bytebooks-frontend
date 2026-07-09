import { useEffect, useMemo, useState } from "react";
import { getLibros, deleteLibro } from "../api/libros";
import { getCategorias } from "../api/categorias";
import BookCard from "../components/BookCard";
import AddBookModal from "../components/AddBookModal";
import EditBookModal from "../components/EditBookModal";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { getFavoritos } from "../api/usuarios";
import type { Libro, Categoria } from "../types";

const HOME_CACHE_TTL_MS = 30_000;

let cachedLibros: Libro[] | null = null;
let cachedCategorias: Categoria[] | null = null;
let cachedAt = 0;

function canManageBooks(role: string) {
  return role === "ROLE_ADMIN" || role === "ROLE_MODERATOR";
}

export default function HomePage() {
  const { auth } = useAuth();
  const [libros, setLibros] = useState<Libro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [libroAEditar, setLibroAEditar] = useState<Libro | null>(null);
  const [libroAEliminar, setLibroAEliminar] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  function updateCache(nextLibros: Libro[], nextCategorias: Categoria[]) {
    cachedLibros = nextLibros;
    cachedCategorias = nextCategorias;
    cachedAt = Date.now();
  }

  useEffect(() => {
    let cancelled = false;
    if (
      cachedLibros !== null &&
      cachedCategorias !== null &&
      Date.now() - cachedAt < HOME_CACHE_TTL_MS
    ) {
      setLibros(cachedLibros);
      setCategorias(cachedCategorias);
      setLoading(false);
      setError(null);
      return;
    }

    async function loadHomeData(retry = true) {
      setLoading(true);
      setError(null);

      try {
        const [librosList, categoriasList] = await Promise.all([
          getLibros(),
          getCategorias(),
        ]);

        if (cancelled) return;

        setLibros(librosList);
        setCategorias(categoriasList);
        updateCache(librosList, categoriasList);
      } catch {
        if (retry && !cancelled) {
          window.setTimeout(() => {
            if (!cancelled) {
              void loadHomeData(false);
            }
          }, 400);
          return;
        }

        if (cancelled) return;

        if (cachedLibros !== null && cachedCategorias !== null) {
          setLibros(cachedLibros);
          setCategorias(cachedCategorias);
          setError(null);
        } else {
          setError("No se pudieron cargar los libros.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      setFavoritoIds(new Set());
      return;
    }
    getFavoritos()
      .then((favs) => setFavoritoIds(new Set(favs.map((libro) => libro.id))))
      .catch(() => {});
  }, [auth]);

  async function handleConfirmDelete() {
    if (!libroAEliminar) return;
    setDeleting(true);
    try {
      await deleteLibro(libroAEliminar);
      setLibros((prev) => {
        const next = prev.filter((l) => l.id !== libroAEliminar);
        updateCache(next, categorias);
        return next;
      });
      setLibroAEliminar(null);
    } catch {
      // mantener el diálogo abierto si falla
    } finally {
      setDeleting(false);
    }
  }

  function normalize(str: string) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,]/g, "")
      .toLowerCase()
      .trim();
  }

  const normalizedQuery = useMemo(() => normalize(busqueda), [busqueda]);

  const librosFiltrados = useMemo(
    () =>
      libros.filter((l) => {
        const matchesCategoria =
          !categoriaSeleccionada || l.categorias.some((c) => c.id === categoriaSeleccionada);
        const matchesBusqueda =
          !normalizedQuery ||
          normalize(l.titulo).includes(normalizedQuery) ||
          normalize(l.autor).includes(normalizedQuery);
        return matchesCategoria && matchesBusqueda;
      }),
    [libros, normalizedQuery, categoriaSeleccionada]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Libros</h1>
          <p className="text-zinc-400 text-sm">Explorá el catálogo completo</p>
        </div>
        {auth && canManageBooks(auth.role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Agregar libro
          </button>
        )}
      </div>

      {/* Layout dos columnas */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar izquierdo */}
        <aside className="lg:w-48 flex-shrink-0 lg:sticky lg:top-8 lg:self-start space-y-4">
          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorías */}
          {categorias.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden">
              <p className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-700/50">
                Categorías
              </p>
              <nav className="p-1">
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    categoriaSeleccionada === null
                      ? "bg-violet-500/10 text-violet-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                  }`}
                >
                  Todas
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaSeleccionada(cat.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      categoriaSeleccionada === cat.id
                        ? "bg-violet-500/10 text-violet-400"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {loading && <Spinner />}
          {error && <p className="text-zinc-400 text-sm">{error}</p>}
          {!loading && !error && librosFiltrados.length === 0 && (
            <p className="text-zinc-500 text-sm">No hay libros disponibles.</p>
          )}
          {!loading && !error && librosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {librosFiltrados.map((libro) => (
                <BookCard
                  key={libro.id}
                  libro={libro}
                  onEditClick={setLibroAEditar}
                  onDeleteClick={setLibroAEliminar}
                  initialEsFavorito={favoritoIds.has(libro.id)}
                  skipFavoritosFetch={Boolean(auth)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal agregar */}
      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onCreated={(libro) => {
            setLibros((prev) => {
              const next = [libro, ...prev];
              updateCache(next, categorias);
              return next;
            });
            setShowAddModal(false);
          }}
        />
      )}

      {/* Modal editar */}
      {libroAEditar && (
        <EditBookModal
          libro={libroAEditar}
          onClose={() => setLibroAEditar(null)}
          onUpdated={(updated) => {
            setLibros((prev) => {
              const next = prev.map((l) => (l.id === updated.id ? updated : l));
              updateCache(next, categorias);
              return next;
            });
            setLibroAEditar(null);
          }}
        />
      )}

      {/* Confirmación eliminar */}
      {libroAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setLibroAEliminar(null)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-zinc-100 font-semibold mb-2">Eliminar libro</h3>
            <p className="text-zinc-400 text-sm mb-6">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLibroAEliminar(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
