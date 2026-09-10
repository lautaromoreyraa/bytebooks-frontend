import { createContext, useContext } from "react";
import type { AuthResponse } from "../types";

export interface AuthState {
  userId: string;
  email: string;
  token: string;
  role: string;
}

export interface AuthContextValue {
  auth: AuthState | null;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

/**
 * El contexto y su hook viven aparte del provider a proposito.
 *
 * Un archivo que exporta un componente y ademas otras cosas rompe el refresco en
 * caliente de Vite —cada guardado remonta el arbol y se pierde el estado— y era
 * el unico error de lint del repo (`react-refresh/only-export-components`).
 * Aca no hay ningun componente; el provider esta en AuthProvider.tsx.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
