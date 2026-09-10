import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { updatePerfil } from "../api/usuarios";
import { uploadImage } from "../lib/cloudinary";
import type { UsuarioPerfil } from "../types";

interface Props {
  usuario: UsuarioPerfil;
  onClose: () => void;
  onUpdated: (usuario: UsuarioPerfil) => void;
}

export default function EditProfileModal({ usuario, onClose, onUpdated }: Props) {
  const [descripcion, setDescripcion] = useState(usuario.descripcion ?? "");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function handleRemoveFoto() {
    setFotoFile(null);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let fotoPerfil: string | undefined;
      if (fotoFile) {
        fotoPerfil = await uploadImage(fotoFile);
      }

      const updated = await updatePerfil({
        fotoPerfil,
        descripcion: descripcion.trim() || undefined,
      });

      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  const fotoActual = fotoPreview ?? usuario.fotoPerfil;

  return (
    <Modal title="Editar perfil" onClose={onClose} size="md" dismissible={!loading}>
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400"
            >
              {error}
            </p>
          )}

          {/* Foto de perfil */}
          <div>
            <p className="label">Foto de perfil</p>
            <div className="flex items-center gap-4">
              {fotoActual ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={fotoActual}
                    alt="Foto de perfil"
                    className="h-20 w-20 rounded-2xl object-cover ring-1 ring-inset ring-ink-50/[0.08]"
                  />
                  {fotoFile && (
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-ember-500 hover:bg-ember-400 rounded-full text-ink-950 text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-ink-800 font-display text-2xl font-semibold text-brass-400 ring-1 ring-inset ring-ink-50/[0.08]">
                  {iniciales}
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border border-dashed border-ink-600 px-4 py-2 text-sm text-ink-300 transition-colors duration-200 hover:border-brass-500 hover:text-brass-400"
                >
                  {fotoFile ? "Cambiar foto" : "Subir nueva foto"}
                </button>
                <p className="mt-2 text-xs text-ink-500">JPG, PNG o WEBP · máximo 10 MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="perfil-descripcion" className="label">
              Descripción
            </label>
            <textarea
              id="perfil-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Contá algo sobre vos..."
              rows={4}
              maxLength={500}
              className="field resize-none"
            />
            <p className="num mt-1.5 text-right text-xs text-ink-500">
              {descripcion.length}/500
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-ghost"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-5"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
      </form>
    </Modal>
  );
}
