import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUsuario, getFavoritosDeUsuario } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import EditProfileModal from "../components/EditProfileModal";
import BookCard from "../components/BookCard";
import Spinner from "../components/Spinner";
import type { Libro, UsuarioPerfil } from "../types";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { auth } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [favoritos, setFavoritos] = useState<Libro[]>([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(true);
  const [errorFavoritos, setErrorFavoritos] = useState<string | null>(null);

  const isOwner = auth?.userId === id;

  useEffect(() => {
    if (!id) return;
    getUsuario(id)
      .then(setUsuario)
      .catch(() => setError("No se pudo cargar el perfil."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getFavoritosDeUsuario(id)
      .then(setFavoritos)
      .catch(() => setErrorFavoritos("No se pudieron cargar los favoritos."))
      .finally(() => setLoadingFavoritos(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error || !usuario)
    return <p className="text-zinc-400 text-sm">{error ?? "Usuario no encontrado."}</p>;

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  return (
    <div>
      {/* Header de perfil */}
      <div className="max-w-sm mb-8">
        <div className="flex items-center gap-4 mb-4">
          {usuario.fotoPerfil ? (
            <img
              src={usuario.fotoPerfil}
              alt={usuario.nombre}
              className="w-14 h-14 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-medium text-lg">
              {iniciales}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-zinc-100">
              {usuario.nombre} {usuario.apellido}
            </h1>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-shrink-0 px-3 py-1.5 text-sm border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
            >
              Editar perfil
            </button>
          )}
        </div>

        {usuario.descripcion && (
          <p className="text-zinc-400 text-sm leading-relaxed">{usuario.descripcion}</p>
        )}

        {isOwner && !usuario.descripcion && (
          <p className="text-zinc-600 text-sm italic">
            Todavía no agregaste una descripción.{" "}
            <button
              onClick={() => setShowEditModal(true)}
              className="text-violet-500 hover:text-violet-400 not-italic underline"
            >
              Agregar una
            </button>
          </p>
        )}
      </div>

      {/* Favoritos */}
      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-lg font-medium text-zinc-100 mb-4">
          Libros favoritos
          {favoritos.length > 0 && (
            <span className="ml-2 text-base font-normal text-zinc-500">({favoritos.length})</span>
          )}
        </h2>

        {loadingFavoritos && <Spinner />}

        {!loadingFavoritos && errorFavoritos && (
          <p className="text-red-400 text-sm">{errorFavoritos}</p>
        )}

        {!loadingFavoritos && !errorFavoritos && favoritos.length === 0 && (
          <p className="text-zinc-500 text-sm">
            {isOwner ? "Todavía no agregaste favoritos." : "Este usuario no tiene favoritos."}
          </p>
        )}

        {!loadingFavoritos && !errorFavoritos && favoritos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favoritos.map((libro) => (
              <BookCard
                key={libro.id}
                libro={libro}
                initialEsFavorito
                skipFavoritosFetch
                onFavoritoChange={(_libroId, esFav) => {
                  if (!esFav) setFavoritos((prev) => prev.filter((l) => l.id !== libro.id));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          usuario={usuario}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setUsuario(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
