
const RUTA_INTERNA = /^\/(?![/\\])/;

export function rutaInternaSegura(valor: string | null, porDefecto = "/"): string {
  if (!valor) return porDefecto;
  return RUTA_INTERNA.test(valor) ? valor : porDefecto;
}
