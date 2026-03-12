import api from "./api";
import type {
  TransactionListItem,
  TransactionDetail,
  TransactionsSummary,
  TransactionsListParams,
} from "@/types";

const BASE = "/api/admin/transactions";

export interface TransactionsListResponse {
  transactions: TransactionListItem[];
  total: number;
  page: number;
  limit: number;
}

function buildParams(params: TransactionsListParams): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  if (params.start_date) out.start_date = params.start_date;
  if (params.end_date) out.end_date = params.end_date;
  if (params.status) out.status = params.status;
  if (params.min_amount != null) out.min_amount = params.min_amount;
  if (params.max_amount != null) out.max_amount = params.max_amount;
  if (params.user_search) out.user_search = params.user_search;
  if (params.page != null) out.page = params.page;
  if (params.limit != null) out.limit = params.limit;
  if (params.sort_by) out.sort_by = params.sort_by;
  if (params.sort_order) out.sort_order = params.sort_order;
  return out;
}

export async function fetchTransactions(
  params: TransactionsListParams
): Promise<TransactionsListResponse> {
  const { data } = await api.get<TransactionsListResponse>(BASE, {
    params: buildParams(params),
  });
  return {
    transactions: data?.transactions ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
  };
}

export async function fetchTransaction(id: string): Promise<TransactionDetail | null> {
  try {
    const { data } = await api.get<{ transaction: TransactionDetail }>(`${BASE}/${id}`);
    return data?.transaction ?? null;
  } catch {
    return null;
  }
}

export async function fetchTransactionsSummary(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<TransactionsSummary> {
  try {
    const { data } = await api.get<TransactionsSummary>(`${BASE}/summary`, {
      params: params?.start_date ? { start_date: params.start_date, end_date: params.end_date } : undefined,
    });
    return (
      data ?? {
        totalRevenue: 0,
        platformFeesCollected: 0,
        refundsIssued: 0,
        pendingPayouts: 0,
      }
    );
  } catch {
    return {
      totalRevenue: 0,
      platformFeesCollected: 0,
      refundsIssued: 0,
      pendingPayouts: 0,
    };
  }
}

export async function refundTransaction(
  id: string,
  payload: { amount?: number; reason: string }
): Promise<void> {
  await api.post(`${BASE}/${id}/refund`, payload);
}

export async function flagTransactionForReview(
  id: string,
  flag: boolean
): Promise<void> {
  await api.post(`${BASE}/${id}/flag-for-review`, { flag });
}

/** Export transactions as CSV blob (same filters as list). */
export async function exportTransactionsCsv(
  params: TransactionsListParams
): Promise<Blob> {
  const response = await api.get(`${BASE}/export`, {
    params: {
      start_date: params.start_date,
      end_date: params.end_date,
      status: params.status,
      min_amount: params.min_amount,
      max_amount: params.max_amount,
      user_search: params.user_search,
    },
    responseType: "blob",
  });
  return response.data as Blob;
}
