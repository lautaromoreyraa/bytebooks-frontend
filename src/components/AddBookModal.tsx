import { useEffect, useRef, useState } from "react";
import { getCategorias } from "../api/categorias";
import { createLibro, previsualizarGoogleBooks, confirmarImportacion } from "../api/libros";
import { uploadImage } from "../lib/cloudinary";
import type { Categoria, GoogleBookCandidate, Libro } from "../types";

interface Props {
  onClose: () => void;
  onCreated: (libro: Libro) => void;
}

const ESTADO_OPTIONS: { value: "DISPONIBLE" | "OCULTO"; label: string }[] = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "OCULTO", label: "Oculto" },
];

// ─── Manual tab ──────────────────────────────────────────────────────────────

function ManualTab({
  categorias,
  loadingCats,
  onCreated,
  onClose,
}: {
  categorias: Categoria[];
  loadingCats: boolean;
  onCreated: (libro: Libro) => void;
  onClose: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaIds, setCategoriaIds] = useState<string[]>([]);
  const [editorial, setEditorial] = useState("");
  const [anioPublicacion, setAnioPublicacion] = useState("");
  const [estadoLibro, setEstadoLibro] = useState<"DISPONIBLE" | "OCULTO">("DISPONIBLE");

  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      let portadaUrl: string | undefined;
      if (portadaFile) {
        portadaUrl = await uploadImage(portadaFile);
      }

      const libro = await createLibro({
        titulo: titulo.trim(),
        autor: autor.trim(),
        descripcion: descripcion.trim() || undefined,
        categoriaIds,
        editorial: editorial.trim() || undefined,
        anioPublicacion: anioPublicacion.trim() || undefined,
        estadoLibro,
        portada: portadaUrl,
      });

      onCreated(libro);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el libro.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
          {portadaPreview ? (
            <div className="relative flex-shrink-0">
              <img
                src={portadaPreview}
                alt="Vista previa"
                className="w-24 h-32 object-cover rounded-lg border border-zinc-600"
              />
              <button
                type="button"
                onClick={handleRemovePortada}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
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
            {!portadaPreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-violet-400 hover:text-violet-300 underline"
              >
                Seleccionar archivo
              </button>
            )}
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
            placeholder="Ej: El Señor de los Anillos"
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
            placeholder="Ej: J.R.R. Tolkien"
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
          placeholder="Sinopsis del libro..."
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
            placeholder="Ej: Minotauro"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Año de publicación</label>
          <input
            type="text"
            value={anioPublicacion}
            onChange={(e) => setAnioPublicacion(e.target.value)}
            placeholder="Ej: 1954"
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
                      seleccionada ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                    )
                  }
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                    idx !== categorias.length - 1 ? "border-b border-zinc-800" : ""
                  } ${seleccionada ? "bg-violet-500/10 text-violet-400" : "text-zinc-300 hover:bg-zinc-800"}`}
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      seleccionada ? "border-violet-500 bg-violet-500" : "border-zinc-600"
                    }`}
                  >
                    {seleccionada && <span className="text-white text-[10px] leading-none">✓</span>}
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
          {loading ? "Guardando..." : "Agregar libro"}
        </button>
      </div>
    </form>
  );
}

// ─── Google Books tab ─────────────────────────────────────────────────────────

