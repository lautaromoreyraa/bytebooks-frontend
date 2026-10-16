/**
 * La sesión vive en memoria, no en el almacenamiento del navegador.
 *
 * Un token en `localStorage` lo puede leer cualquier script que llegue a correr
 * en la página, y sobrevive a quien se levantó de la computadora. En memoria se
 * pierde al recargar o cerrar la pestaña, y el JWT de la API dura media hora:
 * volver a iniciar sesión es el costo, y es chico.
 */
export interface Sesion {
  token: string;
  userId: string;
  email: string;
  role: string;
}

let actual: Sesion | null = null;

export function sesionActual(): Sesion | null {
  return actual;
}

export function guardarSesion(sesion: Sesion): void {
  actual = sesion;
}

export function borrarSesion(): void {
  actual = null;
}

/**
 * Hasta que la sesión pasó a memoria se guardaba en `localStorage`. Quien
 * inició sesión antes todavía tiene ahí el token: se borra al arrancar para que
 * no quede legible en el navegador.
 */
export function borrarSesionGuardadaEnElNavegador(): void {
  try {
    for (const clave of ["token", "userId", "email", "role"]) {
      localStorage.removeItem(clave);
    }
  } catch {
    // Sin acceso al almacenamiento (modo privado estricto) no hay nada que borrar.
  }
}
