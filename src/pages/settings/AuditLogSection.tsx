import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAuditLog } from "@/services/settingsService";
import { Badge } from "@/components/Badge";
import type { AuditLogEntry } from "@/types";

const ACTION_BADGE_COLOR: Record<string, "success" | "warning" | "danger" | "info" | "accent"> = {
  user_status_updated: "info",
  user_notification_sent: "accent",
  user_password_reset_triggered: "warning",
  user_deleted: "danger",
  admin_invited: "success",
  backoffice_admin_status_updated: "info",
  backoffice_admin_role_updated: "accent",
  backoffice_admin_deleted: "danger",
};

/** Client account statuses (users module). */
const STATUS_BADGE_COLOR: Record<string, "success" | "warning" | "danger" | "info" | "accent"> = {
  active: "success",
  suspended: "warning",
  banned: "danger",
  blocked: "danger",
  pending: "info",
  deleted: "danger",
};

/** Backoffice admin account statuses (System Settings → Admin Users). */
const BACKOFFICE_ADMIN_STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "info" | "accent"> = {
  active: "success",
  inactive: "danger",
  invited: "info",
};

const BACKOFFICE_ROLE_BADGE: Record<string, "success" | "warning" | "danger" | "info" | "accent"> = {
  super_admin: "danger",
  admin: "info",
  moderator: "accent",
};

function shortId(value: string | null | undefined): string {
  if (!value) return "";
  return value.length > 8 ? `${value.slice(0, 8)}…` : value;
}

