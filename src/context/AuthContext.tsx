import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResponse } from "../types";

interface AuthState {
  userId: string;
  email: string;
  token: string;
  role: string;
}

interface AuthContextValue {
  auth: AuthState | null;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
