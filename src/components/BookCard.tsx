import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addFavorito, removeFavorito, getFavoritos } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
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

function canManageBooks(role: string) {
  return role === "ROLE_ADMIN" || role === "ROLE_MODERATOR";
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

  const showMenu = Boolean(auth);

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

  return (
    <div className="relative">
      <Link
        to={`/libros/${libro.id}`}
        className="block bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-500 transition-colors"
      >
        {coverSrc ? (
          <div className="w-full aspect-[2/3] bg-zinc-900 flex items-center justify-center overflow-hidden">
            <img
              src={coverSrc}
              alt={libro.titulo}
              className="w-full h-full object-contain"
              loading="lazy"
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
          <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-600 text-sm">Sin portada</span>
          </div>
        )}
        <div className="p-4">
          <p className="text-xs text-violet-500 mb-1">{libro.categorias.map((c) => c.nombre).join(" · ")}</p>
          <div className="flex items-start mb-1">
            <h3 className="text-zinc-100 font-medium leading-snug">{libro.titulo}</h3>
          </div>
          <p className="text-zinc-400 text-sm">{libro.autor}</p>
          {libro.descripcion && (
            <p className="text-zinc-500 text-sm mt-2 line-clamp-2">{libro.descripcion}</p>
          )}
        </div>
      </Link>

      {showMenu && (
        <div ref={menuRef} className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-lg leading-none backdrop-blur-sm transition-colors"
            title="Opciones"
          >
            ⋮
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 w-44 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  void handleFavorito();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              >
                {esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
              </button>
              {auth && canManageBooks(auth.role) && (onEditClick || onDeleteClick) && (
                <>
                  <div className="border-t border-zinc-700" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEditClick?.(libro);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDeleteClick?.(libro.id);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
