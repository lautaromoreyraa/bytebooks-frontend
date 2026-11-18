
export const LIMITE_SINOPSIS = 1000;

const ANIO_DE_CUATRO_DIGITOS = /^\d{4}$/;

interface CamposDelLibro {
  titulo: string;
  autor: string;
  categoriaIds: string[];
  descripcion: string;
  anioPublicacion: string;
}

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
