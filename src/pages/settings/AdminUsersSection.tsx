import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/Badge";
import {
  listAdminUsers,
  inviteAdmin,
  updateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
} from "@/services/settingsService";
import type { AdminUserSettings, Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { adminFormatDateTime } from "@/utils/localeFormat";

const ROLES: Role[] = ["super_admin", "admin", "moderator"];
function getRoleLabelKey(r: Role): string {
  return r === "super_admin" ? "nav.superAdmin" : r === "admin" ? "nav.admin" : "nav.moderator";
}
const STATUS_COLORS: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  inactive: "danger",
};

export function AdminUsersSection() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const { auth } = useAuth();
  const isSuperAdmin = auth.role === "super_admin";
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("admin");
  const [inviteName, setInviteName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("admin");
  const [pendingDelete, setPendingDelete] = useState<AdminUserSettings | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["settings-admin-users"],
    queryFn: listAdminUsers,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
      setInviteOpen(false);
      setInviteEmail("");
      setInvitePassword("");
      setInviteName("");
      setInviteRole("admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: Role; status?: string } }) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
      setEditingId(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
      setPendingDelete(null);
    },
  });

  const currentAdminId = auth.user?.id;
  const currentAdminEmail = auth.user?.email?.trim().toLowerCase();
  const isRowCurrentUser = (row: AdminUserSettings): boolean => {
    if (currentAdminId && row.id === currentAdminId) return true;
    if (currentAdminEmail && row.email.toLowerCase() === currentAdminEmail) return true;
    return false;
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || invitePassword.length < 8) return;
    inviteMutation.mutate({
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      full_name: inviteName.trim() || undefined,
      password: invitePassword,
    });
  };

  const inviteErrorMessage = (() => {
    if (!inviteMutation.isError) return null;
    const err = inviteMutation.error as {
      response?: { data?: { message?: string; issues?: { path: (string | number)[]; message: string }[] } };
    };
    const issues = err?.response?.data?.issues;
    if (issues?.length) {
      return issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    }
    return err?.response?.data?.message ?? (inviteMutation.error as Error)?.message ?? null;
  })();

  const handleSaveRole = (user: AdminUserSettings) => {
    if (editRole === user.role) {
      setEditingId(null);
      return;
    }
    updateMutation.mutate({ id: user.id, payload: { role: editRole } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        {t("settings.loadingAdminUsers")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-mordobo-text m-0">{t("settings.adminUsers")}</h2>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90"
          >
            {t("settings.inviteAdmin")}
          </button>
        )}
      </div>

      {inviteOpen && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">{t("settings.inviteNewAdministrator")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">{t("login.email")} *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">{t("settings.fullName")}</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">{t("settings.role")}</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t(getRoleLabelKey(r))}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("settings.temporaryPassword")} *
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
              <p className="text-[12px] text-mordobo-textSecondary mt-1.5">{t("settings.temporaryPasswordHint")}</p>
            </div>
          </div>
          {inviteMutation.isError && inviteErrorMessage && (
            <p className="text-mordobo-danger text-sm mb-4" role="alert">
              {inviteErrorMessage}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteEmail.trim() || invitePassword.length < 8}
              className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {inviteMutation.isPending ? t("settings.sendingInvitation") : t("settings.sendInvitation")}
            </button>
          </div>
        </div>
      )}

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">{t("settings.user")}</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">{t("settings.role")}</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">{t("common.status")}</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">{t("settings.lastLogin")}</th>
                {isSuperAdmin && (
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">{t("common.actions")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-mordobo-border last:border-0">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-mordobo-text">{user.full_name || user.email}</div>
                    <div className="text-[13px] text-mordobo-textSecondary">{user.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                          className="py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-sm"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{t(getRoleLabelKey(r))}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(user)}
                          disabled={updateMutation.isPending}
                          className="text-mordobo-accentLight text-sm hover:underline"
                        >
                          {t("common.save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-mordobo-textMuted text-sm hover:underline"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-mordobo-text">{t(getRoleLabelKey(user.role))}</span>
                        {isSuperAdmin && user.status === "active" && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(user.id);
                              setEditRole(user.role);
                            }}
                            className="ml-2 text-mordobo-accentLight text-xs hover:underline"
                          >
                            {t("common.edit")}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge color={STATUS_COLORS[user.status] ?? "info"}>
                        {t(`settings.adminStatus.${user.status}`, { defaultValue: user.status })}
                      </Badge>
                      {user.must_change_password ? (
                        <span className="text-[11px] text-mordobo-textSecondary">{t("settings.mustChangePasswordBadge")}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                    {user.last_login_at ? adminFormatDateTime(locale, user.last_login_at) : "—"}
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-2">
                        {user.status === "active" && (
                          <button
                            type="button"
                            onClick={() => deactivateMutation.mutate(user.id)}
                            disabled={deactivateMutation.isPending}
                            className="text-mordobo-danger text-sm hover:underline disabled:opacity-50"
                          >
                            {t("settings.deactivate")}
                          </button>
                        )}
                        {!isRowCurrentUser(user) ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(user)}
                            disabled={deleteMutation.isPending}
                            className="text-mordobo-danger text-sm font-semibold hover:underline disabled:opacity-50"
                          >
                            {t("settings.deleteAdmin")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">{t("settings.noAdminUsersYet")}</div>
        )}
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-admin-title"
          onClick={() => {
            if (!deleteMutation.isPending) {
              setPendingDelete(null);
              deleteMutation.reset();
            }
          }}
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-admin-title" className="text-lg font-semibold text-mordobo-text mb-2">
              {t("settings.deleteAdminTitle")}
            </h3>
            <p className="text-sm text-mordobo-textSecondary mb-6">
              {t("settings.deleteAdminMessage", {
                email: pendingDelete.email,
                name: pendingDelete.full_name || pendingDelete.email,
              })}
            </p>
            {deleteMutation.isError && (
              <p className="text-sm text-mordobo-danger mb-4" role="alert">
                {(deleteMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                  (deleteMutation.error as Error)?.message ??
                  t("settings.deleteAdminFailed")}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  deleteMutation.reset();
                }}
                disabled={deleteMutation.isPending}
                className="py-2.5 px-4 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text hover:bg-mordobo-surfaceHover"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
                className="py-2.5 px-4 bg-mordobo-danger text-white border-0 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? t("settings.deletingAdmin") : t("settings.deleteAdminConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
