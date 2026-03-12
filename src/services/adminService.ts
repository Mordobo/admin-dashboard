import api from "./api";
import type { OnboardingRequest, Complaint } from "@/types";

const BASE = "/api/admin";

export interface ProviderApproval {
  id: string;
  full_name: string;
  email: string;
  verified?: boolean;
  status: string;
}

export async function approveProvider(id: string): Promise<{ provider: ProviderApproval }> {
  const { data } = await api.put<{ message: string; provider: ProviderApproval }>(`${BASE}/providers/${id}/approve`);
  return { provider: data.provider };
}

export async function rejectProvider(id: string): Promise<{ provider: ProviderApproval }> {
  const { data } = await api.put<{ message: string; provider: ProviderApproval }>(`${BASE}/providers/${id}/reject`);
  return { provider: data.provider };
}

/** List onboarding requests (uses GET /api/admin/onboarding). For full pagination/counts use onboardingService. */
export async function listOnboardingRequests(params?: { status?: string }): Promise<OnboardingRequest[]> {
  try {
    const res = await api.get<{ requests?: OnboardingRequest[]; data?: OnboardingRequest[] }>("/api/admin/onboarding", {
      params: params?.status && params.status !== "all" ? { status: params.status } : undefined,
    });
    const list = res.data?.requests ?? res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Estadísticas del dashboard. Valores en 0 si el backend no expone estos endpoints. */
export async function fetchDashboardStats(): Promise<{
  pendingOnboarding: number;
  openComplaints: number;
  activeUsers: number;
  activeProviders: number;
  pendingOnboardingChange?: number;
  openComplaintsChange?: number;
  activeUsersChange?: number;
  activeProvidersChange?: number;
}> {
  try {
    const [onb, complaints, users, providers] = await Promise.allSettled([
      api.get<{ total?: number; count?: number; change?: number } | number>("/api/admin/onboarding/stats").then((r) => r.data),
      api.get<{ total?: number; change?: number } | number>("/api/admin/complaints/stats").then((r) => r.data),
      api.get<{ count?: number; change?: number } | number>("/api/admin/users/count").then((r) => r.data),
      api.get<{ count?: number; change?: number } | number>("/api/admin/providers/count").then((r) => r.data),
    ]);
    const num = (v: unknown): number => {
      if (v == null) return 0;
      if (typeof v === "number") return v;
      if (typeof v === "object") {
        const o = v as Record<string, unknown>;
        if (typeof o.total === "number") return o.total;
        if (typeof o.count === "number") return o.count;
      }
      return 0;
    };
    const change = (v: unknown): number | undefined =>
      v != null && typeof v === "object" && "change" in v ? (v as { change?: number }).change : undefined;
    return {
      pendingOnboarding: onb.status === "fulfilled" ? num(onb.value) : 0,
      openComplaints: complaints.status === "fulfilled" ? num(complaints.value) : 0,
      activeUsers: users.status === "fulfilled" ? num(users.value) : 0,
      activeProviders: providers.status === "fulfilled" ? num(providers.value) : 0,
      pendingOnboardingChange: onb.status === "fulfilled" ? change(onb.value) : undefined,
      openComplaintsChange: complaints.status === "fulfilled" ? change(complaints.value) : undefined,
      activeUsersChange: users.status === "fulfilled" ? change(users.value) : undefined,
      activeProvidersChange: providers.status === "fulfilled" ? change(providers.value) : undefined,
    };
  } catch {
    return { pendingOnboarding: 0, openComplaints: 0, activeUsers: 0, activeProviders: 0 };
  }
}

/** List complaints/suggestions (legacy: returns array only). For full pagination use complaintsService.listComplaints. */
export async function listComplaints(params?: { type?: string }): Promise<Complaint[]> {
  try {
    const res = await api.get<{ data?: Complaint[] }>("/api/admin/complaints", {
      params: params?.type && params.type !== "all" ? { type: params.type } : { limit: 500 },
    });
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
