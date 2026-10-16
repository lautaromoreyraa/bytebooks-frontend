import { render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "../../context/AuthProvider";
import type { ReactElement, ReactNode } from "react";
import { guardarSesion } from "../../api/sesion";

/**
 * Render con lo que la aplicación real pone alrededor de cada pantalla: el
 * router y el contexto de sesión.
 *
 * Siempre se dibuja además la ubicación actual, porque varios arreglos consisten
 * justamente en adónde termina yendo la navegación —el guard de `/favoritos`,
 * el borrado desde la ficha— y sin esto habría que espiar el router por dentro.
 */

function Ubicacion() {
  const location = useLocation();
  return <div data-testid="ubicacion">{`${location.pathname}${location.search}`}</div>;
}

interface Opciones {
  /** Entrada del historial con la que arranca el test. */
  ruta?: string;
}

export function renderConRutas(rutas: ReactElement, { ruta = "/" }: Opciones = {}) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Ubicacion />
        {rutas}
      </AuthProvider>
    </MemoryRouter>
  );
}

/** El árbol pelado, para componentes que no dependen de la ruta. */
export function renderConSesionYRouter(children: ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

/**
 * Deja una sesión iniciada antes de montar. `AuthProvider` la lee de la sesión
 * en memoria al arrancar, así que tiene que guardarse antes del render.
 */
export function iniciarSesion(
  role: "ROLE_USER" | "ROLE_MODERATOR" | "ROLE_ADMIN" = "ROLE_USER",
  userId = "usuario-1"
) {
  guardarSesion({ token: "un-token", userId, email: "alguien@ejemplo.test", role });
}
