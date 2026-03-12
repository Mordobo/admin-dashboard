import api from "./api";
import type {
  ReportPeriod,
  ReportsKPIs,
  UserGrowthPoint,
  JobsByCategoryItem,
  RevenuePoint,
  TopProviderRow,
} from "@/types";

const BASE = "/api/admin/reports";

export interface ReportsUsersResponse {
  newUsers: number;
  series: UserGrowthPoint[];
}

export interface ReportsJobsResponse {
  jobsCompleted: number;
  byCategory: JobsByCategoryItem[];
}

export interface ReportsRevenueResponse {
  revenue: number;
  series: RevenuePoint[];
}

export interface ReportsProvidersTopResponse {
  providers: TopProviderRow[];
}

export interface ReportsParams {
  period?: ReportPeriod;
  from?: string;
  to?: string;
  limit?: number;
}

function buildParams(params: ReportsParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (params.period) out.period = params.period;
  if (params.from) out.from = params.from;
  if (params.to) out.to = params.to;
  if (params.limit != null) out.limit = String(params.limit);
  return out;
}

export async function fetchReportsKPIs(params: ReportsParams): Promise<ReportsKPIs> {
  const { data } = await api.get<ReportsKPIs>(`${BASE}/kpis`, { params: buildParams(params) });
  return data;
}

export async function fetchReportsUsers(params: ReportsParams): Promise<ReportsUsersResponse> {
  const { data } = await api.get<ReportsUsersResponse>(`${BASE}/users`, {
    params: buildParams(params),
  });
  return data;
}

export async function fetchReportsJobs(params: ReportsParams): Promise<ReportsJobsResponse> {
  const { data } = await api.get<ReportsJobsResponse>(`${BASE}/jobs`, {
    params: buildParams(params),
  });
  return data;
}

export async function fetchReportsRevenue(params: ReportsParams): Promise<ReportsRevenueResponse> {
  const { data } = await api.get<ReportsRevenueResponse>(`${BASE}/revenue`, {
    params: buildParams(params),
  });
  return data;
}

export async function fetchReportsProvidersTop(
  params: ReportsParams
): Promise<TopProviderRow[]> {
  const { data } = await api.get<ReportsProvidersTopResponse>(`${BASE}/providers/top`, {
    params: buildParams({ ...params, limit: params.limit ?? 10 }),
  });
  return data.providers ?? [];
}

/** Download report as CSV or PDF. Returns blob URL or throws. */
export async function downloadReport(
  format: "csv" | "pdf",
  params: ReportsParams
): Promise<Blob> {
  const response = await api.get(`${BASE}/export`, {
    params: { ...buildParams(params), format },
    responseType: "blob",
  });
  return response.data as Blob;
}
