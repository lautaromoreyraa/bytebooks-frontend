import { useEffect, useRef, useState } from "react";
import { getCategorias } from "../api/categorias";
import { updateLibro } from "../api/libros";
import { uploadImage } from "../lib/cloudinary";
import type { Categoria, Libro } from "../types";

interface Props {
  libro: Libro;
  onClose: () => void;
  onUpdated: (libro: Libro) => void;
}

const ESTADO_OPTIONS: { value: "DISPONIBLE" | "OCULTO"; label: string }[] = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "OCULTO", label: "Oculto" },
];

export default function EditBookModal({ libro, onClose, onUpdated }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [titulo, setTitulo] = useState(libro.titulo);
  const [autor, setAutor] = useState(libro.autor);
  const [descripcion, setDescripcion] = useState(libro.descripcion ?? "");
  const [categoriaIds, setCategoriaIds] = useState<string[]>(libro.categorias.map((c) => c.id));
  const [editorial, setEditorial] = useState(libro.editorial ?? "");
  const [anioPublicacion, setAnioPublicacion] = useState(libro.anioPublicacion ?? "");
  const [estadoLibro, setEstadoLibro] = useState<"DISPONIBLE" | "OCULTO">(
    libro.estadoLibro ?? "DISPONIBLE"
  );

  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategorias()
      .then((cats) => setCategorias(cats))
      .catch(() => setError("No se pudieron cargar las categorías."))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    return () => {
      if (portadaPreview) URL.revokeObjectURL(portadaPreview);
    };
  }, [portadaPreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortadaFile(file);
    setPortadaPreview(URL.createObjectURL(file));
  }

  function handleRemovePortada() {
    setPortadaFile(null);
    if (portadaPreview) URL.revokeObjectURL(portadaPreview);
    setPortadaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim() || categoriaIds.length === 0) {
      setError("Título, autor y al menos una categoría son obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let portadaUrl = libro.portada ?? undefined;
      if (portadaFile) {
        portadaUrl = await uploadImage(portadaFile);
      }

      const updated = await updateLibro(libro.id, {
        titulo: titulo.trim(),
        autor: autor.trim(),
        descripcion: descripcion.trim() || undefined,
        categoriaIds,
        editorial: editorial.trim() || undefined,
        anioPublicacion: anioPublicacion.trim() || undefined,
        estadoLibro,
        portada: portadaUrl,
      });

      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el libro.");
    } finally {
      setLoading(false);
    }
  }

  const portadaMostrada = portadaPreview ?? libro.portada;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Editar libro</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-xl leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Portada */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Portada</label>
            <div className="flex items-start gap-4">
              {portadaMostrada ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={portadaMostrada}
                    alt="Vista previa"
                    className="w-24 h-32 object-cover rounded-lg border border-zinc-600"
                  />
                  {portadaFile && (
                    <button
                      type="button"
                      onClick={handleRemovePortada}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-32 border-2 border-dashed border-zinc-600 hover:border-violet-500 rounded-lg flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-violet-400 transition-colors text-xs"
                >
                  <span className="text-2xl">+</span>
                  <span>Subir imagen</span>
                </button>
              )}
              <div className="flex-1 text-xs text-zinc-500">
                <p>Formatos: JPG, PNG, WEBP</p>
                <p>Tamaño máximo: 10 MB</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-violet-400 hover:text-violet-300 underline"
                >
                  {portadaMostrada ? "Cambiar portada" : "Seleccionar archivo"}
                </button>
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

          {/* Título y Autor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Autor <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Editorial y Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Editorial</label>
              <input
                type="text"
                value={editorial}
                onChange={(e) => setEditorial(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Año de publicación</label>
              <input
                type="text"
                value={anioPublicacion}
                onChange={(e) => setAnioPublicacion(e.target.value)}
                maxLength={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Estado</label>
            <div className="flex gap-3">
              {ESTADO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEstadoLibro(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    estadoLibro === opt.value
                      ? "border-violet-500 bg-violet-500/10 text-violet-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Categorías <span className="text-red-400">*</span>
            </label>
            {loadingCats ? (
              <p className="text-sm text-zinc-500">Cargando categorías...</p>
            ) : (
              <div className="border border-zinc-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {categorias.map((cat, idx) => {
                  const seleccionada = categoriaIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setCategoriaIds((prev) =>
                          seleccionada
                            ? prev.filter((id) => id !== cat.id)
                            : [...prev, cat.id]
                        )
                      }
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                        idx !== categorias.length - 1 ? "border-b border-zinc-800" : ""
                      } ${
                        seleccionada
                          ? "bg-violet-500/10 text-violet-400"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          seleccionada ? "border-violet-500 bg-violet-500" : "border-zinc-600"
                        }`}
                      >
                        {seleccionada && (
                          <span className="text-white text-[10px] leading-none">✓</span>
                        )}
                      </span>
                      <span>{cat.nombre}</span>
                      {cat.descripcion && (
                        <span className="text-zinc-500 text-xs ml-auto truncate max-w-[120px]">
                          {cat.descripcion}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
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
