import axios, { type AxiosError } from "axios";
import { STORAGE_KEYS } from "@/utils/constants";

/** Default: Mordobo API on Render (QA). Override with VITE_API_BASE_URL in .env for local API. */
const DEFAULT_CLOUD_API_BASE = "https://mordobo-api-qa.onrender.com";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_CLOUD_API_BASE;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
  if (adminSecret && config.url?.includes("/api/admin/")) {
    config.headers["x-admin-secret"] = adminSecret;
  }
  return config;
});

/**
 * Endpoints públicos de auth que NO deben disparar auto-logout aunque devuelvan 401/403
 * (p.ej. credenciales inválidas en login o cuenta inactiva).
 */
const AUTH_PUBLIC_ENDPOINT_PATTERN =
  /\/auth\/(admin\/)?(login|forgot-password|reset-password|validate-email|register)(\/|$|\?)/;

function clearBackofficeSession(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * El backend de Backoffice (requireBackofficeAdmin) responde 403 con
 * `code: "forbidden"` cuando el JWT está ausente, inválido o expirado.
 * También consideramos 401 como sesión expirada para cualquier endpoint protegido.
 */
function isExpiredSessionError(status: number | undefined, code: string | undefined): boolean {
  if (status === 401) return true;
  if (status === 403 && code === "forbidden") return true;
  return false;
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ code?: string; message?: string }>) => {
    const original = err.config;
    const status = err.response?.status;
    const code = err.response?.data?.code;
    const url = original?.url ?? "";
    const hadAuthHeader = !!original?.headers?.Authorization;
    const isPublicAuthEndpoint = AUTH_PUBLIC_ENDPOINT_PATTERN.test(url);

    if (hadAuthHeader && !isPublicAuthEndpoint && isExpiredSessionError(status, code)) {
      clearBackofficeSession();
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(err);
  }
);

export default api;
