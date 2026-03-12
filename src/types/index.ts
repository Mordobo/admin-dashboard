export type Role = "super_admin" | "admin" | "moderator";

/** Roles que tienen permiso para acceder al Backoffice. Cualquier otro usuario debe ser rechazado. */
export const BACKOFFICE_ROLES: Role[] = ["super_admin", "admin", "moderator"];

export function isBackofficeRole(role: string | undefined): role is Role {
  return role !== undefined && BACKOFFICE_ROLES.includes(role as Role);
}

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

// --- System Settings ---
export type AdminUserStatus = "active" | "inactive" | "invited";

export interface AdminUserSettings {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: AdminUserStatus;
  invited_at?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteAdminRequest {
  email: string;
  role: Role;
  full_name?: string;
}

export interface UpdateAdminRequest {
  role?: Role;
  status?: AdminUserStatus;
}

export interface PlatformConfig {
  service_fee_percentage: number;
  job_amount_min: number;
  job_amount_max: number;
  supported_cities: string[];
  supported_languages: string[];
  maintenance_mode: boolean;
}

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  body_html: string;
  body_plain: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  admin_email?: string;
  admin_name?: string;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// --- Content Management (CMS) ---
export type ContentStatus = "published" | "draft";

export interface FaqAnswer {
  id: string;
  question_id: string;
  answer_en?: string;
  answer_es?: string;
  status?: ContentStatus;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FaqQuestion {
  id: string;
  category_id: string;
  question_en?: string;
  question_es?: string;
  status?: ContentStatus;
  order?: number;
  answers?: FaqAnswer[];
  created_at?: string;
  updated_at?: string;
}

export interface FaqCategory {
  id: string;
  title_en?: string;
  title_es?: string;
  status?: ContentStatus;
  order?: number;
  questions?: FaqQuestion[];
  created_at?: string;
  updated_at?: string;
}

export type LegalDocType = "terms_of_service" | "privacy_policy" | "provider_agreement" | "cookie_policy";

export interface LegalDocument {
  doc_type: LegalDocType;
  body_html_en?: string;
  body_html_es?: string;
  updated_at?: string;
}

export interface LegalDocumentVersion {
  id: string;
  doc_type: LegalDocType;
  created_at: string;
  created_by?: string;
}

export interface SendNotificationRequest {
  title: string;
  body?: string;
  target: "all" | "clients" | "providers" | "user";
  user_id?: string;
}

export interface NotificationHistoryEntry {
  id: string;
  title: string;
  body?: string;
  target: string;
  sent_at: string;
  created_by?: string;
}

export interface Banner {
  id: string;
  title?: string;
  image_url?: string;
  link_url?: string;
  status?: ContentStatus;
  order?: number;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// --- Reports & Analytics ---
export type ReportPeriod = "week" | "month" | "year" | "custom";

export interface ReportsDateRange {
  start: string;
  end: string;
}

export interface ReportsKPIs {
  newUsers: number;
  newProviders: number;
  jobsCompleted: number;
  revenue: number;
  avgRating: number;
}

export interface UserGrowthPoint {
  date: string;
  count: number;
}

export interface JobsByCategoryItem {
  categoryName: string;
  count: number;
}

export interface RevenuePoint {
  date: string;
  total: number;
}

export interface TopProviderRow {
  rank: number;
  providerId: string;
  fullName: string;
  email: string;
  earnings: number;
  orderCount: number;
}

// --- Transactions (Backoffice) ---
export type TransactionStatus = "completed" | "pending" | "refunded" | "failed";

export interface TransactionListItem {
  id: string;
  date: string;
  client_id: string;
  client_name: string | null;
  client_email: string | null;
  provider_id: string;
  provider_name: string | null;
  provider_email: string | null;
  service_id: string | null;
  service_name: string | null;
  amount: number;
  platform_fee: number;
  status: TransactionStatus;
  payment_method?: string;
  refund_amount: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
  flag_for_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionDetail extends TransactionListItem {
  order_id: string;
  job_reference: string;
  payment_breakdown?: { line_items?: Array<{ description: string; amount: number }>; platform_fee?: number; subtotal?: number };
}

export interface TransactionsSummary {
  totalRevenue: number;
  platformFeesCollected: number;
  refundsIssued: number;
  pendingPayouts: number;
}

export interface TransactionsListParams {
  start_date?: string;
  end_date?: string;
  status?: TransactionStatus;
  min_amount?: number;
  max_amount?: number;
  user_search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
