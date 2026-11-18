import { sesionActual } from "./sesion";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function mensajeDeError(response: Response): Promise<string> {
  const texto = await response.text();
  const respaldo = texto || `Error ${response.status}`;

  let body: unknown;
  try {
    body = JSON.parse(texto);
  } catch {
    return respaldo;
  }

  if (typeof body !== "object" || body === null) return respaldo;

  const { message, errors } = body as {
    message?: string;
    errors?: Record<string, string>;
  };

  const porCampo = errors ? Object.values(errors).filter(Boolean) : [];
  if (porCampo.length > 0) return porCampo.join(" ");

  return message || respaldo;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sesionActual()?.token ?? null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("session-expired"));
    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    throw new Error(await mensajeDeError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), headers }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
