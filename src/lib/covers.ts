/**
 * Portada por ISBN desde Open Library, que da imágenes más grandes que las
 * miniaturas de Google Books guardadas en `libro.portada`.
 *
 * `default=false` no es opcional: sin ese parámetro, un ISBN que Open Library
 * no tiene responde 200 con una imagen en blanco de 43 bytes. El `onError` de
 * la portada nunca se dispara y la tarjeta queda vacía en lugar de caer al
 * `portada` del libro. Con el parámetro responde 404 y el fallback funciona.
 */
export function getOpenLibraryCover(isbn: string | null): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
}
