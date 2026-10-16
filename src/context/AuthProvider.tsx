import { useEffect, useState, type ReactNode } from "react";
import type { AuthResponse } from "../types";
import { invalidarCatalogo } from "../lib/cacheDeCatalogo";
import { borrarSesion, guardarSesion, sesionActual } from "../api/sesion";
import { AuthContext, type AuthState } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  // La sesión vive en memoria (api/sesion.ts): al recargar la página se pierde.
  const [auth, setAuth] = useState<AuthState | null>(sesionActual);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    function handleSessionExpired() {
      setSessionExpired(true);
      invalidarCatalogo();
      borrarSesion();
      setAuth(null);
    }
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  function login(response: AuthResponse) {
    // El catalogo cacheado es de la sesion anterior, y la API devuelve libros
    // distintos segun el rol: hay que descartarlo en los dos sentidos.
    invalidarCatalogo();

    const state: AuthState = {
      userId: response.userId,
      email: response.email,
      token: response.accessToken,
      role: response.role ?? "ROLE_USER",
    };
    guardarSesion(state);
    setAuth(state);
  }

  function logout() {
    invalidarCatalogo();
    borrarSesion();
    setAuth(null);
  }

  function dismissSessionExpired() {
    setSessionExpired(false);
  }

  return (
    <AuthContext.Provider value={{ auth, sessionExpired, dismissSessionExpired, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
