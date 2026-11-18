export const CLAVE_DEL_SITIO = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export const desafioActivo = Boolean(CLAVE_DEL_SITIO);
