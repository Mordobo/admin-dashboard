import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "@/services/authService";
import type { AuthState, LoginPasswordChangePayload, Role, User } from "@/types";
import { isBackofficeRole } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";

/** Error cuando el login con la API es correcto pero el usuario no tiene rol de Backoffice. */
export class BackofficeAccessDeniedError extends Error {
  constructor() {
    super("No tienes permisos para acceder al Backoffice.");
    this.name = "BackofficeAccessDeniedError";
  }
}

export type Login2FAPayload = { twoFaToken: string; email: string; user: User };

const AuthContext = createContext<{
  auth: AuthState;
  /** Retorna undefined si el login fue exitoso; si requiere 2FA o cambio de contraseña, el payload correspondiente. */
  login: (email: string, password: string) => Promise<Login2FAPayload | LoginPasswordChangePayload | undefined>;
  completeLoginWith2FA: (twoFaToken: string, code: string) => Promise<void>;
  /** Tras login con contraseña temporal: establece nueva contraseña y persiste la sesión. */
  completePasswordChange: (payload: LoginPasswordChangePayload, newPassword: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  isAuthenticated: boolean;
} | null>(null);

function getInitialState(): AuthState {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const user = authService.getStoredUser();
  const role = authService.getStoredRole();
  return {
    accessToken: token,
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    user: user ?? null,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getInitialState);

  const logout = useCallback(() => {
    authService.clearAuth();
    setAuth({
      accessToken: null,
      refreshToken: null,
      user: null,
      role: "admin",
    });
  }, []);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string): Promise<Login2FAPayload | LoginPasswordChangePayload | undefined> => {
    const res = await authService.login(email, password);
    if ("requires_2fa" in res && res.requires_2fa) {
      return { twoFaToken: res.twoFaToken, email: res.email, user: res.user };
    }
    const apiRole = (res.user as User & { role?: Role }).role;
    const devSuperAdminEmail = import.meta.env.VITE_DEV_SUPER_ADMIN_EMAIL as string | undefined;
    const resolvedRole: Role | undefined =
      isBackofficeRole(apiRole)
        ? apiRole
        : devSuperAdminEmail && res.user.email?.toLowerCase() === devSuperAdminEmail.trim().toLowerCase()
          ? "super_admin"
          : undefined;
    if (!resolvedRole) {
      throw new BackofficeAccessDeniedError();
    }
    if ("requires_password_change" in res && res.requires_password_change === true) {
      return {
        requiresPasswordChange: true,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
        resolvedRole,
        currentPassword: password,
      };
    }
    authService.persistAuth(res.accessToken, res.refreshToken, res.user, resolvedRole);
    setAuth({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      role: resolvedRole,
    });
    return undefined;
  }, []);

  const completePasswordChange = useCallback(async (payload: LoginPasswordChangePayload, newPassword: string) => {
    await authService.changeAdminPassword(payload.accessToken, {
      currentPassword: payload.currentPassword,
      newPassword,
    });
    authService.persistAuth(payload.accessToken, payload.refreshToken, payload.user, payload.resolvedRole);
    setAuth({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user,
      role: payload.resolvedRole,
    });
  }, []);

  const completeLoginWith2FA = useCallback(async (twoFaToken: string, code: string) => {
    const res = await authService.validate2FA(twoFaToken, code);
    const apiRole = (res.user as User & { role?: Role }).role;
    const devSuperAdminEmail = import.meta.env.VITE_DEV_SUPER_ADMIN_EMAIL as string | undefined;
    const resolvedRole: Role | undefined =
      isBackofficeRole(apiRole)
        ? apiRole
        : devSuperAdminEmail && res.user.email?.toLowerCase() === devSuperAdminEmail.trim().toLowerCase()
          ? "super_admin"
          : undefined;
    if (!resolvedRole) {
      throw new BackofficeAccessDeniedError();
    }
    authService.persistAuth(res.accessToken, res.refreshToken, res.user, resolvedRole);
    setAuth({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      role: resolvedRole,
    });
  }, []);

  const setUser = useCallback((user: User | null) => {
    setAuth((prev) => ({ ...prev, user }));
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }, []);

  const setRole = useCallback((role: Role) => {
    setAuth((prev) => ({ ...prev, role }));
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      login,
      completeLoginWith2FA,
      completePasswordChange,
      logout,
      setUser,
      setRole,
      isAuthenticated: !!auth.accessToken && !!auth.user,
    }),
    [auth, login, completeLoginWith2FA, completePasswordChange, logout, setUser, setRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
