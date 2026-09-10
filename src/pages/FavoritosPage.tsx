import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFavoritos } from "../api/usuarios";
import BookCard from "../components/BookCard";
import EmptyState from "../components/EmptyState";
import { BookGridSkeleton } from "../components/Skeleton";
import type { Libro } from "../types";

export default function FavoritosPage() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFavoritos()
      .then(setLibros)
      .catch(() => setError("No se pudieron cargar los favoritos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="mb-10">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-brass-500">Tu lista</p>
        <h1 className="font-display text-4xl font-semibold tracking-tightest text-ink-50 sm:text-5xl">
          Mis favoritos
        </h1>
        {!loading && !error && libros.length > 0 && (
          <p className="mt-4 text-sm text-ink-400">
            <span className="num text-ink-200">{libros.length}</span>{" "}
            {libros.length === 1 ? "libro guardado" : "libros guardados"}.
          </p>
        )}
      </header>

      {loading && <BookGridSkeleton count={4} />}

      {!loading && error && (
        <EmptyState
          variant="warning"
          title="No pudimos cargar tu lista"
          description="La conexión con el servidor falló. Volvé a intentarlo en unos segundos."
          action={
            <button onClick={() => window.location.reload()} className="btn-secondary">
              Reintentar
            </button>
          }
        />
      )}

      {!loading && !error && libros.length === 0 && (
        <EmptyState
          variant="bookmark"
          title="Todavía no guardaste nada"
          description="Usá el marcador que aparece sobre cada portada para armar tu lista de lectura."
          action={
            <Link to="/" className="btn-primary">
              Explorar el catálogo
            </Link>
          }
        />
      )}

      {!loading && !error && libros.length > 0 && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
          {libros.map((libro, i) => (
            <div
              key={libro.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
            >
              <BookCard
                libro={libro}
                initialEsFavorito
                skipFavoritosFetch
                onFavoritoChange={(libroId, esFav) => {
                  if (!esFav) setLibros((prev) => prev.filter((l) => l.id !== libroId));
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
