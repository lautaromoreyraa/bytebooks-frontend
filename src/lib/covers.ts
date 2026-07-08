export function getOpenLibraryCover(isbn: string | null): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}
