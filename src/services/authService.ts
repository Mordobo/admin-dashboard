import axios from "axios";
import api from "./api";
import type { LoginResponse, LoginRequires2FA, User } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";
import type { Role } from "@/types";

const AUTH_LOGIN = "/auth/login";
const AUTH_ADMIN_LOGIN = "/auth/admin/login";
const AUTH_REFRESH = "/auth/refresh";
const AUTH_2FA_VALIDATE = "/auth/2fa/validate";

/** Si está definido, el login del Backoffice usa esta API (tabla backoffice_admins). */
const AUTH_ADMIN_BASE = (import.meta.env.VITE_AUTH_ADMIN_URL as string | undefined)?.replace(/\/+$/, "");

export type LoginResult = LoginResponse | LoginRequires2FA;

export async function login(email: string, password: string): Promise<LoginResult> {
  // Login de admins: tabla backoffice_admins. Si hay URL dedicada la usamos; si no, misma API base con /auth/admin/login
  if (AUTH_ADMIN_BASE) {
    const { data } = await axios.post<LoginResponse>(`${AUTH_ADMIN_BASE}${AUTH_ADMIN_LOGIN}`, {
      email: email.trim().toLowerCase(),
      password,
    });
    return data;
  }
  const { data } = await api.post<LoginResponse>(`${AUTH_ADMIN_LOGIN}`, {
    email: email.trim().toLowerCase(),
    password,
  });
  return data;
}

export async function validate2FA(twoFaToken: string, code: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(AUTH_2FA_VALIDATE, { twoFaToken, code });
  return data;
}

export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  const { data } = await api.post<{ accessToken: string; refreshToken: string; user: User }>(AUTH_REFRESH, { refreshToken });
  return data;
}

export function persistAuth(accessToken: string, refreshToken: string, user: User, role?: Role): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.ROLE, role || "admin");
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.ROLE);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function getStoredRole(): Role {
  const r = localStorage.getItem(STORAGE_KEYS.ROLE);
  if (r === "super_admin" || r === "admin" || r === "moderator") return r;
  return "admin";
}
