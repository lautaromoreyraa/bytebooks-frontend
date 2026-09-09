import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUsuario, getFavoritosDeUsuario } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import EditProfileModal from "../components/EditProfileModal";
import BookCard from "../components/BookCard";
import EmptyState from "../components/EmptyState";
import { BookGridSkeleton, ProfileSkeleton } from "../components/Skeleton";
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

  if (loading) return <ProfileSkeleton />;

  if (error || !usuario) {
    return (
      <EmptyState
        variant="warning"
        title="No encontramos este perfil"
        description={error ?? "El usuario no existe o el enlace está mal escrito."}
        action={
          <Link to="/" className="btn-secondary">
            Ir al catálogo
          </Link>
        }
      />
    );
  }

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  return (
    <div>
      <header className="mb-12">
        <div className="flex flex-wrap items-start gap-5">
          {/* Squircle en lugar del círculo de avatar de siempre. */}
          {usuario.fotoPerfil ? (
            <img
              src={usuario.fotoPerfil}
              alt={`Foto de ${usuario.nombre} ${usuario.apellido}`}
              className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover shadow-card ring-1 ring-inset ring-ink-50/[0.08]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl
                         bg-ink-800 font-display text-xl font-semibold text-brass-400
                         shadow-card ring-1 ring-inset ring-ink-50/[0.08]"
            >
              {iniciales}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tightest text-ink-50">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <p className="num mt-1.5 text-sm text-ink-500">
              {favoritos.length} {favoritos.length === 1 ? "libro guardado" : "libros guardados"}
            </p>
          </div>

          {isOwner && (
            <button onClick={() => setShowEditModal(true)} className="btn-secondary flex-shrink-0">
              Editar perfil
            </button>
          )}
        </div>

        {usuario.descripcion ? (
          <p className="prose-measure mt-6 text-[15px] leading-relaxed text-ink-300">
            {usuario.descripcion}
          </p>
        ) : (
          isOwner && (
            <p className="mt-6 text-sm text-ink-400">
              Tu perfil no tiene descripción.{" "}
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded text-brass-400 underline decoration-brass-500/40 underline-offset-4 transition-colors duration-200 hover:text-brass-300 hover:decoration-brass-400"
              >
                Escribí uno
              </button>
              .
            </p>
          )
        )}
      </header>

      <section className="border-t border-ink-800/80 pt-10">
        <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight text-ink-50">
          Libros favoritos
          {favoritos.length > 0 && (
            <span className="num ml-2.5 text-lg font-normal text-ink-500">
              {favoritos.length}
            </span>
          )}
        </h2>

        {loadingFavoritos && <BookGridSkeleton count={4} />}

        {!loadingFavoritos && errorFavoritos && (
          <EmptyState
            variant="warning"
            title="No pudimos cargar los favoritos"
            description={errorFavoritos}
          />
        )}

        {!loadingFavoritos && !errorFavoritos && favoritos.length === 0 && (
          <EmptyState
            variant="bookmark"
            title={isOwner ? "Tu lista está vacía" : "Sin favoritos públicos"}
            description={
              isOwner
                ? "Guardá libros desde el catálogo y van a aparecer acá."
                : `${usuario.nombre} todavía no guardó ningún libro.`
            }
            action={
              isOwner ? (
                <Link to="/" className="btn-primary">
                  Explorar el catálogo
                </Link>
              ) : undefined
            }
          />
        )}

        {!loadingFavoritos && !errorFavoritos && favoritos.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
            {favoritos.map((libro, i) => (
              <div
                key={libro.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
              >
                {/* En el perfil ajeno el marcador refleja los favoritos de quien
                    mira, no los del dueño del perfil: no se puede dar por hecho. */}
                <BookCard
                  libro={libro}
                  initialEsFavorito={isOwner}
                  skipFavoritosFetch={isOwner}
                  onFavoritoChange={
                    isOwner
                      ? (libroId, esFav) => {
                          if (!esFav) setFavoritos((prev) => prev.filter((l) => l.id !== libroId));
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

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