function GoogleBooksTab({
  categorias,
  loadingCats,
  onClose,
}: {
  categorias: Categoria[];
  loadingCats: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [candidatos, setCandidatos] = useState<GoogleBookCandidate[] | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [categoriaId, setCategoriaId] = useState("");
  const [importando, setImportando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ guardados: number; errores: number } | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBuscando(true);
    setErrorBusqueda(null);
    setCandidatos(null);
    setSeleccionados(new Set());
    setResultado(null);

    try {
      const libros = await previsualizarGoogleBooks(query.trim());
      setCandidatos(libros);
      setSeleccionados(new Set(libros.map((_, i) => i)));
    } catch (err) {
      setErrorBusqueda(err instanceof Error ? err.message : "Error al buscar en Google Books.");
    } finally {
      setBuscando(false);
    }
  }

  function toggleSeleccion(idx: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function toggleTodos() {
    if (!candidatos) return;
    if (seleccionados.size === candidatos.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(candidatos.map((_, i) => i)));
    }
  }

  async function handleImportar() {
    if (!candidatos || seleccionados.size === 0 || !categoriaId) return;
    setImportando(true);
    setErrorImportacion(null);

    try {
      const libros = candidatos.filter((_, i) => seleccionados.has(i));
      const res = await confirmarImportacion({ libros, categoriaId });
      setResultado({ guardados: res.guardados, errores: res.descartadosPorError });
      setCandidatos(null);
      setSeleccionados(new Set());
      setQuery("");
    } catch (err) {
      setErrorImportacion(err instanceof Error ? err.message : "Error al importar los libros.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Búsqueda */}
      <form onSubmit={handleBuscar} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o autor..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={buscando || !query.trim()}
          className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {errorBusqueda && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {errorBusqueda}
        </p>
      )}

      {/* Resultado exitoso */}
      {resultado && (
        <div className="text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-green-400">
          Se importaron {resultado.guardados} libro{resultado.guardados !== 1 ? "s" : ""} correctamente.
          {resultado.errores > 0 && (
            <span className="text-yellow-400"> ({resultado.errores} con error)</span>
          )}
        </div>
      )}

      {/* Lista de candidatos */}
      {candidatos !== null && (
        <>
          {candidatos.length === 0 ? (
            <p className="text-zinc-500 text-sm">No se encontraron resultados nuevos para esa búsqueda.</p>
          ) : (
            <>
              {/* Controles de selección */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">
                  {seleccionados.size} de {candidatos.length} seleccionados
                </span>
                <button
                  type="button"
                  onClick={toggleTodos}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  {seleccionados.size === candidatos.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              </div>

              {/* Lista */}
              <div className="border border-zinc-700 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                {candidatos.map((libro, idx) => {
                  const seleccionado = seleccionados.has(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSeleccion(idx)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        idx !== candidatos.length - 1 ? "border-b border-zinc-800" : ""
                      } ${seleccionado ? "bg-violet-500/10" : "hover:bg-zinc-800"}`}
                    >
                      {/* Checkbox */}
                      <span
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          seleccionado ? "border-violet-500 bg-violet-500" : "border-zinc-600"
                        }`}
                      >
                        {seleccionado && <span className="text-white text-[10px] leading-none">✓</span>}
                      </span>

                      {/* Portada */}
                      {libro.portada ? (
                        <img
                          src={libro.portada}
                          alt={libro.titulo}
                          className="w-8 h-11 object-cover rounded flex-shrink-0 border border-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-11 bg-zinc-700 rounded flex-shrink-0 border border-zinc-700" />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-100 font-medium truncate">{libro.titulo}</p>
                        <p className="text-xs text-zinc-400 truncate">{libro.autor}</p>
                        {libro.anioPublicacion && (
                          <p className="text-xs text-zinc-600">{libro.anioPublicacion}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Categoría + Importar */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Categoría <span className="text-red-400">*</span>
                  </label>
                  {loadingCats ? (
                    <p className="text-sm text-zinc-500">Cargando categorías...</p>
                  ) : (
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {errorImportacion && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    {errorImportacion}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportar}
                    disabled={importando || seleccionados.size === 0 || !categoriaId}
                    className="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {importando
                      ? "Importando..."
                      : `Importar ${seleccionados.size > 0 ? `(${seleccionados.size})` : ""}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Cancelar cuando no hay resultados todavía */}
      {candidatos === null && !buscando && !resultado && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

export default function AddBookModal({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<"manual" | "google">("manual");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    getCategorias()
      .then(setCategorias)
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Agregar libro</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6">
          {(["manual", "google"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-3 px-1 mr-6 text-sm border-b-2 transition-colors ${
                tab === t
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "manual" ? "Manual" : "Google Books"}
            </button>
          ))}
        </div>

        {tab === "manual" ? (
          <ManualTab
            categorias={categorias}
            loadingCats={loadingCats}
            onCreated={onCreated}
            onClose={onClose}
          />
        ) : (
          <GoogleBooksTab
            categorias={categorias}
            loadingCats={loadingCats}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
