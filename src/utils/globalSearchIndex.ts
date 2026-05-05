import type { NavItemId } from "@/utils/constants";

export interface GlobalSearchHit {
  path: string;
  navId: NavItemId;
  /** Optional i18n key for a subsection (e.g. settings.auditLog). */
  sectionKey?: string;
  /** Lowercase matching is applied after Unicode normalization. */
  terms: readonly string[];
}

/**
 * Static index for header global search: top-level routes and common sub-sections.
 * Terms include EN + ES keywords so typing works in either language.
 */
export const GLOBAL_SEARCH_HITS: readonly GlobalSearchHit[] = [
  {
    path: "/",
    navId: "dashboard",
    terms: ["dashboard", "home", "inicio", "principal", "resumen", "panel"],
  },
  {
    path: "/onboarding",
    navId: "onboarding",
    terms: ["onboarding", "provider", "proveedor", "proveedores", "alta", "solicitud", "registro", "aplicacion"],
  },
  {
    path: "/complaints",
    navId: "complaints",
    terms: ["complaint", "complaints", "suggestion", "suggestions", "queja", "quejas", "sugerencia", "sugerencias"],
  },
  {
    path: "/users",
    navId: "users",
    terms: ["user", "users", "usuario", "usuarios", "gestion", "management", "cliente", "clientes"],
  },
  {
    path: "/providers",
    navId: "providers",
    terms: ["provider", "providers", "proveedor", "proveedores", "prestador"],
  },
  {
    path: "/services",
    navId: "services",
    terms: ["service", "services", "category", "categories", "categoria", "categorias", "servicio", "servicios", "catalogo", "catalog"],
  },
  {
    path: "/transactions",
    navId: "transactions",
    terms: ["transaction", "transactions", "transaccion", "transacciones", "pago", "pagos", "payment", "payments", "orden", "ordenes"],
  },
  {
    path: "/reports",
    navId: "reports",
    terms: ["report", "reports", "analytics", "informe", "informes", "analisis", "metricas"],
  },
  {
    path: "/content",
    navId: "content",
    terms: ["content", "contenido", "cms", "gestion de contenido"],
  },
  {
    path: "/content?tab=faqs",
    navId: "content",
    sectionKey: "content.faqs",
    terms: ["faq", "faqs", "preguntas", "frecuentes", "ayuda", "help center"],
  },
  {
    path: "/content?tab=legal",
    navId: "content",
    sectionKey: "content.legal",
    terms: ["legal", "document", "documents", "documento", "documentos", "terminos", "privacy", "privacidad"],
  },
  {
    path: "/content?tab=notifications",
    navId: "content",
    sectionKey: "content.notifications",
    terms: ["notification", "notifications", "push", "notificacion", "notificaciones"],
  },
  {
    path: "/content?tab=banners",
    navId: "content",
    sectionKey: "content.banners",
    terms: ["banner", "banners", "promotion", "promotions", "promocion", "promociones"],
  },
  {
    path: "/settings",
    navId: "settings",
    terms: ["settings", "setting", "system", "config", "configuration", "configuracion", "sistema", "ajustes"],
  },
  {
    path: "/settings?tab=users",
    navId: "settings",
    sectionKey: "settings.adminUsers",
    terms: ["admin", "administrator", "administrador", "administradores", "invite", "invitar", "staff"],
  },
  {
    path: "/settings?tab=platform",
    navId: "settings",
    sectionKey: "settings.platformConfig",
    terms: ["platform", "plataforma", "config plataforma", "platform config"],
  },
  {
    path: "/settings?tab=emails",
    navId: "settings",
    sectionKey: "settings.emailTemplates",
    terms: ["email", "emails", "template", "templates", "correo", "plantilla", "plantillas"],
  },
  {
    path: "/settings?tab=audit",
    navId: "settings",
    sectionKey: "settings.auditLog",
    terms: ["audit", "auditoria", "log", "logs", "registro", "actividad", "activity", "historial"],
  },
];

function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function filterGlobalSearchHits(query: string): GlobalSearchHit[] {
  const q = normalizeForMatch(query);
  if (q.length === 0) return [];

  return GLOBAL_SEARCH_HITS.filter((hit) =>
    hit.terms.some((term) => {
      const t = normalizeForMatch(term);
      return t.includes(q) || q.includes(t);
    }),
  );
}
