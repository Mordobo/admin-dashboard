import api from "./api";
import type {
  ProviderListItem,
  ProviderDetail,
  ProviderListParams,
} from "@/types";

const BASE = "/api/admin/providers";

export interface ProvidersListResponse {
  providers: ProviderListItem[];
  total: number;
  page: number;
  limit: number;
}

function buildParams(params: ProviderListParams): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  if (params.page != null) out.page = params.page;
  if (params.limit != null) out.limit = params.limit;
  if (params.search != null && params.search !== "") out.search = params.search;
  if (params.status != null && params.status !== "") out.status = params.status;
  const hasSubcategory = params.subcategory != null && params.subcategory !== "";
  // Mutual exclusivity: when subcategory is selected, do not send category.
  if (!hasSubcategory && params.category != null && params.category !== "") out.category = params.category;
  if (hasSubcategory) out.subcategory = params.subcategory;
  if (params.rating != null) out.rating = params.rating;
  return out;
}

export async function fetchProviders(
  params: ProviderListParams
): Promise<ProvidersListResponse> {
  const { data } = await api.get<ProvidersListResponse>(BASE, {
    params: buildParams(params),
  });
  return {
    providers: data?.providers ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
  };
}

export async function fetchProvider(id: string): Promise<ProviderDetail | null> {
  try {
    const { data } = await api.get<{ provider: ProviderDetail }>(`${BASE}/${id}`);
    return data?.provider ?? null;
  } catch {
    return null;
  }
}

export async function updateProviderStatus(
  id: string,
  status: "active" | "suspended" | "banned"
): Promise<void> {
  await api.put(`${BASE}/${id}/status`, { status });
}

export async function deleteProvider(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function toggleProviderVerify(id: string): Promise<void> {
  await api.put(`${BASE}/${id}/verify`);
}

export async function toggleProviderFeature(id: string): Promise<void> {
  await api.put(`${BASE}/${id}/feature`);
}

export async function updateProviderCommission(
  id: string,
  commission_rate: number | null
): Promise<void> {
  await api.put(`${BASE}/${id}/commission`, { commission_rate });
}
