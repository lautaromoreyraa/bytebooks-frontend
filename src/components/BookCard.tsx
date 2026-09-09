import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addFavorito, removeFavorito, getFavoritos } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import { puedeEditarLibros } from "../lib/permisos";
import { getOpenLibraryCover } from "../lib/covers";
import type { Libro } from "../types";

interface Props {
  libro: Libro;
  onEditClick?: (libro: Libro) => void;
  onDeleteClick?: (libroId: string) => void;
  onFavoritoChange?: (libroId: string, esFavorito: boolean) => void;
  initialEsFavorito?: boolean;
  skipFavoritosFetch?: boolean;
}

/** Tinte estable por título: dos libros sin portada nunca salen idénticos. */
function hueFromTitle(titulo: string) {
  let hash = 0;
  for (let i = 0; i < titulo.length; i++) {
    hash = (hash * 31 + titulo.charCodeAt(i)) % 360;
  }
  return hash;
}

/** Portada tipográfica para los libros que no tienen imagen. */
function FallbackCover({ libro }: { libro: Libro }) {
  const hue = hueFromTitle(libro.titulo);

  return (
    <div
      className="flex h-full w-full flex-col justify-between p-4"
      style={{
        backgroundImage: `radial-gradient(circle at 78% 8%, hsl(${hue} 24% 26%), transparent 58%), linear-gradient(165deg, #221f1c, #121110 62%)`,
      }}
    >
      <span className="h-7 w-1 rounded-full bg-brass-500" />
      <div>
        <p className="font-display text-lg font-semibold leading-[1.15] tracking-tight text-ink-50 line-clamp-5">
          {libro.titulo}
        </p>
        <span aria-hidden="true" className="mt-3 block h-px w-8 bg-brass-500/60" />
        <p className="mt-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-300 line-clamp-2">
          {libro.autor}
        </p>
      </div>
    </div>
  );
}

export default function BookCard({
  libro,
  onEditClick,
  onDeleteClick,
  onFavoritoChange,
  initialEsFavorito = false,
  skipFavoritosFetch = false,
}: Props) {
  const { auth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [esFavorito, setEsFavorito] = useState(initialEsFavorito);
  const fallbackCover = libro.portada;
  const preferredCover = getOpenLibraryCover(libro.isbn) ?? fallbackCover;
  const [coverSrc, setCoverSrc] = useState(preferredCover);

  useEffect(() => {
    setEsFavorito(initialEsFavorito);
  }, [initialEsFavorito]);

  useEffect(() => {
    setCoverSrc(getOpenLibraryCover(libro.isbn) ?? libro.portada);
  }, [libro.id, libro.isbn, libro.portada]);

  useEffect(() => {
    if (!auth) {
      setEsFavorito(false);
      return;
    }
    if (skipFavoritosFetch) return;
    getFavoritos()
      .then((favs) => setEsFavorito(favs.some((f) => f.id === libro.id)))
      .catch(() => {});
  }, [auth, libro.id, skipFavoritosFetch]);

  async function handleFavorito() {
    if (!auth) return;
    const prevState = esFavorito;
    setEsFavorito(!prevState);
    onFavoritoChange?.(libro.id, !prevState);
    try {
      if (prevState) await removeFavorito(libro.id);
      else await addFavorito(libro.id);
    } catch {
      setEsFavorito(prevState);
      onFavoritoChange?.(libro.id, prevState);
    }
  }

  const puedeGestionar = puedeEditarLibros(auth?.role) && Boolean(onEditClick || onDeleteClick);

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

  const categorias = libro.categorias.map((c) => c.nombre).join(" · ");

  return (
    <article className="group relative">
      <Link to={`/libros/${libro.id}`} className="block rounded-lg">
        {/* La portada es el objeto: sin borde ni caja alrededor, sombra cálida
            y un lomo sutil a la izquierda que le da volumen de libro real. */}
        <div
          className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ink-850 shadow-card
                     transition-all duration-300 ease-out
                     group-hover:-translate-y-1.5 group-hover:shadow-lift"
        >
          {coverSrc ? (
            <>
              {/* Copia difuminada de la propia portada como relleno: la imagen
                  se ve entera, sin recortar el título ni el autor. */}
              <img
                src={coverSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-xl"
                loading="lazy"
              />
              <img
                src={coverSrc}
                alt={`Portada de ${libro.titulo}`}
                className="relative h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                onError={() => {
                  if (coverSrc !== fallbackCover && fallbackCover) {
                    setCoverSrc(fallbackCover);
                    return;
                  }
                  setCoverSrc(null);
                }}
              />
            </>
          ) : (
            <FallbackCover libro={libro} />
          )}

          {/* Lomo + viñeteado inferior para despegar los controles del arte. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-ink-950/55 to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-ink-50/[0.06]"
          />
        </div>
      </Link>

      {/* Controles sobre la portada: aparecen al hover y siempre en táctil. */}
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {auth && (
          <button
            onClick={handleFavorito}
            aria-pressed={esFavorito}
            aria-label={esFavorito ? `Quitar ${libro.titulo} de favoritos` : `Agregar ${libro.titulo} a favoritos`}
            title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md
                        transition-all duration-200 ease-out active:scale-95
                        focus-visible:opacity-100
                        ${
                          esFavorito
                            ? "border-brass-500/40 bg-brass-500/20 text-brass-300 opacity-100"
                            : "border-ink-50/10 bg-ink-950/70 text-ink-200 hover:bg-ink-950/90 hover:text-brass-300 lg:opacity-0 lg:group-hover:opacity-100"
                        }`}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M4 2.5h8a.5.5 0 01.5.5v10.2a.3.3 0 01-.47.25L8 11.2l-4.03 2.25a.3.3 0 01-.47-.25V3a.5.5 0 01.5-.5z"
                fill={esFavorito ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {puedeGestionar && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={`Opciones de ${libro.titulo}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-ink-50/10
                          bg-ink-950/70 text-ink-200 backdrop-blur-md transition-all duration-200 ease-out
                          hover:bg-ink-950/90 hover:text-ink-50 active:scale-95
                          focus-visible:opacity-100 lg:group-hover:opacity-100
                          ${menuOpen ? "opacity-100" : "lg:opacity-0"}`}
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
                className="absolute right-0 top-10 z-dropdown w-40 animate-scale-in overflow-hidden
                           rounded-xl border border-ink-700/70 bg-ink-850 shadow-panel
                           ring-1 ring-inset ring-ink-50/[0.04]"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditClick?.(libro);
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
                    onDeleteClick?.(libro.id);
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

      {/* Metadatos fuera de la portada: la ficha respira y las alturas varían
          libremente sin romper la alineación de la grilla. */}
      <div className="mt-3">
        {categorias && (
          <p className="mb-1 truncate text-[11px] uppercase tracking-[0.14em] text-brass-500">
            {categorias}
          </p>
        )}
        <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-ink-50">
          <Link to={`/libros/${libro.id}`} className="rounded transition-colors hover:text-brass-300">
            {libro.titulo}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-sm text-ink-400">{libro.autor}</p>
      </div>
    </article>
  );
}
