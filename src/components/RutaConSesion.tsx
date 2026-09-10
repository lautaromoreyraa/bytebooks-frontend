import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

/**
 * Deja pasar solo con sesion iniciada.
 *
 * Sin esto, entrar a una ruta privada por URL disparaba el 401 de la API, que
 * `client.ts` traduce a "sesion expirada": a alguien que nunca inicio sesion le
 * aparecia ese modal y encima se le limpiaba el localStorage.
 */
export default function RutaConSesion({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) {
    const destino = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(destino)}`} replace />;
  }

  return <>{children}</>;
}
