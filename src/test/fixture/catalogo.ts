import type { Categoria, Libro, Resena } from "../../types";

/**
 * Datos armados para los tests.
 *
 * Cada funcion devuelve algo valido y completo, y recibe los campos que ese
 * test necesita pisar. Asi lo unico escrito en el test es lo que el test
 * prueba, y el resto no distrae.
 */

export function unaCategoria(cambios: Partial<Categoria> = {}): Categoria {
  return {
    id: "categoria-1",
    nombre: "Narrativa",
    descripcion: null,
    ...cambios,
  };
}

export function unLibro(cambios: Partial<Libro> = {}): Libro {
  return {
    id: "libro-1",
    isbn: "9788437604572",
    titulo: "Rayuela",
    autor: "Julio Cortázar",
    descripcion: "Una sinopsis.",
    categorias: [unaCategoria()],
    editorial: "Sudamericana",
    anioPublicacion: "1963",
    estadoLibro: "DISPONIBLE",
    portada: null,
    ...cambios,
  };
}

export function unaResena(cambios: Partial<Resena> = {}): Resena {
  return {
    id: "resena-1",
    libroId: "libro-1",
    usuarioId: "usuario-1",
    nombreUsuario: "Alguien Que Lee",
    comentario: "Muy buena.",
    puntuacion: 5,
    fechaResena: "2026-04-04T13:56:30.256+00:00",
    ...cambios,
  };
}

/** Una pagina de la API con un solo elemento, o los que se le pasen. */
export function unaPagina<T>(content: T[], total = content.length) {
  return {
    content,
    totalPages: Math.max(1, Math.ceil(total / 10)),
    totalElements: total,
    number: 0,
    size: 10,
    last: content.length >= total,
    first: true,
  };
}
