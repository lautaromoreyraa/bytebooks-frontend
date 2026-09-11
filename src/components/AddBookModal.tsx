import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { getCategorias } from "../api/categorias";
import { createLibro, previsualizarGoogleBooks, confirmarImportacion } from "../api/libros";
import { uploadImage } from "../lib/cloudinary";
import { validarLibro, LIMITE_SINOPSIS } from "../lib/validacionDeLibro";
import type { Categoria, GoogleBookCandidate, Libro } from "../types";

interface Props {
  onClose: () => void;
  onCreated: (libro: Libro) => void;
  /** Se llama cuando la importación guarda al menos un libro. La carga manual
   *  devuelve el libro y se agrega a la grilla; una importación guarda varios,
   *  así que lo único razonable es que el catálogo se vuelva a pedir. */
  onImported: () => void;
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
    const problema = validarLibro({
      titulo,
      autor,
      categoriaIds,
      descripcion,
      anioPublicacion,
    });
    if (problema) {
      setError(problema);
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
        <p role="alert"
          className="rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400">
          {error}
        </p>
      )}

      {/* Portada */}
      <div>
        <label className="label">Portada</label>
        <div className="flex items-start gap-4">
          {portadaPreview ? (
            <div className="relative flex-shrink-0">
              <img
                src={portadaPreview}
                alt="Vista previa"
                className="h-32 w-24 rounded-lg object-cover shadow-card ring-1 ring-inset ring-ink-50/[0.08]"
              />
              <button
                type="button"
                onClick={handleRemovePortada}
                className="absolute -top-2 -right-2 w-5 h-5 bg-ember-500 hover:bg-ember-400 rounded-full text-ink-950 text-xs flex items-center justify-center"
              >
                ✕
              </button>
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
            {!portadaPreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded text-brass-400 underline decoration-brass-500/40 underline-offset-4 transition-colors duration-200 hover:text-brass-300"
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
          <label className="label">
            Título <span className="text-ember-400">*</span>
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: El Señor de los Anillos"
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
            placeholder="Ej: J.R.R. Tolkien"
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
          placeholder="Sinopsis del libro..."
          rows={3}
          maxLength={LIMITE_SINOPSIS}
          className="field resize-none"
        />
        {descripcion.length > LIMITE_SINOPSIS - 100 && (
          <p className="num mt-1.5 text-right text-xs text-ink-500">
            {descripcion.length}/{LIMITE_SINOPSIS}
          </p>
        )}
      </div>

      {/* Editorial y Año */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Editorial</label>
          <input
            type="text"
            value={editorial}
            onChange={(e) => setEditorial(e.target.value)}
            placeholder="Ej: Minotauro"
            className="field"
          />
        </div>
        <div>
          <label className="label">Año de publicación</label>
          {/* Solo dígitos: la API pide cuatro exactos y el 400 llegaba después
              de haber subido la portada. */}
          <input
            type="text"
            inputMode="numeric"
            value={anioPublicacion}
            onChange={(e) => setAnioPublicacion(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej: 1954"
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
                      seleccionada ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                    )
                  }
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                    idx !== categorias.length - 1 ? "border-b border-ink-800" : ""
                  } ${seleccionada ? "bg-brass-500/12 text-brass-300" : "text-ink-200 hover:bg-ink-800"}`}
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      seleccionada ? "border-brass-500 bg-brass-500" : "border-ink-600"
                    }`}
                  >
                    {seleccionada && <span className="text-[10px] font-bold leading-none text-ink-950">✓</span>}
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
  onImported,
}: {
  categorias: Categoria[];
  loadingCats: boolean;
  onClose: () => void;
  onImported: () => void;
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

      // Los libros quedaban guardados y la interfaz decía lo contrario: el
      // catálogo no se tocaba, así que el admin cerraba el modal, no veía nada
      // nuevo, salía y volvía, y seguía sin ver nada.
      if (res.guardados > 0) {
        onImported();
      }
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
          className="field flex-1"
        />
        <button
          type="submit"
          disabled={buscando || !query.trim()}
          className="btn-primary whitespace-nowrap"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {errorBusqueda && (
        <p role="alert"
          className="rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400">
          {errorBusqueda}
        </p>
      )}

      {/* Resultado exitoso */}
      {resultado && (
        <>
          <div className="text-sm bg-sage-500/10 border border-sage-500/20 rounded-lg px-4 py-3 text-sage-400">
            Se importaron {resultado.guardados} libro{resultado.guardados !== 1 ? "s" : ""} correctamente
            {resultado.guardados > 0 && " y ya están en el catálogo"}.
            {resultado.errores > 0 && (
              <span className="text-brass-400"> ({resultado.errores} con error)</span>
            )}
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="btn-primary px-5">
              Listo
            </button>
          </div>
        </>
      )}

      {/* Lista de candidatos */}
      {candidatos !== null && (
        <>
          {candidatos.length === 0 ? (
            <p className="text-ink-400 text-sm">No se encontraron resultados nuevos para esa búsqueda.</p>
          ) : (
            <>
              {/* Controles de selección */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-300">
                  {seleccionados.size} de {candidatos.length} seleccionados
                </span>
                <button
                  type="button"
                  onClick={toggleTodos}
                  className="text-xs text-brass-400 hover:text-brass-300"
                >
                  {seleccionados.size === candidatos.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              </div>

              {/* Lista */}
              <div className="border border-ink-700 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                {candidatos.map((libro, idx) => {
                  const seleccionado = seleccionados.has(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSeleccion(idx)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        idx !== candidatos.length - 1 ? "border-b border-ink-800" : ""
                      } ${seleccionado ? "bg-brass-500/12" : "hover:bg-ink-800"}`}
                    >
                      {/* Checkbox */}
                      <span
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          seleccionado ? "border-brass-500 bg-brass-500" : "border-ink-600"
                        }`}
                      >
                        {seleccionado && <span className="text-[10px] font-bold leading-none text-ink-950">✓</span>}
                      </span>

                      {/* Portada */}
                      {libro.portada ? (
                        <img
                          src={libro.portada}
                          alt={libro.titulo}
                          className="w-8 h-11 object-cover rounded flex-shrink-0 border border-ink-700"
                        />
                      ) : (
                        <div className="w-8 h-11 bg-ink-700 rounded flex-shrink-0 border border-ink-700" />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-50 font-medium truncate">{libro.titulo}</p>
                        <p className="text-xs text-ink-300 truncate">{libro.autor}</p>
                        {libro.anioPublicacion && (
                          <p className="text-xs text-ink-600">{libro.anioPublicacion}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Categoría + Importar */}
              <div className="space-y-3">
                <div>
                  <label className="label">
                    Categoría <span className="text-ember-400">*</span>
                  </label>
                  {loadingCats ? (
                    <p className="text-sm text-ink-400">Cargando categorías...</p>
                  ) : (
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      className="field"
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
                  <p role="alert"
          className="rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400">
                    {errorImportacion}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportar}
                    disabled={importando || seleccionados.size === 0 || !categoriaId}
                    className="btn-primary px-5"
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
            className="btn-ghost"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

export default function AddBookModal({ onClose, onCreated, onImported }: Props) {
  const [tab, setTab] = useState<"manual" | "google">("manual");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    getCategorias()
      .then(setCategorias)
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const tabs = (
    <div className="flex gap-6 px-6">
      {(["manual", "google"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          aria-current={tab === t ? "true" : undefined}
          className={`-mb-px border-b-2 px-1 py-3 text-sm transition-colors duration-200 ${
            tab === t
              ? "border-brass-500 text-brass-300"
              : "border-transparent text-ink-400 hover:text-ink-100"
          }`}
        >
          {t === "manual" ? "Carga manual" : "Google Books"}
        </button>
      ))}
    </div>
  );

  return (
    <Modal title="Agregar libro" onClose={onClose} size="lg" header={tabs}>
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
          onImported={onImported}
        />
      )}
    </Modal>
  );
}
