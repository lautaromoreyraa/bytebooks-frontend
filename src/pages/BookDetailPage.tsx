import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLibro, deleteLibro } from "../api/libros";
import { getResenas, createResena, deleteResena } from "../api/resenas";
import { addFavorito, removeFavorito, getFavoritos } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import { getOpenLibraryCover } from "../lib/covers";
import StarRating from "../components/StarRating";
import Spinner from "../components/Spinner";
import EditBookModal from "../components/EditBookModal";
import type { Libro, Resena } from "../types";

const PENDING_RESENA_KEY = "pending_resena";

function canManageBooks(role: string) {
  return role === "ROLE_ADMIN" || role === "ROLE_MODERATOR";
}


export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [libro, setLibro] = useState<Libro | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
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

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);
    Promise.allSettled([getLibro(id), getResenas(id)])
      .then(([libroResult, resenasResult]) => {
        if (libroResult.status === "fulfilled") {
          setLibro(libroResult.value);
        } else {
          setLibro(null);
          setError("No se pudo cargar el libro.");
        }

        if (resenasResult.status === "fulfilled") {
          setResenas(resenasResult.value.content);
        } else {
          setResenas([]);
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleConfirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteLibro(id);
      navigate(-1);
    } catch {
      setDeleting(false);
    }
  }

  async function handleFavorito() {
    if (!id) return;
    if (esFavorito) {
      await removeFavorito(id);
      setEsFavorito(false);
    } else {
      await addFavorito(id);
      setEsFavorito(true);
    }
  }

  async function handleSubmitResena(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    if (!auth) {
      sessionStorage.setItem(PENDING_RESENA_KEY, JSON.stringify({ libroId: id, comentario, puntuacion }));
      navigate(`/login?returnTo=/libros/${id}`);
      return;
    }

    setEnviando(true);
    setErrorResena(null);
    try {
      const nueva = await createResena(id, { comentario, puntuacion });
      setResenas((prev) => [nueva, ...prev]);
      setComentario("");
      setPuntuacion(5);
    } catch (err) {
      setErrorResena(err instanceof Error ? err.message : "Error al enviar la reseña.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleDeleteResena(resenaId: string) {
    await deleteResena(resenaId);
    setResenas((prev) => prev.filter((r) => r.id !== resenaId));
  }

  if (loading) return <Spinner />;
  if (error || !libro) return <p className="text-zinc-400 text-sm">{error ?? "Libro no encontrado."}</p>;

  const fallbackCover = libro.portada;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(260px,340px)_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/30">
            {coverSrc ? (
              <div className="aspect-[2/3] bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_55%),linear-gradient(180deg,_rgba(24,24,27,0.9),_rgba(9,9,11,1))] p-4">
                <img
                  src={coverSrc}
                  alt={libro.titulo}
                  className="h-full w-full object-contain"
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
              <div className="aspect-[2/3] flex items-center justify-center bg-zinc-900 text-zinc-600">
                Sin portada
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-violet-400">
              {libro.categorias.map((c) => c.nombre).join(" · ")}
            </p>
            {auth && canManageBooks(auth.role) && (
              <div ref={menuRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-lg leading-none transition-colors"
                  title="Opciones"
                >
                  ⋮
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 w-36 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20">
                    <button
                      onClick={() => { setMenuOpen(false); setShowEditModal(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <h1 className="mb-3 text-3xl font-semibold leading-tight text-zinc-50 sm:text-4xl">
            {libro.titulo}
          </h1>
          <p className="mb-6 text-lg text-zinc-300">{libro.autor}</p>

          <div className="mb-6 flex flex-wrap gap-3 text-sm text-zinc-300">
            {libro.editorial && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                Editorial: {libro.editorial}
              </span>
            )}
            {libro.anioPublicacion && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                Año: {libro.anioPublicacion}
              </span>
            )}
            {libro.isbn && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                ISBN: {libro.isbn}
              </span>
            )}
          </div>

          {libro.descripcion && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <p className="text-sm leading-7 text-zinc-300 sm:text-[15px]">{libro.descripcion}</p>
            </div>
          )}

          {auth && (
            <div className="mt-6">
              <button
                onClick={handleFavorito}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  esFavorito
                    ? "border-violet-500 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {esFavorito ? "★ En favoritos" : "☆ Agregar a favoritos"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-zinc-800 pt-10">
        <h2 className="mb-6 text-lg font-medium text-zinc-100">
          Reseñas{" "}
          {resenas.length > 0 && (
            <span className="text-base font-normal text-zinc-500">({resenas.length})</span>
          )}
        </h2>

        <form onSubmit={handleSubmitResena} className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-300">Escribir reseña</p>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-zinc-400">Puntuación</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPuntuacion(n)}
                    className={`text-xl transition-colors ${
                      n <= puntuacion ? "text-violet-400" : "text-zinc-600"
                    } hover:text-violet-300`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-zinc-400">Comentario (opcional)</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full resize-none rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                placeholder="¿Qué te pareció el libro?"
              />
            </div>

            {errorResena && <p className="mb-3 text-xs text-red-400">{errorResena}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="rounded bg-violet-600 px-4 py-2 text-sm text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {enviando ? "Enviando..." : auth ? "Publicar reseña" : "Iniciar sesión para publicar"}
            </button>
          </form>

        {resenas.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no hay reseñas para este libro.</p>
        )}

        <div className="flex flex-col gap-4">
          {resenas.map((resena) => (
            <div key={resena.id} className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-300">{resena.nombreUsuario}</span>
                  <StarRating value={resena.puntuacion} />
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(resena.fechaResena).toLocaleDateString("es-AR")}
                </span>
              </div>
              {resena.comentario && (
                <p className="text-sm leading-relaxed text-zinc-400">{resena.comentario}</p>
              )}
              {auth && (auth.userId === resena.usuarioId || canManageBooks(auth.role)) && (
                <button
                  onClick={() => handleDeleteResena(resena.id)}
                  className="mt-2 text-xs text-zinc-600 transition-colors hover:text-red-400"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {showEditModal && libro && (
        <EditBookModal
          libro={libro}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setLibro(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-zinc-100 font-semibold mb-2">Eliminar libro</h3>
            <p className="text-zinc-400 text-sm mb-6">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
