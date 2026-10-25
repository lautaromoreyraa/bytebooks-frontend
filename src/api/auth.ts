import { api } from "./client";
import type { AuthResponse } from "../types";

export function login(email: string, password: string): Promise<AuthResponse> {
  return api.post("/auth/login", { email, password });
}

/**
 * `desafio` es el token de Turnstile: la API lo pide en el registro, el único
 * formulario abierto que crea algo en la base.
 */
export function register(
  data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  },
  desafio: string | null
): Promise<AuthResponse> {
  return api.post("/auth/register", data, desafio ? { "Cf-Turnstile-Response": desafio } : undefined);
}

export function logout(): Promise<void> {
  return api.post("/auth/logout", {});
}
