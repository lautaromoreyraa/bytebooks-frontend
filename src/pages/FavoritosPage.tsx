import { useEffect, useState } from "react";
import { getFavoritos } from "../api/usuarios";
import BookCard from "../components/BookCard";
import Spinner from "../components/Spinner";
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Mis favoritos</h1>
        <p className="text-zinc-400 text-sm">Los libros que guardaste</p>
      </div>

      {loading && <Spinner />}
      {error && <p className="text-zinc-400 text-sm">{error}</p>}

      {!loading && !error && libros.length === 0 && (
        <p className="text-zinc-500 text-sm">Todavía no agregaste ningún favorito.</p>
      )}

      {!loading && !error && libros.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {libros.map((libro) => (
            <BookCard
              key={libro.id}
              libro={libro}
              initialEsFavorito
              skipFavoritosFetch
            />
          ))}
        </div>
      )}
    </div>
  );
}
