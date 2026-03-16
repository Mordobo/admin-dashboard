import api from "./api";
import type {
  FaqCategory,
  FaqQuestion,
  FaqAnswer,
  LegalDocument,
  LegalDocumentVersion,
  LegalDocType,
  SendNotificationRequest,
  NotificationHistoryEntry,
  Banner,
  ContentStatus,
} from "@/types";

const CONTENT_BASE = "/api/admin/content";
const NOTIFICATIONS_BASE = "/api/admin/notifications";

// --- FAQs ---
/** List all FAQ categories with nested questions and answers from the API (DB). */
export async function listFaqs(): Promise<FaqCategory[]> {
  const { data } = await api.get<{ categories?: FaqCategory[]; data?: FaqCategory[] }>(`${CONTENT_BASE}/faqs`);
  const list = data?.categories ?? data?.data;
  if (!Array.isArray(list)) return [];
  return list.map((cat) => ({
    ...cat,
    questions: Array.isArray(cat.questions)
      ? cat.questions.map((q) => ({ ...q, answers: Array.isArray(q.answers) ? q.answers : [] }))
      : [],
  }));
}

export async function createFaqCategory(payload: {
  title_en?: string;
  title_es?: string;
  status?: ContentStatus;
  order?: number;
}): Promise<FaqCategory> {
  const { data } = await api.post<FaqCategory | { category: FaqCategory }>(`${CONTENT_BASE}/faqs`, payload);
  if (data && "category" in data) return data.category;
  return data as FaqCategory;
}

export async function updateFaqCategory(
  id: string,
  payload: Partial<Pick<FaqCategory, "title_en" | "title_es" | "status" | "order">>
): Promise<FaqCategory> {
  const { data } = await api.put<FaqCategory | { category: FaqCategory }>(`${CONTENT_BASE}/faqs/${id}`, payload);
  if (data && "category" in data) return data.category;
  return data as FaqCategory;
}

export async function deleteFaqCategory(id: string): Promise<void> {
  await api.delete(`${CONTENT_BASE}/faqs/${id}`);
}

export async function createFaqQuestion(
  categoryId: string,
  payload: Partial<Pick<FaqQuestion, "question_en" | "question_es" | "status" | "order">>
): Promise<FaqQuestion> {
  const { data } = await api.post<FaqQuestion | { question: FaqQuestion }>(
    `${CONTENT_BASE}/faqs/${categoryId}/questions`,
    payload
  );
  if (data && "question" in data) return data.question;
  return data as FaqQuestion;
}

export async function updateFaqQuestion(
  categoryId: string,
  questionId: string,
  payload: Partial<Pick<FaqQuestion, "question_en" | "question_es" | "status" | "order">>
): Promise<FaqQuestion> {
  const { data } = await api.put<FaqQuestion | { question: FaqQuestion }>(
    `${CONTENT_BASE}/faqs/${categoryId}/questions/${questionId}`,
    payload
  );
  if (data && "question" in data) return data.question;
  return data as FaqQuestion;
}

export async function deleteFaqQuestion(categoryId: string, questionId: string): Promise<void> {
  await api.delete(`${CONTENT_BASE}/faqs/${categoryId}/questions/${questionId}`);
}

export async function createFaqAnswer(
  categoryId: string,
  questionId: string,
  payload: Partial<Pick<FaqAnswer, "answer_en" | "answer_es" | "status" | "order">>
): Promise<FaqAnswer> {
  const { data } = await api.post<FaqAnswer | { answer: FaqAnswer }>(
    `${CONTENT_BASE}/faqs/${categoryId}/questions/${questionId}/answers`,
    payload
  );
  if (data && "answer" in data) return data.answer;
  return data as FaqAnswer;
}

export async function updateFaqAnswer(
  categoryId: string,
  questionId: string,
  answerId: string,
  payload: Partial<Pick<FaqAnswer, "answer_en" | "answer_es" | "status" | "order">>
): Promise<FaqAnswer> {
  const { data } = await api.put<FaqAnswer | { answer: FaqAnswer }>(
    `${CONTENT_BASE}/faqs/${categoryId}/questions/${questionId}/answers/${answerId}`,
    payload
  );
  if (data && "answer" in data) return data.answer;
  return data as FaqAnswer;
}

export async function deleteFaqAnswer(
  categoryId: string,
  questionId: string,
  answerId: string
): Promise<void> {
  await api.delete(
    `${CONTENT_BASE}/faqs/${categoryId}/questions/${questionId}/answers/${answerId}`
  );
}

// --- Legal Documents ---
export async function getLegalDocument(
  docType: LegalDocType,
  lang?: "en" | "es"
): Promise<LegalDocument> {
  const { data } = await api.get<LegalDocument | { document: LegalDocument }>(
    `${CONTENT_BASE}/legal/${docType}`,
    { params: lang ? { lang } : undefined }
  );
  if (data && "document" in data) return data.document;
  return data as LegalDocument;
}

export async function updateLegalDocument(
  docType: LegalDocType,
  payload: Partial<Pick<LegalDocument, "body_html_en" | "body_html_es">>
): Promise<LegalDocument> {
  const { data } = await api.put<LegalDocument | { document: LegalDocument }>(
    `${CONTENT_BASE}/legal/${docType}`,
    payload
  );
  if (data && "document" in data) return data.document;
  return data as LegalDocument;
}

export async function getLegalDocumentVersions(docType: LegalDocType): Promise<LegalDocumentVersion[]> {
  try {
    const { data } = await api.get<{ versions?: LegalDocumentVersion[]; data?: LegalDocumentVersion[] }>(
      `${CONTENT_BASE}/legal/${docType}/versions`
    );
    const list = data?.versions ?? data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// --- Push Notifications ---
export async function sendNotification(payload: SendNotificationRequest): Promise<{ id?: string }> {
  const { data } = await api.post<{ id?: string }>(`${NOTIFICATIONS_BASE}/send`, payload);
  return data ?? {};
}

export async function getNotificationHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: NotificationHistoryEntry[]; total?: number }> {
  try {
    const { data } = await api.get<{
      items?: NotificationHistoryEntry[];
      data?: NotificationHistoryEntry[];
      total?: number;
    }>(`${NOTIFICATIONS_BASE}/history`, { params: params?.limit ? { limit: params.limit, offset: params.offset } : undefined });
    const items = data?.items ?? data?.data ?? [];
    return {
      items: Array.isArray(items) ? items : [],
      total: data?.total,
    };
  } catch {
    return { items: [] };
  }
}

// --- Banners ---
export async function listBanners(): Promise<Banner[]> {
  try {
    const { data } = await api.get<{ banners?: Banner[]; data?: Banner[] }>(`${CONTENT_BASE}/banners`);
    const list = data?.banners ?? data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function createBanner(payload: Partial<Pick<Banner, "title" | "image_url" | "link_url" | "status" | "order" | "start_at" | "end_at">>): Promise<Banner> {
  const { data } = await api.post<Banner | { banner: Banner }>(`${CONTENT_BASE}/banners`, payload);
  if (data && "banner" in data) return data.banner;
  return data as Banner;
}

export async function updateBanner(
  id: string,
  payload: Partial<Pick<Banner, "title" | "image_url" | "link_url" | "status" | "order" | "start_at" | "end_at">>
): Promise<Banner> {
  const { data } = await api.put<Banner | { banner: Banner }>(`${CONTENT_BASE}/banners/${id}`, payload);
  if (data && "banner" in data) return data.banner;
  return data as Banner;
}

export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`${CONTENT_BASE}/banners/${id}`);
}
