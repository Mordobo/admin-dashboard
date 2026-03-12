import api from "./api";
import type {
  OnboardingRequest,
  OnboardingCounts,
  OnboardingListParams,
  OnboardingListResponse,
  OnboardingDetail,
  OnboardingDocumentItem,
  OnboardingActivityItem,
} from "@/types";

const BASE = "/api/admin/onboarding";

export async function listOnboardingApplications(
  params?: OnboardingListParams
): Promise<OnboardingListResponse> {
  const { data } = await api.get<OnboardingListResponse>(BASE, { params });
  return {
    data: data?.data ?? data?.requests ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

export async function getOnboardingCounts(): Promise<OnboardingCounts> {
  const { data } = await api.get<OnboardingCounts>(`${BASE}/counts`);
  return data ?? { all: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 };
}

export async function getOnboardingStats(): Promise<{ total: number; count: number }> {
  const { data } = await api.get<{ total: number; count: number }>(`${BASE}/stats`);
  return data ?? { total: 0, count: 0 };
}

export async function getOnboardingDetail(id: string): Promise<OnboardingDetail> {
  const { data } = await api.get<OnboardingDetail>(`${BASE}/${id}`);
  return data;
}

export async function getOnboardingDocuments(
  applicationId: string
): Promise<OnboardingDocumentItem[]> {
  const { data } = await api.get<{ data: OnboardingDocumentItem[] }>(
    `${BASE}/${applicationId}/documents`
  );
  return data?.data ?? [];
}

export async function getOnboardingDocumentUrl(
  applicationId: string,
  docId: string
): Promise<string> {
  const { data } = await api.get<{ url: string }>(
    `${BASE}/${applicationId}/documents/${docId}`
  );
  return data?.url ?? "";
}

export async function getOnboardingActivity(
  applicationId: string
): Promise<OnboardingActivityItem[]> {
  const { data } = await api.get<{ data: OnboardingActivityItem[] }>(
    `${BASE}/${applicationId}/activity`
  );
  return data?.data ?? [];
}

export async function saveOnboardingNotes(
  applicationId: string,
  notes: string
): Promise<void> {
  await api.put(`${BASE}/${applicationId}/notes`, { notes });
}

export async function saveOnboardingChecklist(
  applicationId: string,
  checklist: Record<string, boolean>
): Promise<void> {
  await api.put(`${BASE}/${applicationId}/checklist`, { checklist });
}

export async function approveOnboardingApplication(
  applicationId: string,
  payload?: { notes?: string }
): Promise<{ providerId: string }> {
  const { data } = await api.put<{ message: string; providerId: string }>(
    `${BASE}/${applicationId}/approve`,
    payload ?? {}
  );
  return { providerId: data?.providerId ?? "" };
}

export async function rejectOnboardingApplication(
  applicationId: string,
  payload: { reason: string }
): Promise<void> {
  await api.put(`${BASE}/${applicationId}/reject`, payload);
}
