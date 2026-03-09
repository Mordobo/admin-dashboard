export type Role = "super_admin" | "admin" | "moderator";

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
