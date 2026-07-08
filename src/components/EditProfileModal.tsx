import { useEffect, useRef, useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Editar perfil</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Foto de perfil
            </label>
            <div className="flex items-center gap-4">
              {fotoActual ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={fotoActual}
                    alt="Foto de perfil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-zinc-600"
                  />
                  {fotoFile && (
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-medium text-2xl flex-shrink-0 border-2 border-zinc-600">
                  {iniciales}
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 border border-dashed border-zinc-600 hover:border-violet-500 rounded-lg text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  {fotoFile ? "Cambiar foto" : "Subir nueva foto"}
                </button>
                <p className="text-xs text-zinc-500 mt-1.5">JPG, PNG o WEBP · Máx. 10 MB</p>
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
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Contá algo sobre vos..."
              rows={4}
              maxLength={500}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <p className="text-xs text-zinc-500 text-right mt-1">
              {descripcion.length}/500
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
