/**
 * Rutas de vuelta despues de iniciar sesion.
 *
 * `returnTo` viaja en la query, o sea que lo escribe quien arma el enlace. Un
 * `/login?returnTo=//otro-sitio` es la forma clasica del open redirect: el
 * navegador lee `//host` como una URL absoluta con el protocolo actual y se va
 * del sitio. Por eso solo se acepta una ruta interna: una sola barra al
 * principio, y nada que el navegador pueda leer como origen.
 */

const RUTA_INTERNA = /^\/(?![/\\])/;

export function rutaInternaSegura(valor: string | null, porDefecto = "/"): string {
  if (!valor) return porDefecto;
  return RUTA_INTERNA.test(valor) ? valor : porDefecto;
}
