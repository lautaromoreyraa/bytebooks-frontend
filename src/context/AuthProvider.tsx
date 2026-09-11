import { useEffect, useState, type ReactNode } from "react";
import type { AuthResponse } from "../types";
import { invalidarCatalogo } from "../lib/cacheDeCatalogo";
import { AuthContext, type AuthState } from "./AuthContext";

function loadAuthFromStorage(): AuthState | null {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role") ?? "ROLE_USER";
  if (token && userId && email) {
    return { token, userId, email, role };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(loadAuthFromStorage);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    function handleSessionExpired() {
      setSessionExpired(true);
      invalidarCatalogo();
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      setAuth(null);
    }
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  function login(response: AuthResponse) {
    // El catalogo cacheado es de la sesion anterior, y la API devuelve libros
    // distintos segun el rol: hay que descartarlo en los dos sentidos.
    invalidarCatalogo();

    const role = response.role ?? "ROLE_USER";
    const state: AuthState = {
      userId: response.userId,
      email: response.email,
      token: response.accessToken,
      role,
    };
    localStorage.setItem("token", response.accessToken);
    localStorage.setItem("userId", response.userId);
    localStorage.setItem("email", response.email);
    localStorage.setItem("role", role);
    setAuth(state);
  }

  function logout() {
    invalidarCatalogo();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
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
