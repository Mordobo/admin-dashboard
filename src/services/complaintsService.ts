import api from "./api";
import type {
  Complaint,
  ComplaintDetail,
  ComplaintCounts,
  ComplaintMessage,
  RelatedJob,
  ComplaintStatus,
  ComplaintPriority,
} from "@/types";

const BASE = "/api/admin/complaints";

export interface ListComplaintsParams {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListComplaintsResponse {
  data: Complaint[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listComplaints(
  params?: ListComplaintsParams
): Promise<ListComplaintsResponse> {
  const { data } = await api.get<ListComplaintsResponse>(BASE, { params });
  return data;
}

export async function getComplaintCounts(): Promise<ComplaintCounts> {
  const { data } = await api.get<ComplaintCounts>(`${BASE}/counts`);
  return data;
}

export async function getComplaintStats(): Promise<{ total: number; count: number }> {
  const { data } = await api.get<{ total: number; count: number }>(`${BASE}/stats`);
  return data;
}

export async function getComplaintDetail(id: string): Promise<ComplaintDetail> {
  const { data } = await api.get<ComplaintDetail>(`${BASE}/${id}`);
  return data;
}

export async function getComplaintMessages(id: string): Promise<ComplaintMessage[]> {
  const { data } = await api.get<{ data: ComplaintMessage[] }>(`${BASE}/${id}/messages`);
  return data.data ?? [];
}

export async function respondToComplaint(
  id: string,
  message: string
): Promise<ComplaintMessage[]> {
  const { data } = await api.post<{ data: ComplaintMessage[] }>(`${BASE}/${id}/respond`, {
    message,
  });
  return data.data ?? [];
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<void> {
  await api.put(`${BASE}/${id}/status`, { status });
}

export async function escalateComplaint(id: string): Promise<void> {
  await api.put(`${BASE}/${id}/escalate`);
}

export async function refundComplaint(
  id: string,
  payload: { amount?: number; reason: string }
): Promise<{ message: string; payment_id: string; refund_amount: number }> {
  const { data } = await api.post<{
    message: string;
    payment_id: string;
    refund_amount: number;
  }>(`${BASE}/${id}/refund`, payload);
  return data;
}

export async function getRelatedJob(
  id: string
): Promise<{ job: RelatedJob | null }> {
  const { data } = await api.get<{ job: RelatedJob | null }>(`${BASE}/${id}/related-job`);
  return data;
}

export async function updateComplaint(
  id: string,
  payload: {
    priority?: ComplaintPriority;
    status?: ComplaintStatus;
    isFlaggedForReview?: boolean;
  }
): Promise<void> {
  await api.patch(`${BASE}/${id}`, payload);
}
