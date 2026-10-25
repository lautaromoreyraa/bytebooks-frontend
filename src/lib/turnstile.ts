/**
 * Clave de sitio de Cloudflare Turnstile. Es pública por diseño: identifica al
 * widget, no autoriza nada. El secreto vive en la API.
 */
export const CLAVE_DEL_SITIO = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/** true si el registro tiene que esperar el desafío antes de enviarse. */
export const desafioActivo = Boolean(CLAVE_DEL_SITIO);
