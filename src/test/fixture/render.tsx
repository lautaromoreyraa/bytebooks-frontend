import { render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "../../context/AuthProvider";
import type { ReactElement, ReactNode } from "react";
import { guardarSesion } from "../../api/sesion";


function Ubicacion() {
  const location = useLocation();
  return <div data-testid="ubicacion">{`${location.pathname}${location.search}`}</div>;
}

interface Opciones {
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

export function renderConSesionYRouter(children: ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

export function iniciarSesion(
  role: "ROLE_USER" | "ROLE_MODERATOR" | "ROLE_ADMIN" = "ROLE_USER",
  userId = "usuario-1"
) {
  guardarSesion({ token: "un-token", userId, email: "alguien@ejemplo.test", role });
}
