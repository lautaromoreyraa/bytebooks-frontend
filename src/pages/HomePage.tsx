import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLibros, deleteLibro } from "../api/libros";
import { getCategorias } from "../api/categorias";
import BookCard from "../components/BookCard";
import AddBookModal from "../components/AddBookModal";
import EditBookModal from "../components/EditBookModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { BookGridSkeleton } from "../components/Skeleton";
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

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, "")
    .toLowerCase()
    .trim();
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

  const cancelledRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function updateCache(nextLibros: Libro[], nextCategorias: Categoria[]) {
    cachedLibros = nextLibros;
    cachedCategorias = nextCategorias;
    cachedAt = Date.now();
  }

  const loadHomeData = useCallback(async (retry = true) => {
    setLoading(true);
    setError(null);

    try {
      const [librosList, categoriasList] = await Promise.all([getLibros(), getCategorias()]);

      if (cancelledRef.current) return;

      setLibros(librosList);
      setCategorias(categoriasList);
      updateCache(librosList, categoriasList);
    } catch {
      if (retry && !cancelledRef.current) {
        window.setTimeout(() => {
          if (!cancelledRef.current) {
            void loadHomeData(false);
          }
        }, 400);
        return;
      }

      if (cancelledRef.current) return;

      if (cachedLibros !== null && cachedCategorias !== null) {
        setLibros(cachedLibros);
        setCategorias(cachedCategorias);
        setError(null);
      } else {
        setError("No se pudieron cargar los libros.");
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

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

    void loadHomeData();

    return () => {
      cancelledRef.current = true;
    };
  }, [loadHomeData]);

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

  const hayFiltros = Boolean(normalizedQuery || categoriaSeleccionada);
  const puedeGestionar = Boolean(auth && canManageBooks(auth.role));

  function limpiarFiltros() {
    setBusqueda("");
    setCategoriaSeleccionada(null);
    searchInputRef.current?.focus();
  }

  return (
    <div>
      {/* Cabecera editorial: el título es la pieza pesada de la página. */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-brass-500">
            El catálogo
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-ink-50 sm:text-5xl">
            Todo lo que hay
            <br />
            en la biblioteca
          </h1>
          <p className="prose-measure mt-4 text-ink-400">
            Buscá por título o autor, filtrá por categoría y guardá lo que quieras leer
            después.
          </p>
        </div>

        {puedeGestionar && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex-shrink-0 self-start sm:self-auto">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M8 3.5v9M3.5 8h9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            Agregar libro
          </button>
        )}
      </header>

      {/* Filtros en banda horizontal: la grilla se queda con todo el ancho. */}
      <section aria-label="Filtros" className="mb-8 border-y border-ink-800/80 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:max-w-xs lg:flex-1">
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título o autor"
              aria-label="Buscar por título o autor"
              className="field pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {busqueda && (
              <button
                onClick={() => {
                  setBusqueda("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center
                           rounded-md text-ink-400 transition-colors duration-200 hover:bg-ink-800 hover:text-ink-100"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {categorias.length > 0 && (
            <div
              role="group"
              aria-label="Filtrar por categoría"
              className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0"
            >
              <button
                onClick={() => setCategoriaSeleccionada(null)}
                aria-pressed={categoriaSeleccionada === null}
                className={`flex-shrink-0 rounded-md border px-3 py-1.5 text-sm transition-all duration-200 ease-out active:translate-y-px ${
                  categoriaSeleccionada === null
                    ? "border-brass-500/50 bg-brass-500/12 text-brass-300"
                    : "border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-100"
                }`}
              >
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  aria-pressed={categoriaSeleccionada === cat.id}
                  className={`flex-shrink-0 rounded-md border px-3 py-1.5 text-sm transition-all duration-200 ease-out active:translate-y-px ${
                    categoriaSeleccionada === cat.id
                      ? "border-brass-500/50 bg-brass-500/12 text-brass-300"
                      : "border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-100"
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-label="Resultados">
        {!loading && !error && librosFiltrados.length > 0 && (
          <p className="mb-6 text-sm text-ink-500">
            <span className="num text-ink-300">{librosFiltrados.length}</span>{" "}
            {librosFiltrados.length === 1 ? "libro" : "libros"}
            {hayFiltros && " que coinciden con el filtro"}
          </p>
        )}

        {loading && <BookGridSkeleton />}

        {!loading && error && (
          <EmptyState
            variant="warning"
            title="No pudimos cargar el catálogo"
            description="La conexión con el servidor falló. Puede ser algo momentáneo."
            action={
              <button onClick={() => void loadHomeData()} className="btn-secondary">
                Reintentar
              </button>
            }
          />
        )}

        {!loading && !error && librosFiltrados.length === 0 && hayFiltros && (
          <EmptyState
            variant="search"
            title="Ninguna coincidencia"
            description={
              busqueda
                ? `No encontramos libros para “${busqueda}”. Probá con menos palabras o revisá la categoría seleccionada.`
                : "No hay libros en esta categoría todavía."
            }
            action={
              <button onClick={limpiarFiltros} className="btn-secondary">
                Limpiar filtros
              </button>
            }
          />
        )}

        {!loading && !error && librosFiltrados.length === 0 && !hayFiltros && (
          <EmptyState
            variant="shelf"
            title="La biblioteca está vacía"
            description={
              puedeGestionar
                ? "Cargá el primer libro a mano o importá varios de una desde Google Books."
                : "Todavía no hay libros publicados. Volvé en un rato."
            }
            action={
              puedeGestionar ? (
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  Agregar el primer libro
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && librosFiltrados.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
            {librosFiltrados.map((libro, i) => (
              <div
                key={libro.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
              >
                <BookCard
                  libro={libro}
                  onEditClick={setLibroAEditar}
                  onDeleteClick={setLibroAEliminar}
                  initialEsFavorito={favoritoIds.has(libro.id)}
                  skipFavoritosFetch={Boolean(auth)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

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

      {libroAEliminar && (
        <ConfirmDialog
          title="Eliminar libro"
          description="El libro y sus reseñas dejan de estar disponibles para todos. No se puede deshacer."
          confirmLabel="Sí, eliminar"
          pendingLabel="Eliminando…"
          pending={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setLibroAEliminar(null)}
        />
      )}
    </div>
  );
}
