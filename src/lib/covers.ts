/**
 * Portada por ISBN desde Open Library.
 *
 * Ojo: hoy `LibroResponseDto` del backend no expone `isbn` (la entidad lo tiene
 * y la importación desde Google Books lo guarda, pero el mapper no lo mapea),
 * así que en producción esto devuelve null y la portada sale de `libro.portada`.
 * Si el backend agrega el campo, esta ruta empieza a funcionar sola.
 */
export function getOpenLibraryCover(isbn: string | null): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}
