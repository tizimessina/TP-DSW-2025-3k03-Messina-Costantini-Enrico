import axios, { isAxiosError } from "axios";

export const TOKEN_KEY = "auth:token";
export const USER_KEY = "auth:user";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

// Adjunta el JWT guardado a cada request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el backend responde 401 con un token guardado, la sesión venció: avisamos al AuthProvider.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Formato de error del backend: `{ code, message, details }`. */
export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: { path: string; message: string }[];
};

export function getApiErrorMessage(e: unknown, fallback = "Ocurrió un error"): string {
  if (isAxiosError<ApiErrorBody>(e)) {
    const body = e.response?.data;
    if (body?.details?.length) {
      return body.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join(". ");
    }
    if (body?.message) return body.message;
    if (!e.response) return "No se pudo conectar con el servidor";
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
