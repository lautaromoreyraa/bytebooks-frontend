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

export function borrarSesionGuardadaEnElNavegador(): void {
  try {
    for (const clave of ["token", "userId", "email", "role"]) {
      localStorage.removeItem(clave);
    }
  } catch {
  }
}
