import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getLibro, deleteLibro } from "../api/libros";
import {
  getResenas,
  getResumenDeResenas,
  createResena,
  deleteResena,
} from "../api/resenas";
import { addFavorito, removeFavorito, getFavoritos } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import { puedeEditarLibros } from "../lib/permisos";
import { getOpenLibraryCover } from "../lib/covers";
import { invalidarCatalogo } from "../lib/cacheDeCatalogo";
import StarRating from "../components/StarRating";
import EditBookModal from "../components/EditBookModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { BookDetailSkeleton } from "../components/Skeleton";
import type { Libro, Resena } from "../types";

const PENDING_RESENA_KEY = "pending_resena";

function BackLink() {
  return (
    <Link
      to="/"
      className="group mb-8 inline-flex items-center gap-2 rounded-md text-sm text-ink-400
                 transition-colors duration-200 hover:text-ink-100"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" aria-hidden="true">
        <path d="M9.5 3.5L5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Volver al catálogo
    </Link>
  );
}

/** El backend expone `fechaResena` como java.util.Date: puede llegar ISO o
 *  epoch segun la config de Jackson. Normalizamos antes de mostrarla. */
function parseFecha(valor: string): Date | null {
  const fecha = new Date(/^\d+$/.test(valor) ? Number(valor) : valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-900/60 px-3.5 py-2">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-200">{value}</dd>
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [libro, setLibro] = useState<Libro | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [totalResenas, setTotalResenas] = useState(0);
  const [promedio, setPromedio] = useState<number | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comentario, setComentario] = useState("");
  const [puntuacion, setPuntuacion] = useState(5);
  const [enviando, setEnviando] = useState(false);
  const [errorResena, setErrorResena] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resenaAEliminar, setResenaAEliminar] = useState<string | null>(null);
  const [borrandoResena, setBorrandoResena] = useState(false);
  const [paginaResenas, setPaginaResenas] = useState(0);
  const [cargandoMas, setCargandoMas] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setPaginaResenas(0);
    Promise.allSettled([getLibro(id), getResenas(id), getResumenDeResenas(id)])
      .then(([libroResult, resenasResult, resumenResult]) => {
        if (libroResult.status === "fulfilled") {
          setLibro(libroResult.value);
        } else {
          setLibro(null);
          setError("No se pudo cargar el libro.");
        }

        if (resenasResult.status === "fulfilled") {
          setResenas(resenasResult.value.content);
          setTotalResenas(resenasResult.value.totalElements);
        } else {
          setResenas([]);
          setTotalResenas(0);
        }

        // El promedio lo calcula la API sobre todas las resenas. Cuando falla se
        // deja en null: mostrar el de la primera pagina seria un dato inventado.
        if (resumenResult.status === "fulfilled") {
          setPromedio(resumenResult.value.promedio);
          setTotalResenas(resumenResult.value.total);
        } else {
          setPromedio(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!libro) {
      setCoverSrc(null);
      return;
    }
    setCoverSrc(getOpenLibraryCover(libro.isbn) ?? libro.portada);
  }, [libro]);

  useEffect(() => {
    if (!auth || !id) return;
    getFavoritos()
      .then((favs) => setEsFavorito(favs.some((f) => f.id === id)))
      .catch(() => {});
  }, [auth, id]);

  // Restaurar reseña pendiente si el usuario acaba de loguearse
  useEffect(() => {
    if (!auth || !id) return;
    const raw = sessionStorage.getItem(PENDING_RESENA_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { libroId: string; comentario: string; puntuacion: number };
      if (pending.libroId === id) {
        setComentario(pending.comentario);
        setPuntuacion(pending.puntuacion);
        sessionStorage.removeItem(PENDING_RESENA_KEY);
      }
    } catch {
      sessionStorage.removeItem(PENDING_RESENA_KEY);
    }
  }, [auth, id]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  /** Una resena propia cambia el promedio de todas: lo recalcula la API. */
  async function refrescarResumen(libroId: string) {
    try {
      const resumen = await getResumenDeResenas(libroId);
      setPromedio(resumen.promedio);
      setTotalResenas(resumen.total);
    } catch {
      // El contador local ya se ajusto; el promedio se corrige al recargar.
    }
  }

  async function handleConfirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteLibro(id);
      // El catalogo cacheado todavia lista el libro: sin esto, volver a la home
      // lo muestra y clickearlo lleva a "No encontramos este libro".
      invalidarCatalogo();
      // navigate(-1) no hacia nada si la ficha se abrio por link directo, y
      // dejaba al admin parado en el libro que acababa de borrar.
      navigate("/", { replace: true });
    } catch {
      setDeleting(false);
    }
  }

  async function handleFavorito() {
    if (!id) return;
    const prev = esFavorito;
    setEsFavorito(!prev);
    try {
      if (prev) await removeFavorito(id);
      else await addFavorito(id);
    } catch {
      setEsFavorito(prev);
    }
  }

  async function handleSubmitResena(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    if (!auth) {
      sessionStorage.setItem(
        PENDING_RESENA_KEY,
        JSON.stringify({ libroId: id, comentario, puntuacion })
      );
      navigate(`/login?returnTo=/libros/${id}`);
      return;
    }

    setEnviando(true);
    setErrorResena(null);
    try {
      const nueva = await createResena(id, { comentario, puntuacion });
      setResenas((prev) => [nueva, ...prev]);
      setTotalResenas((prev) => prev + 1);
      setComentario("");
      setPuntuacion(5);
      void refrescarResumen(id);
    } catch (err) {
      setErrorResena(err instanceof Error ? err.message : "Error al enviar la reseña.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleCargarMasResenas() {
    if (!id || cargandoMas) return;
    setCargandoMas(true);
    try {
      const siguiente = paginaResenas + 1;
      const pagina = await getResenas(id, siguiente);
      // Se filtran las ya presentes: si alguien publica mientras leés, la API
      // corre los elementos entre páginas y llegarían duplicados.
      setResenas((prev) => {
        const vistas = new Set(prev.map((r) => r.id));
        return [...prev, ...pagina.content.filter((r) => !vistas.has(r.id))];
      });
      setTotalResenas(pagina.totalElements);
      setPaginaResenas(siguiente);
    } catch {
      // sin cambios: el botón sigue disponible para reintentar
    } finally {
      setCargandoMas(false);
    }
  }

  async function handleConfirmDeleteResena() {
    if (!resenaAEliminar) return;
    setBorrandoResena(true);
    try {
      await deleteResena(resenaAEliminar);
      setResenas((prev) => prev.filter((r) => r.id !== resenaAEliminar));
      setTotalResenas((prev) => Math.max(0, prev - 1));
      setResenaAEliminar(null);
      if (id) void refrescarResumen(id);
    } catch {
      // el diálogo queda abierto si falla
    } finally {
      setBorrandoResena(false);
    }
  }

  if (loading) {
    return (
      <div>
        <BackLink />
        <BookDetailSkeleton />
      </div>
    );
  }

  if (error || !libro) {
    return (
      <div>
        <BackLink />
        <EmptyState
          variant="warning"
          title="No encontramos este libro"
          description={
            error ??
            "Puede que lo hayan eliminado del catálogo o que el enlace esté mal escrito."
          }
          action={
            <Link to="/" className="btn-secondary">
              Ir al catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const fallbackCover = libro.portada;
  const todasCargadas = resenas.length >= totalResenas;

  return (
    <div>
      <BackLink />

      <article className="grid gap-10 lg:grid-cols-[minmax(240px,300px)_1fr] lg:gap-14">
        {/* La portada acompaña el scroll mientras se leen las reseñas. */}
        <div className="mx-auto w-full max-w-[260px] lg:sticky lg:top-24 lg:mx-0 lg:max-w-none lg:self-start">
          <div className="relative overflow-hidden rounded-xl bg-ink-850 shadow-lift">
            {coverSrc ? (
              <div className="relative aspect-[2/3] w-full">
                <img
                  src={coverSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-xl"
                />
                <img
                  src={coverSrc}
                  alt={`Portada de ${libro.titulo}`}
                  className="relative h-full w-full object-contain"
                  onError={() => {
                    if (coverSrc !== fallbackCover && fallbackCover) {
                      setCoverSrc(fallbackCover);
                      return;
                    }
                    setCoverSrc(null);
                  }}
                />
              </div>
            ) : (
              <div className="flex aspect-[2/3] w-full flex-col justify-between bg-[linear-gradient(165deg,#221f1c,#121110_62%)] p-5">
                <span className="h-7 w-1 rounded-full bg-brass-500/70" />
                <p className="font-display text-base font-semibold leading-snug text-ink-100">
                  {libro.titulo}
                </p>
              </div>
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-ink-950/55 to-transparent"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ink-50/[0.06]"
            />
          </div>

          {auth && (
            <button
              onClick={handleFavorito}
              aria-pressed={esFavorito}
              className={`mt-4 w-full rounded-lg border px-4 py-2.5 text-sm font-medium
                          transition-all duration-200 ease-out active:translate-y-px ${
                            esFavorito
                              ? "border-brass-500/50 bg-brass-500/12 text-brass-300 hover:bg-brass-500/20"
                              : "border-ink-700 bg-ink-850 text-ink-200 hover:border-ink-600 hover:text-ink-50"
                          }`}
            >
              {esFavorito ? "Guardado en favoritos" : "Guardar en favoritos"}
            </button>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex items-start justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-brass-500">
              {libro.categorias.map((c) => c.nombre).join(" · ")}
            </p>

            {puedeEditarLibros(auth?.role) && (
              <div ref={menuRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Opciones del libro"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700
                             bg-ink-850 text-ink-300 transition-colors duration-200
                             hover:border-ink-600 hover:text-ink-50"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                    <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
                    <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                    <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-10 z-dropdown w-36 animate-scale-in overflow-hidden
                               rounded-xl border border-ink-700/70 bg-ink-850 shadow-panel
                               ring-1 ring-inset ring-ink-50/[0.04]"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowEditModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-ink-200 transition-colors duration-150 hover:bg-ink-800 hover:text-ink-50"
                    >
                      Editar
                    </button>
                    <div className="h-px bg-ink-700/70" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-ember-400 transition-colors duration-150 hover:bg-ink-800 hover:brightness-110"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tightest text-ink-50 sm:text-5xl">
            {libro.titulo}
          </h1>
          <p className="mt-3 text-lg text-ink-300">{libro.autor}</p>

          {promedio !== null && (
            <div className="mt-5 flex items-center gap-3">
              <StarRating value={Math.round(promedio)} size="md" />
              <span className="text-sm text-ink-400">
                <span className="num text-ink-100">{promedio.toFixed(1)}</span> ·{" "}
                <span className="num">{totalResenas}</span>{" "}
                {totalResenas === 1 ? "reseña" : "reseñas"}
              </span>
            </div>
          )}

          {/* El ISBN no se muestra: para quien lee no dice nada. Sigue llegando
              en la respuesta y se usa para buscar la portada en Open Library. */}
          {(libro.editorial || libro.anioPublicacion) && (
            <dl className="mt-7 flex flex-wrap gap-2.5">
              {libro.editorial && <MetaChip label="Editorial" value={libro.editorial} />}
              {libro.anioPublicacion && (
                <MetaChip label="Publicación" value={libro.anioPublicacion} />
              )}
            </dl>
          )}

          {libro.descripcion && (
            <div className="mt-8">
              <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-ink-500">
                Sinopsis
              </h2>
              <p className="prose-measure text-[15px] leading-7 text-ink-300">
                {libro.descripcion}
              </p>
            </div>
          )}
        </div>
      </article>

      <section className="mt-16 border-t border-ink-800/80 pt-12">
        <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight text-ink-50">
          Reseñas
          {totalResenas > 0 && (
            <span className="num ml-2.5 text-lg font-normal text-ink-500">
              {totalResenas}
            </span>
          )}
        </h2>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="lg:order-2">
            <form
              onSubmit={handleSubmitResena}
              className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5 lg:sticky lg:top-24"
            >
              <p className="mb-4 font-display text-base font-semibold tracking-tight text-ink-50">
                Escribí tu reseña
              </p>

              <fieldset className="mb-4">
                <legend className="label">Puntuación</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPuntuacion(n)}
                      aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                      aria-pressed={n === puntuacion}
                      className={`rounded transition-all duration-150 ease-out hover:scale-110 active:scale-95 ${
                        n <= puntuacion ? "text-brass-400" : "text-ink-700 hover:text-brass-500"
                      }`}
                    >
                      <svg viewBox="0 0 16 16" className="h-6 w-6" aria-hidden="true">
                        <path
                          d="M8 1.6l1.94 3.93 4.34.63-3.14 3.06.74 4.32L8 11.5l-3.88 2.04.74-4.32L1.72 6.16l4.34-.63z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="mb-4">
                <label htmlFor="comentario" className="label">
                  Comentario <span className="normal-case tracking-normal text-ink-500">(opcional)</span>
                </label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="field resize-none"
                  placeholder="¿Qué te pareció?"
                />
                {comentario.length > 1800 && (
                  <p className="num mt-1.5 text-right text-xs text-ink-500">
                    {comentario.length}/2000
                  </p>
                )}
              </div>

              {errorResena && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400"
                >
                  {errorResena}
                </p>
              )}

              <button type="submit" disabled={enviando} className="btn-primary w-full py-2.5">
                {enviando ? "Enviando…" : auth ? "Publicar reseña" : "Ingresar para publicar"}
              </button>

              {!auth && (
                <p className="mt-3 text-center text-xs leading-relaxed text-ink-500">
                  Guardamos lo que escribiste y lo publicamos apenas inicies sesión.
                </p>
              )}
            </form>
          </div>

          <div className="lg:order-1">
            {resenas.length === 0 ? (
              <EmptyState
                variant="bookmark"
                title="Sin reseñas todavía"
                description="Nadie opinó sobre este libro. Podés ser la primera persona en hacerlo."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-ink-800/80">
                {resenas.map((resena, i) => (
                  <li
                    key={resena.id}
                    className="animate-fade-up py-6 first:pt-0"
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                  >
                    <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="text-sm font-medium text-ink-100">
                        {resena.nombreUsuario}
                      </span>
                      <StarRating value={resena.puntuacion} />
                      {(() => {
                        const fecha = parseFecha(resena.fechaResena);
                        if (!fecha) return null;
                        return (
                          <time
                            dateTime={fecha.toISOString()}
                            className="num ml-auto text-xs text-ink-500"
                          >
                            {fecha.toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                        );
                      })()}
                    </div>

                    {resena.comentario && (
                      <p className="prose-measure text-sm leading-relaxed text-ink-300">
                        {resena.comentario}
                      </p>
                    )}

                    {auth && (auth.userId === resena.usuarioId || puedeEditarLibros(auth.role)) && (
                      <button
                        onClick={() => setResenaAEliminar(resena.id)}
                        className="mt-3 rounded text-xs text-ink-500 transition-colors duration-200 hover:text-ember-400"
                      >
                        Eliminar reseña
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* La API pagina de a 10: sin esto el contador prometía reseñas
                que no había forma de leer. */}
            {!todasCargadas && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleCargarMasResenas}
                  disabled={cargandoMas}
                  className="btn-secondary"
                >
                  {cargandoMas
                    ? "Cargando…"
                    : `Ver más reseñas (${totalResenas - resenas.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {showEditModal && libro && (
        <EditBookModal
          libro={libro}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setLibro(updated);
            // El titulo editado quedaba viejo en la grilla cacheada de la home.
            invalidarCatalogo();
            setShowEditModal(false);
          }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Eliminar libro"
          description="El libro y sus reseñas dejan de estar disponibles para todos. No se puede deshacer."
          confirmLabel="Sí, eliminar"
          pendingLabel="Eliminando…"
          pending={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {resenaAEliminar && (
        <ConfirmDialog
          title="Eliminar reseña"
          description="La reseña se borra para todos y no se puede recuperar."
          confirmLabel="Sí, eliminar"
          pendingLabel="Eliminando…"
          pending={borrandoResena}
          onConfirm={handleConfirmDeleteResena}
          onCancel={() => setResenaAEliminar(null)}
        />
      )}
    </div>
  );
}