function stringifyDetailsJson(details: Record<string, unknown> | null): string {
  if (!details || Object.keys(details).length === 0) {
    return "—";
  }
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

function resourceSystemReference(entry: AuditLogEntry): string | null {
  if (entry.resource_type && entry.resource_id) {
    return `${entry.resource_type}:${entry.resource_id}`;
  }
  return entry.resource_id ?? entry.resource_type ?? null;
}

type AuditModalState =
  | { kind: "resource"; entry: AuditLogEntry }
  | { kind: "details"; entry: AuditLogEntry }
  | null;

export function AuditLogSection() {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState<AuditModalState>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["settings-audit-log"],
    queryFn: () => getAuditLog({ limit: 100 }),
  });

  const entries = data?.entries ?? [];

  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, closeModal]);

  const formatAction = (actionType: string) =>
    t(`settings.audit.actions.${actionType}`, { defaultValue: actionType.replace(/_/g, " ") });

  const formatResourceType = (resourceType: string | null) => {
    if (!resourceType) return null;
    return t(`settings.audit.resourceTypes.${resourceType}`, {
      defaultValue: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
    });
  };

  const renderDetails = (entry: AuditLogEntry, mode: "cell" | "modal") => {
    const details = (entry.details ?? {}) as Record<string, unknown>;
    const actionType = entry.action_type;
    const wrapClass = mode === "cell" ? "max-h-[5rem] overflow-hidden" : "";

    const inner = (() => {
      switch (actionType) {
        case "user_status_updated": {
          const status = String(details.status ?? "");
          const statusLabel = status
            ? t(`settings.audit.statusValues.${status}`, { defaultValue: status })
            : "—";
          const color = STATUS_BADGE_COLOR[status] ?? "info";
          return (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <span className="text-mordobo-textSecondary">
                {t("settings.audit.details.user_status_updated_prefix")}
              </span>
              <Badge color={color}>{statusLabel}</Badge>
            </span>
          );
        }
        case "backoffice_admin_status_updated": {
          const previousStatus = String(details.previous_status ?? "");
          const nextStatus = String(details.status ?? "");
          const prevLabel = previousStatus
            ? t(`settings.adminStatus.${previousStatus}`, { defaultValue: previousStatus })
            : "—";
          const nextLabel = nextStatus
            ? t(`settings.adminStatus.${nextStatus}`, { defaultValue: nextStatus })
            : "—";
          return (
            <span className="inline-flex items-center gap-1.5 flex-wrap text-mordobo-textSecondary">
              <span>{t("settings.audit.details.backoffice_admin_status_prefix")}</span>
              <Badge color={BACKOFFICE_ADMIN_STATUS_BADGE[previousStatus] ?? "info"}>{prevLabel}</Badge>
              <span aria-hidden>{t("settings.audit.details.backoffice_admin_status_arrow")}</span>
              <Badge color={BACKOFFICE_ADMIN_STATUS_BADGE[nextStatus] ?? "info"}>{nextLabel}</Badge>
            </span>
          );
        }
        case "backoffice_admin_role_updated": {
          const previousRole = String(details.previous_role ?? "");
          const nextRole = String(details.role ?? "");
          const prevLabel = previousRole
            ? t(`dashboard.userRole.${previousRole}`, { defaultValue: previousRole })
            : "—";
          const nextLabel = nextRole ? t(`dashboard.userRole.${nextRole}`, { defaultValue: nextRole }) : "—";
          return (
            <span className="inline-flex items-center gap-1.5 flex-wrap text-mordobo-textSecondary">
              <span>{t("settings.audit.details.backoffice_admin_role_prefix")}</span>
              <Badge color={BACKOFFICE_ROLE_BADGE[previousRole] ?? "info"}>{prevLabel}</Badge>
              <span aria-hidden>{t("settings.audit.details.backoffice_admin_role_arrow")}</span>
              <Badge color={BACKOFFICE_ROLE_BADGE[nextRole] ?? "info"}>{nextLabel}</Badge>
            </span>
          );
        }
        case "backoffice_admin_deleted":
          return (
            <span className="text-mordobo-textSecondary">{t("settings.audit.details.backoffice_admin_deleted")}</span>
          );
        case "user_notification_sent": {
          const subject = String(details.subject ?? "");
          return (
            <span className="text-mordobo-textSecondary break-words" title={subject}>
              {t("settings.audit.details.user_notification_sent", { subject })}
            </span>
          );
        }
        case "admin_invited": {
          const email = String(details.invited_email ?? details.email ?? "—");
          return (
            <span className="text-mordobo-textSecondary break-all" title={email}>
              {t("settings.audit.details.admin_invited", { email })}
            </span>
          );
        }
        case "user_password_reset_triggered":
        case "user_deleted":
          return (
            <span className="text-mordobo-textSecondary">
              {t(`settings.audit.details.${actionType}`)}
            </span>
          );
        default:
          break;
      }

      const keys = Object.keys(details);
      if (keys.length === 0) {
        return <span className="text-mordobo-textMuted">{t("settings.audit.noDetails")}</span>;
      }

      return (
        <div className="flex flex-col gap-0.5 text-[12px] text-mordobo-textSecondary">
          {keys.map((key) => (
            <div key={key} className="flex gap-1.5 min-w-0">
              <span className="text-mordobo-textMuted shrink-0">{key}:</span>
              <span className="font-mono text-mordobo-text break-all">
                {typeof details[key] === "object" && details[key] !== null
                  ? JSON.stringify(details[key])
                  : String(details[key])}
              </span>
            </div>
          ))}
        </div>
      );
    })();

    return <div className={wrapClass}>{inner}</div>;
  };

  const renderResource = (entry: AuditLogEntry, mode: "cell" | "modal") => {
    if (!entry.resource_type) {
      return <span className="text-mordobo-textMuted">{t("settings.audit.noResource")}</span>;
    }

    const typeLabel = formatResourceType(entry.resource_type);
    const detailMap = (entry.details ?? {}) as Record<string, unknown>;
    const deletedName =
      typeof detailMap.deleted_full_name === "string" ? detailMap.deleted_full_name.trim() : "";
    const deletedEmail =
      typeof detailMap.deleted_email === "string" ? detailMap.deleted_email.trim() : "";
    const primary =
      entry.resource_label?.trim() ||
      entry.resource_email?.trim() ||
      deletedName ||
      deletedEmail ||
      null;
    const idDisplay =
      mode === "modal"
        ? (entry.resource_id ?? "")
        : entry.resource_id
          ? shortId(entry.resource_id)
          : "";
    const primaryClass =
      mode === "modal"
        ? "text-sm text-mordobo-text break-words"
        : "text-sm text-mordobo-text line-clamp-2 min-w-0";

    return (
      <div className="flex flex-col gap-1 min-w-0">
        <div className={`flex items-start gap-2 min-w-0 ${mode === "cell" ? "flex-wrap sm:flex-nowrap" : ""}`}>
          <Badge color="info">{typeLabel}</Badge>
          <span className={primaryClass} title={mode === "cell" ? (primary ?? undefined) : undefined}>
            {primary ?? <span className="italic text-mordobo-textMuted">{t("settings.audit.deletedResource")}</span>}
          </span>
        </div>
        {entry.resource_id && (
          <div
            className={`text-[11px] text-mordobo-textMuted font-mono ${mode === "modal" ? "break-all whitespace-pre-wrap" : "truncate"}
            `}
            title={mode === "cell" ? `${t("settings.audit.idLabel")}: ${entry.resource_id}` : undefined}
          >
            #{idDisplay}
          </div>
        )}
        {primary && entry.resource_email && entry.resource_label && entry.resource_email !== primary && (
          <div
            className={`text-[12px] break-all ${mode === "modal" ? "text-mordobo-textSecondary" : "text-mordobo-textMuted line-clamp-1"}`}
          >
            {entry.resource_email}
          </div>
        )}
        {deletedName && deletedEmail && deletedEmail !== deletedName && (
          <div
            className={`text-[12px] text-mordobo-textMuted ${mode === "modal" ? "break-all" : "line-clamp-1 break-all"}`}
          >
            {deletedEmail}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        {t("settings.audit.loading")}
      </div>
    );
  }

  const composite = modal?.entry ? resourceSystemReference(modal.entry) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-mordobo-text m-0">{t("settings.audit.title")}</h2>
      <p className="text-sm text-mordobo-textSecondary m-0">{t("settings.audit.subtitle")}</p>
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  {t("settings.audit.colWhen")}
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  {t("settings.audit.colWho")}
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  {t("settings.audit.colAction")}
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider min-w-[200px] max-w-[300px]">
                  {t("settings.audit.colResource")}
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider min-w-[220px] max-w-[340px]">
                  {t("settings.audit.colDetails")}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-mordobo-border last:border-0 align-top">
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString(i18n.language)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-sm text-mordobo-text">{entry.admin_name || entry.admin_email || "—"}</div>
                    {entry.admin_email && entry.admin_name && (
                      <div className="text-[12px] text-mordobo-textMuted">{entry.admin_email}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge color={ACTION_BADGE_COLOR[entry.action_type] ?? "accent"}>
                      {formatAction(entry.action_type)}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 min-w-[200px] max-w-[300px]">
                    <button
                      type="button"
                      className="w-full text-left rounded-[10px] px-1 py-1 min-w-0 border border-transparent hover:border-mordobo-border hover:bg-mordobo-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mordobo-accent/50 transition-colors"
                      onClick={() => setModal({ kind: "resource", entry })}
                      aria-label={t("settings.audit.openResourceAria")}
                    >
                      {renderResource(entry, "cell")}
                      <span className="block text-[11px] text-mordobo-accent/90 mt-1.5 font-medium">
                        {t("settings.audit.clickToViewFull")}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-3 min-w-[220px] max-w-[340px]">
                    <button
                      type="button"
                      className="w-full text-left rounded-[10px] px-1 py-1 min-w-0 border border-transparent hover:border-mordobo-border hover:bg-mordobo-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mordobo-accent/50 transition-colors"
                      onClick={() => setModal({ kind: "details", entry })}
                      aria-label={t("settings.audit.openDetailsAria")}
                    >
                      {renderDetails(entry, "cell")}
                      <span className="block text-[11px] text-mordobo-accent/90 mt-1.5 font-medium">
                        {t("settings.audit.clickToViewFull")}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">{t("settings.audit.empty")}</div>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-modal-title"
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] max-w-2xl w-full max-h-[88vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-mordobo-border flex justify-between items-start gap-3 shrink-0">
              <div className="min-w-0">
                <h3 id="audit-modal-title" className="text-lg font-bold text-mordobo-text m-0 break-words">
                  {modal.kind === "resource"
                    ? t("settings.audit.modalResourceTitle")
                    : t("settings.audit.modalDetailsTitle")}
                </h3>
                <p className="text-xs text-mordobo-textMuted m-0 mt-1">
                  {new Date(modal.entry.created_at).toLocaleString(i18n.language)} ·{" "}
                  <span className="font-medium text-mordobo-textSecondary">{formatAction(modal.entry.action_type)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-mordobo-textSecondary hover:text-mordobo-text text-2xl leading-none shrink-0"
                aria-label={t("settings.audit.closeModal")}
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {modal.kind === "resource" ? (
                <>
                  <div>
                    <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
                      {t("settings.audit.modalSummarySection")}
                    </div>
                    <div className="text-[13px]">{renderResource(modal.entry, "modal")}</div>
                  </div>
                  {composite && (
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
                        {t("settings.audit.modalResourceComposite")}
                      </div>
                      <pre className="text-[12px] font-mono text-mordobo-textSecondary bg-mordobo-surface border border-mordobo-border rounded-xl p-3 whitespace-pre-wrap break-all m-0">
                        {composite}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
                      {t("settings.audit.modalSummarySection")}
                    </div>
                    <div className="text-[13px]">{renderDetails(modal.entry, "modal")}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
                      {t("settings.audit.modalTechnicalJson")}
                    </div>
                    <pre className="text-[12px] font-mono text-mordobo-text bg-mordobo-surface border border-mordobo-border rounded-xl p-3 whitespace-pre-wrap break-all m-0 overflow-x-auto max-h-[320px] overflow-y-auto">
                      {stringifyDetailsJson(modal.entry.details)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
