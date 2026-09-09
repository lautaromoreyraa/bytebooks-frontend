/**
 * Espejo de las reglas de autorización del backend (SecurityConfig). Si acá se
 * muestra una acción que allá está prohibida, el usuario completa el formulario
 * entero para recibir un 403 al enviarlo.
 *
 *   POST   /libros        -> ROLE_ADMIN
 *   /admin/**             -> ROLE_ADMIN   (importación desde Google Books)
 *   PUT    /libros/**     -> ROLE_ADMIN, ROLE_MODERATOR
 *   DELETE /libros/**     -> ROLE_ADMIN, ROLE_MODERATOR
 *   DELETE /resenas/{id}  -> autor de la reseña, ROLE_ADMIN o ROLE_MODERATOR
 */

const ADMIN = "ROLE_ADMIN";
const MODERATOR = "ROLE_MODERATOR";

/** Editar o eliminar libros ya cargados, y moderar reseñas ajenas. */
export function puedeEditarLibros(role: string | undefined): boolean {
  return role === ADMIN || role === MODERATOR;
}

/** Crear libros e importarlos desde Google Books. Sólo administración. */
export function puedeCrearLibros(role: string | undefined): boolean {
  return role === ADMIN;
}
