import api from "./api";
import type {
  AdminUserSettings,
  InviteAdminRequest,
  UpdateAdminRequest,
  PlatformConfig,
  EmailTemplate,
  AuditLogEntry,
} from "@/types";

const BASE = "/api/admin/settings";

// --- Admin Users ---
export async function listAdminUsers(): Promise<AdminUserSettings[]> {
  try {
    const { data } = await api.get<{ users?: AdminUserSettings[]; data?: AdminUserSettings[] }>(`${BASE}/users`);
    const list = data?.users ?? data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function inviteAdmin(payload: InviteAdminRequest): Promise<{ user: AdminUserSettings }> {
  const { data } = await api.post<{ user: AdminUserSettings }>(`${BASE}/users`, payload);
  return { user: data.user };
}

export async function updateAdminUser(id: string, payload: UpdateAdminRequest): Promise<{ user: AdminUserSettings }> {
  const { data } = await api.put<{ user: AdminUserSettings }>(`${BASE}/users/${id}`, payload);
  return { user: data.user };
}

export async function deactivateAdminUser(id: string): Promise<{ user: AdminUserSettings }> {
  return updateAdminUser(id, { status: "inactive" });
}

// --- Platform Config ---
const defaultPlatformConfig: PlatformConfig = {
  service_fee_percentage: 10,
  job_amount_min: 5000,
  job_amount_max: 500000,
  supported_cities: ["Bogotá", "Medellín", "Cali"],
  supported_languages: ["es", "en"],
  maintenance_mode: false,
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  try {
    const { data } = await api.get<PlatformConfig | { config: PlatformConfig }>(`${BASE}/platform`);
    if (data && "config" in data) return data.config;
    return (data as PlatformConfig) ?? defaultPlatformConfig;
  } catch {
    return defaultPlatformConfig;
  }
}

export async function updatePlatformConfig(payload: Partial<PlatformConfig>): Promise<PlatformConfig> {
  const { data } = await api.put<PlatformConfig | { config: PlatformConfig }>(`${BASE}/platform`, payload);
  if (data && "config" in data) return data.config;
  return data as PlatformConfig;
}

// --- Email Templates ---
export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const { data } = await api.get<{ templates?: EmailTemplate[]; data?: EmailTemplate[] }>(`${BASE}/email-templates`);
    const list = data?.templates ?? data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function updateEmailTemplate(
  id: string,
  payload: Partial<Pick<EmailTemplate, "subject" | "body_html" | "body_plain">>
): Promise<EmailTemplate> {
  const { data } = await api.put<EmailTemplate | { template: EmailTemplate }>(`${BASE}/email-templates/${id}`, payload);
  if (data && "template" in data) return data.template;
  return data as EmailTemplate;
}

// --- Audit Log ---
export async function getAuditLog(params?: {
  limit?: number;
  offset?: number;
  admin_id?: string;
}): Promise<{ entries: AuditLogEntry[]; total?: number }> {
  try {
    const { data } = await api.get<{ entries?: AuditLogEntry[]; data?: AuditLogEntry[]; total?: number }>(
      `${BASE}/audit-log`,
      { params: params?.limit ? { limit: params.limit, offset: params.offset, admin_id: params.admin_id } : undefined }
    );
    const entries = data?.entries ?? data?.data ?? [];
    return {
      entries: Array.isArray(entries) ? entries : [],
      total: data?.total,
    };
  } catch {
    return { entries: [] };
  }
}
