import type { Libro, Categoria } from "../types";

/**
 * Cache en memoria del catálogo, para que volver a la home desde una ficha no
 * dispare otra carga completa.
 *
 * Lo importante es que **el catálogo depende de quién mira**: la API devuelve
 * los libros ocultos a admin y moderador, y al resto no. Mientras el cache fue
 * un global anónimo, cerrar sesión dejaba esos libros en pantalla hasta que
 * vencía el TTL, e iniciar sesión como admin no los revelaba hasta lo mismo.
 * Por eso `AuthContext` lo invalida en cada cambio de sesión.
 */

const TTL_MS = 30_000;

let libros: Libro[] | null = null;
let categorias: Categoria[] | null = null;
let guardadoEn = 0;

interface Catalogo {
  libros: Libro[];
  categorias: Categoria[];
}

function contenido(): Catalogo | null {
  if (libros === null || categorias === null) return null;
  return { libros, categorias };
}

/** Devuelve el catálogo sólo si sigue fresco. */
export function leerCatalogo(): Catalogo | null {
  if (Date.now() - guardadoEn >= TTL_MS) return null;
  return contenido();
}

/**
 * Devuelve lo último que se guardó, aunque haya vencido. Se usa como red cuando
 * la API no responde: mostrar datos viejos es mejor que una pantalla de error.
 */
export function leerCatalogoVencido(): Catalogo | null {
  return contenido();
}

export function guardarCatalogo(nuevosLibros: Libro[], nuevasCategorias: Categoria[]): void {
  libros = nuevosLibros;
  categorias = nuevasCategorias;
  guardadoEn = Date.now();
}

export function invalidarCatalogo(): void {
  libros = null;
  categorias = null;
  guardadoEn = 0;
}
