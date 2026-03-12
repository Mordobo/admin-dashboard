export type Role = "super_admin" | "admin" | "moderator";

/** Roles que tienen permiso para acceder al Backoffice. Cualquier otro usuario debe ser rechazado. */
export const BACKOFFICE_ROLES: Role[] = ["super_admin", "admin", "moderator"];

export function isBackofficeRole(role: string | undefined): role is Role {
  return role !== undefined && BACKOFFICE_ROLES.includes(role as Role);
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  profile_image?: string;
  status?: string;
  role?: Role;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Cuando el usuario tiene 2FA activado, el login devuelve esto en lugar de tokens. */
export interface LoginRequires2FA {
  requires_2fa: true;
  twoFaToken: string;
  email: string;
  user: User;
}

export interface OnboardingRequest {
  id: string;
  name: string;
  service: string;
  date: string;
  status: "pending" | "in_review" | "approved" | "rejected";
  documents: number;
  location: string;
}

export interface Complaint {
  id: string;
  from: string;
  type: "complaint" | "claim" | "suggestion";
  role: string;
  subject: string;
  description?: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  date: string;
}

export interface DashboardStats {
  pendingOnboarding: number;
  openComplaints: number;
  activeUsers: number;
  activeProviders: number;
}

// --- System Settings ---
export type AdminUserStatus = "active" | "inactive" | "invited";

export interface AdminUserSettings {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: AdminUserStatus;
  invited_at?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteAdminRequest {
  email: string;
  role: Role;
  full_name?: string;
}

export interface UpdateAdminRequest {
  role?: Role;
  status?: AdminUserStatus;
}

export interface PlatformConfig {
  service_fee_percentage: number;
  job_amount_min: number;
  job_amount_max: number;
  supported_cities: string[];
  supported_languages: string[];
  maintenance_mode: boolean;
}

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  body_html: string;
  body_plain: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  admin_email?: string;
  admin_name?: string;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
