import { useEffect, useRef, useState } from "react";
import { getCategorias } from "../api/categorias";
import Modal from "./Modal";
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
    <Modal title="Editar libro" onClose={onClose} size="lg" dismissible={!loading}>
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
          {error && (
            <p role="alert"
          className="rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400">
              {error}
            </p>
          )}

          {/* Portada */}
          <div>
            <label className="label">Portada</label>
            <div className="flex items-start gap-4">
              {portadaMostrada ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={portadaMostrada}
                    alt="Vista previa"
                    className="h-32 w-24 rounded-lg object-cover shadow-card ring-1 ring-inset ring-ink-50/[0.08]"
                  />
                  {portadaFile && (
                    <button
                      type="button"
                      onClick={handleRemovePortada}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-ember-500 hover:bg-ember-400 rounded-full text-ink-950 text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-600 text-xs text-ink-400 transition-colors duration-200 hover:border-brass-500 hover:text-brass-400"
                >
                  <span className="text-2xl">+</span>
                  <span>Subir imagen</span>
                </button>
              )}
              <div className="flex-1 text-xs text-ink-400">
                <p>Formatos: JPG, PNG, WEBP</p>
                <p>Tamaño máximo: 10 MB</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 rounded text-brass-400 underline decoration-brass-500/40 underline-offset-4 transition-colors duration-200 hover:text-brass-300"
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
              <label className="label">
                Título <span className="text-ember-400">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label className="label">
                Autor <span className="text-ember-400">*</span>
              </label>
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                className="field"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="field resize-none"
            />
          </div>

          {/* Editorial y Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Editorial</label>
              <input
                type="text"
                value={editorial}
                onChange={(e) => setEditorial(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label className="label">Año de publicación</label>
              <input
                type="text"
                value={anioPublicacion}
                onChange={(e) => setAnioPublicacion(e.target.value)}
                maxLength={4}
                className="field"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="label">Estado</label>
            <div className="flex gap-3">
              {ESTADO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEstadoLibro(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    estadoLibro === opt.value
                      ? "border-brass-500 bg-brass-500/10 text-brass-400"
                      : "border-ink-700 text-ink-300 hover:border-ink-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categorías */}
          <div>
            <label className="label">
              Categorías <span className="text-ember-400">*</span>
            </label>
            {loadingCats ? (
              <p className="text-sm text-ink-400">Cargando categorías...</p>
            ) : (
              <div className="border border-ink-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
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
                        idx !== categorias.length - 1 ? "border-b border-ink-800" : ""
                      } ${
                        seleccionada
                          ? "bg-brass-500/12 text-brass-300"
                          : "text-ink-200 hover:bg-ink-800"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          seleccionada ? "border-brass-500 bg-brass-500" : "border-ink-600"
                        }`}
                      >
                        {seleccionada && (
                          <span className="text-[10px] font-bold leading-none text-ink-950">✓</span>
                        )}
                      </span>
                      <span>{cat.nombre}</span>
                      {cat.descripcion && (
                        <span className="text-ink-400 text-xs ml-auto truncate max-w-[120px]">
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
