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

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ code?: string; message?: string }>) => {
    const original = err.config;
    if (!original || original.headers?.Authorization) {
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
