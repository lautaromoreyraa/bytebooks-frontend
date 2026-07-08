import { api } from "./client";
import type { AuthResponse } from "../types";

export function login(email: string, password: string): Promise<AuthResponse> {
  return api.post("/auth/login", { email, password });
}

export function register(data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return api.post("/auth/register", data);
}

export function logout(): Promise<void> {
  return api.post("/auth/logout", {});
}
