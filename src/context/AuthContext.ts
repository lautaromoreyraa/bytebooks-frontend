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

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
