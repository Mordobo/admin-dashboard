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

export type ComplaintType = "complaint" | "claim" | "suggestion";
export type ComplaintPriority = "critical" | "high" | "medium" | "low";
export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed" | "escalated";

export interface Complaint {
  id: string;
  from: string;
  type: ComplaintType;
  role: string;
  subject: string;
  description?: string;
  priority: ComplaintPriority;
  status: string;
  date: string;
  orderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplaintMessage {
  id: string;
  complaintSuggestionId: string;
  senderType: "client" | "provider" | "admin";
  senderId: string;
  messageText: string;
  createdAt: string;
}

export interface ComplaintDetail extends Complaint {
  submitterType?: string;
  submitterId?: string;
  isFlaggedForReview?: boolean;
  resolvedAt?: string | null;
}

export interface ComplaintCounts {
  all: number;
  complaint: number;
  claim: number;
  suggestion: number;
}

export interface RelatedJob {
  jobId: string;
  providerId: string | null;
  providerName: string | null;
  providerEmail: string | null;
  serviceId: string | null;
  serviceName: string | null;
  amount: number | null;
  jobDate: string | null;
  orderStatus: string | null;
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

// --- Providers Management (Backoffice) ---
export type ProviderStatus = "active" | "suspended" | "pending_verification" | "rejected";

export interface ProviderListItem {
  id: string;
  name: string;
  full_name?: string;
  business_name?: string;
  email: string;
  service_category: string | null;
  service_category_id: string | null;
  location: string | null;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  earnings: number;
  status: string;
  verified: boolean;
  is_featured: boolean;
  commission_rate: number | null;
  profile_image_url?: string;
}

export interface ProviderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  rating?: number;
}

export interface ProviderProfile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  phone_number: string | null;
  service_category: string | null;
  service_category_id: string | null;
  bio: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_image_url?: string;
  gallery: unknown;
  years_experience: number | null;
  hourly_rate: number | null;
  rating: number;
  total_reviews: number;
  verified: boolean;
  status: string;
  availability: string | null;
  response_time_hours: number | null;
  is_featured: boolean;
  commission_rate: number | null;
  coverage_radius_km: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderServiceItem {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
}

export interface ProviderJobHistoryItem {
  id: string;
  order_status: string;
  total_amount: number | null;
  payment_amount: number | null;
  payment_status: string | null;
  service_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  created_at: string;
}

export interface ProviderDocumentItem {
  document_type: string;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
}

export interface ProviderEarningsBreakdown {
  week: number;
  month: number;
  year: number;
}

export interface ProviderDetail {
  profile: ProviderProfile;
  services: ProviderServiceItem[];
  job_history: ProviderJobHistoryItem[];
  reviews: ProviderReviewItem[];
  documents: ProviderDocumentItem[];
  earnings_breakdown: ProviderEarningsBreakdown;
}

// --- Service catalog (admin categories / subcategories) ---
export interface ServiceCatalogSubcategory {
  id: string;
  category_id: string;
  name: string;
  name_en?: string | null;
  name_es?: string | null;
  name_key?: string | null;
  icon?: string | null;
  color?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  active: boolean;
  sort_order: number;
  provider_count?: number;
}

export interface ServiceCatalogCategory {
  id: string;
  name: string;
  name_en?: string | null;
  name_es?: string | null;
  name_key?: string | null;
  icon?: string | null;
  color?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  active: boolean;
  sort_order: number;
  subcategories: ServiceCatalogSubcategory[];
  provider_count?: number;
}

export interface CreateCategoryPayload {
  name_en?: string;
  name_es?: string;
  name_key?: string;
  icon?: string;
  color?: string;
  description_en?: string;
  description_es?: string;
  active?: boolean;
  sort_order?: number;
}

export interface ReorderPayload {
  categoryIds?: string[];
  subcategoryOrders?: Record<string, string[]>;
}

// --- Users Management (Backoffice client accounts) ---
export type ClientAccountStatus = "active" | "suspended" | "banned" | "pending";

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  registration_date: string;
  status: string;
}

export interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_order?: "asc" | "desc";
}

export interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  phone_extension?: string | null;
  country_code?: string | null;
  country: string | null;
  profile_image: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

export interface ClientBookingItem {
  id: string;
  order_status: string;
  total_amount: number | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  service_name: string | null;
}

export interface ClientReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  supplier_name: string | null;
}

export interface ClientPaymentMethodItem {
  payment_method: string;
}

export interface ClientAddressItem {
  id: string;
  name?: string;
  type?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

export interface ClientActivityLogEntry {
  id: string;
  action_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_email: string | null;
  admin_name: string | null;
}

export interface ClientDetail {
  profile: ClientProfile;
  booking_history: ClientBookingItem[];
  reviews_given: ClientReviewItem[];
  payment_methods: ClientPaymentMethodItem[];
  addresses: ClientAddressItem[];
  activity_log: ClientActivityLogEntry[];
}
