/**
 * Las mismas reglas que valida la API sobre un libro, comprobadas antes de
 * mandar nada.
 *
 * No es cosmético: la portada se sube a Cloudinary **antes** del POST, así que
 * un año de tres dígitos o una sinopsis demasiado larga terminaba en un 400 con
 * la imagen ya subida y el formulario perdido. Los límites están acá y no
 * escritos dos veces en cada modal para que sigan siendo los mismos.
 */

/** `@Size(max = 1000)` en LibroRequestDto.descripcion. */
export const LIMITE_SINOPSIS = 1000;

const ANIO_DE_CUATRO_DIGITOS = /^\d{4}$/;

interface CamposDelLibro {
  titulo: string;
  autor: string;
  categoriaIds: string[];
  descripcion: string;
  anioPublicacion: string;
}

/** El mensaje del primer problema encontrado, o null si el formulario sirve. */
export function validarLibro(campos: CamposDelLibro): string | null {
  if (!campos.titulo.trim() || !campos.autor.trim() || campos.categoriaIds.length === 0) {
    return "Título, autor y al menos una categoría son obligatorios.";
  }

  const anio = campos.anioPublicacion.trim();
  if (anio && !ANIO_DE_CUATRO_DIGITOS.test(anio)) {
    return "El año de publicación tiene que ser de cuatro dígitos. Por ejemplo: 1954.";
  }

  if (campos.descripcion.trim().length > LIMITE_SINOPSIS) {
    return `La sinopsis no puede pasar de ${LIMITE_SINOPSIS} caracteres.`;
  }

  return null;
}
