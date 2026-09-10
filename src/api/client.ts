const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function getToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Arma el mensaje que ve la persona a partir del cuerpo de error de la API.
 *
 * Antes esto vivia dentro de un try cuyo propio catch atrapaba el throw, asi que
 * `body.message` no se usaba nunca y todas las pantallas mostraban el JSON
 * crudo. El parseo va aparte del lanzamiento justamente por eso.
 */
async function mensajeDeError(response: Response): Promise<string> {
  const texto = await response.text();
  const respaldo = texto || `Error ${response.status}`;

  let body: unknown;
  try {
    body = JSON.parse(texto);
  } catch {
    return respaldo; // no era JSON: se muestra tal cual vino
  }

  if (typeof body !== "object" || body === null) return respaldo;

  const { message, errors } = body as {
    message?: string;
    errors?: Record<string, string>;
  };

  // La API devuelve el detalle por campo en `errors`. Sin esto el formulario
  // decia "Validacion fallida" y nunca cual era el campo con problemas.
  const porCampo = errors ? Object.values(errors).filter(Boolean) : [];
  if (porCampo.length > 0) return porCampo.join(" ");

  return message || respaldo;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

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
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
