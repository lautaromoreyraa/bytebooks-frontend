import type { Libro, Categoria } from "../types";


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

export function leerCatalogo(): Catalogo | null {
  if (Date.now() - guardadoEn >= TTL_MS) return null;
  return contenido();
}

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
