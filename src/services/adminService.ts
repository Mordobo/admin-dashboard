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

/** List onboarding requests (uses GET /api/admin/onboarding). Supports limit for dashboard recent list. */
export async function listOnboardingRequests(params?: { status?: string; limit?: number }): Promise<OnboardingRequest[]> {
  try {
    const query: { status?: string; limit?: number } = {};
    if (params?.status && params.status !== "all") query.status = params.status;
    if (params?.limit != null) query.limit = Math.min(100, Math.max(1, params.limit));
    const res = await api.get<{ requests?: OnboardingRequest[]; data?: OnboardingRequest[] }>("/api/admin/onboarding", {
      params: Object.keys(query).length ? query : undefined,
    });
    const list = res.data?.requests ?? res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Dashboard KPIs from GET /api/admin/dashboard/stats. Falls back to zeros if the endpoint is unavailable. */
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
    const { data } = await api.get<{
      pendingOnboarding: number;
      openComplaints: number;
      activeUsers: number;
      activeProviders: number;
      pendingOnboardingChange?: number;
      openComplaintsChange?: number;
      activeUsersChange?: number;
      activeProvidersChange?: number;
    }>("/api/admin/dashboard/stats");
    return {
      pendingOnboarding: data?.pendingOnboarding ?? 0,
      openComplaints: data?.openComplaints ?? 0,
      activeUsers: data?.activeUsers ?? 0,
      activeProviders: data?.activeProviders ?? 0,
      pendingOnboardingChange: data?.pendingOnboardingChange,
      openComplaintsChange: data?.openComplaintsChange,
      activeUsersChange: data?.activeUsersChange,
      activeProvidersChange: data?.activeProvidersChange,
    };
  } catch {
    return { pendingOnboarding: 0, openComplaints: 0, activeUsers: 0, activeProviders: 0 };
  }
}

/** List complaints/suggestions. Use limit for dashboard recent list (e.g. limit: 5). */
export async function listComplaints(params?: { type?: string; limit?: number }): Promise<Complaint[]> {
  try {
    const query: { type?: string; limit?: number } = {};
    if (params?.type && params.type !== "all") query.type = params.type;
    query.limit = params?.limit != null ? Math.min(100, Math.max(1, params.limit)) : 500;
    const res = await api.get<{ data?: Complaint[] }>("/api/admin/complaints", { params: query });
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
