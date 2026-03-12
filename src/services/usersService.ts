import api from "./api";
import type { ClientListItem, ClientDetail, ClientListParams } from "@/types";

const BASE = "/api/admin/users";

export interface UsersListResponse {
  users: ClientListItem[];
  total: number;
  page: number;
  limit: number;
}

function buildParams(params: ClientListParams): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  if (params.page != null) out.page = params.page;
  if (params.limit != null) out.limit = params.limit;
  if (params.search) out.search = params.search;
  if (params.status) out.status = params.status;
  if (params.sort_order) out.sort_order = params.sort_order;
  return out;
}

export async function fetchUsers(params: ClientListParams): Promise<UsersListResponse> {
  const { data } = await api.get<UsersListResponse>(BASE, {
    params: buildParams(params),
  });
  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
  };
}

export async function fetchUser(id: string): Promise<{ user: ClientDetail } | null> {
  try {
    const { data } = await api.get<{ user: ClientDetail }>(`${BASE}/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function updateUserStatus(
  id: string,
  status: "active" | "suspended" | "banned"
): Promise<void> {
  await api.put(`${BASE}/${id}/status`, { status });
}

export interface NotifyUserPayload {
  subject?: string;
  message?: string;
  send_email?: boolean;
}

export async function notifyUser(id: string, payload: NotifyUserPayload): Promise<void> {
  await api.post(`${BASE}/${id}/notify`, payload);
}

export async function resetUserPassword(id: string): Promise<void> {
  await api.post(`${BASE}/${id}/reset-password`);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
