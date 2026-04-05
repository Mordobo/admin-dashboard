import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchUsers,
  fetchUser,
  updateUserStatus,
  notifyUser,
  resetUserPassword,
  deleteUser,
} from "@/services/usersService";
import type { ClientListItem, ClientDetail, ClientListParams } from "@/types";
import { Badge } from "@/components/Badge";

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function isClientSoftDeleted(u: { status: string; deleted_at?: string | null }): boolean {
  return u.status === "deleted" || (u.deleted_at != null && String(u.deleted_at).length > 0);
}

function userAccountStatusLabel(t: (key: string) => string, status: string): string {
  const key =
    status === "active"
      ? "users.statusActive"
      : status === "suspended"
        ? "users.statusSuspended"
        : status === "banned"
          ? "users.statusBanned"
          : status === "deleted"
            ? "users.statusDeleted"
            : status === "pending"
              ? "users.statusPending"
              : "";
  return key ? t(key) : status;
}

function statusBadgeColor(s: string): "success" | "warning" | "danger" | "info" | "accent" {
  switch (s) {
    case "active":
      return "success";
    case "suspended":
    case "banned":
      return "danger";
    case "deleted":
      return "info";
    case "pending":
      return "warning";
    default:
      return "accent";
  }
}

export function Users() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ClientListParams>({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    sort_order: "desc",
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [notifyModal, setNotifyModal] = useState<{ id: string; name: string } | null>(null);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<{
    id: string;
    name: string;
    step: 1 | 2;
  } | null>(null);
  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState("");

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["users-list", filters],
    queryFn: () => fetchUsers(filters),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["user-detail", detailId],
    queryFn: () => (detailId ? fetchUser(detailId) : Promise.resolve(null)),
    enabled: !!detailId,
  });

  const detail = detailData?.user ?? null;

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "suspended" | "banned";
    }) => updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ["user-detail", detailId] });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: ({ id, subject, message }: { id: string; subject: string; message: string }) =>
      notifyUser(id, { subject, message, send_email: true }),
    onSuccess: () => {
      setNotifyModal(null);
      setNotifySubject("");
      setNotifyMessage("");
      if (detailId) queryClient.invalidateQueries({ queryKey: ["user-detail", detailId] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    onSuccess: () => {
      if (detailId) queryClient.invalidateQueries({ queryKey: ["user-detail", detailId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      setDeleteConfirmStep(null);
      setDeleteTypeConfirm("");
      setDetailId(null);
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
  });

  const users = listData?.users ?? [];
  const total = listData?.total ?? 0;
  const page = listData?.page ?? 1;
  const limit = listData?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleNotifySubmit = useCallback(() => {
    if (!notifyModal) return;
    const subject = notifySubject.trim() || "Notification from Mordobo";
    const message = notifyMessage.trim() || subject;
    notifyMutation.mutate({ id: notifyModal.id, subject, message });
  }, [notifyModal, notifySubject, notifyMessage, notifyMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmStep || deleteConfirmStep.step !== 2) return;
    if (deleteTypeConfirm.trim().toLowerCase() !== "delete") return;
    deleteMutation.mutate(deleteConfirmStep.id);
  }, [deleteConfirmStep, deleteTypeConfirm, deleteMutation]);

  const statusOptions = [
    { value: "", label: t("users.allStatuses") },
    { value: "active", label: t("common.active") },
    { value: "suspended", label: t("users.filterSuspendedOrBanned") },
    { value: "banned", label: t("users.bannedOnly") },
    { value: "deleted", label: t("users.deleted") },
    { value: "pending", label: t("users.pending") },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-mordobo-text">{t("users.title")}</h1>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="search"
            placeholder={t("users.searchPlaceholder")}
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))
            }
            className="min-w-[200px] rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))
            }
            className="rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort_order ?? "desc"}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                sort_order: (e.target.value as "asc" | "desc") || "desc",
                page: 1,
              }))
            }
            className="rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          >
            <option value="desc">{t("users.newestFirst")}</option>
            <option value="asc">{t("users.oldestFirst")}</option>
          </select>
        </div>

        {listLoading ? (
          <p className="text-mordobo-textSecondary py-8">{t("users.loadingUsers")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mordobo-border text-left text-mordobo-textSecondary">
                    <th className="pb-3 pr-4 font-medium">{t("users.id")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("users.name")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("users.email")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("users.phone")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("users.location")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("users.registrationDate")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("common.status")}</th>
                    <th className="pb-3 font-medium">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: ClientListItem) => (
                    <tr
                      key={u.id}
                      className="border-b border-mordobo-border last:border-0 hover:bg-mordobo-surfaceHover/30"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-mordobo-textMuted">
                        {u.id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-4 text-mordobo-text">{u.name || "—"}</td>
                      <td className="py-3 pr-4 text-mordobo-text">{u.email}</td>
                      <td className="py-3 pr-4 text-mordobo-textSecondary">{u.phone ?? "—"}</td>
                      <td className="py-3 pr-4 text-mordobo-textSecondary">{u.location ?? "—"}</td>
                      <td className="py-3 pr-4 text-mordobo-textSecondary">
                        {formatDate(u.registration_date, i18n.language)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={statusBadgeColor(u.status)}>{userAccountStatusLabel(t, u.status)}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(u.id)}
                            className="text-mordobo-accentLight text-xs font-medium hover:underline"
                          >
                            {t("users.view")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({
                                id: u.id,
                                status: u.status === "suspended" ? "active" : "suspended",
                              })
                            }
                            disabled={
                              statusMutation.isPending ||
                              isClientSoftDeleted(u) ||
                              u.status === "banned"
                            }
                            className="text-mordobo-warning text-xs font-medium hover:underline disabled:opacity-50"
                          >
                            {u.status === "suspended" ? t("users.activate") : t("users.suspend")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({
                                id: u.id,
                                status: u.status === "banned" ? "active" : "banned",
                              })
                            }
                            disabled={statusMutation.isPending || isClientSoftDeleted(u)}
                            className="text-mordobo-danger text-xs font-medium hover:underline disabled:opacity-50"
                          >
                            {u.status === "banned" ? t("users.unban") : t("users.ban")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNotifyModal({ id: u.id, name: u.name || u.email })
                            }
                            disabled={isClientSoftDeleted(u)}
                            className="text-mordobo-textSecondary text-xs font-medium hover:underline disabled:opacity-50"
                          >
                            {t("users.notify")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <p className="text-mordobo-textSecondary py-8 text-center">
                {t("users.noMatch")}
              </p>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-mordobo-border">
                <p className="text-sm text-mordobo-textSecondary">
                  {t("users.pageOf", { page, totalPages, total })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    disabled={page <= 1}
                    className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
                  >
                    {t("onboarding.previous")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    disabled={page >= totalPages}
                    className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
                  >
                    {t("onboarding.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailId && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h2 className="text-lg font-semibold text-mordobo-text mb-4">{t("users.userDetail")}</h2>
          {detailLoading ? (
            <p className="text-mordobo-textSecondary">{t("common.loading")}</p>
          ) : detail ? (
            <UserDetailPanel
              detail={detail}
              onClose={() => setDetailId(null)}
              onSuspendToggle={() =>
                detail &&
                statusMutation.mutate({
                  id: detail.profile.id,
                  status: detail.profile.status === "suspended" ? "active" : "suspended",
                })
              }
              onBanToggle={() =>
                detail &&
                statusMutation.mutate({
                  id: detail.profile.id,
                  status: detail.profile.status === "banned" ? "active" : "banned",
                })
              }
              onNotify={() =>
                setNotifyModal({
                  id: detail.profile.id,
                  name: detail.profile.full_name || detail.profile.email || "User",
                })
              }
              onResetPassword={() => resetPasswordMutation.mutate(detail.profile.id)}
              onDelete={() =>
                setDeleteConfirmStep({
                  id: detail.profile.id,
                  name: detail.profile.full_name || detail.profile.email || "User",
                  step: 1,
                })
              }
              statusMutationPending={statusMutation.isPending}
              resetPasswordPending={resetPasswordMutation.isPending}
            />
          ) : (
            <p className="text-mordobo-textSecondary">{t("users.userNotFound")}</p>
          )}
        </div>
      )}

      {notifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !notifyMutation.isPending && setNotifyModal(null)}
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-mordobo-text mb-2">
              {t("users.sendNotificationTo", { name: notifyModal.name })}
            </h3>
            <input
              type="text"
              placeholder={t("users.subject")}
              value={notifySubject}
              onChange={(e) => setNotifySubject(e.target.value)}
              className="w-full rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none mb-3"
            />
            <textarea
              placeholder={t("users.message")}
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setNotifyModal(null)}
                disabled={notifyMutation.isPending}
                className="rounded-xl border border-mordobo-border px-4 py-2 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleNotifySubmit}
                disabled={notifyMutation.isPending}
                className="rounded-xl bg-mordobo-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {notifyMutation.isPending ? t("users.sending") : t("users.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmStep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            if (!deleteMutation.isPending) {
              setDeleteConfirmStep(null);
              setDeleteTypeConfirm("");
            }
          }}
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {deleteConfirmStep.step === 1 ? (
              <>
                <h3 className="text-lg font-semibold text-mordobo-text mb-2">
                  {t("users.deleteAccountConfirm")}
                </h3>
                <p className="text-sm text-mordobo-textSecondary mb-4">
                  {t("users.deleteAccountMessage", { name: deleteConfirmStep.name })}
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmStep(null)}
                    className="rounded-xl border border-mordobo-border px-4 py-2 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirmStep((s) => (s ? { ...s, step: 2 } : null))
                    }
                    className="rounded-xl bg-mordobo-warning text-white px-4 py-2 text-sm font-medium hover:opacity-90"
                  >
                    {t("users.continue")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-mordobo-danger mb-2">{t("users.doubleConfirmation")}</h3>
                <p className="text-sm text-mordobo-textSecondary mb-2">
                  {t("users.typeDeleteToConfirm", { name: deleteConfirmStep.name })}
                </p>
                <input
                  type="text"
                  placeholder={t("users.typeDeletePlaceholder")}
                  value={deleteTypeConfirm}
                  onChange={(e) => setDeleteTypeConfirm(e.target.value)}
                  className="w-full rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmStep((s) => (s ? { ...s, step: 1 } : null));
                      setDeleteTypeConfirm("");
                    }}
                    disabled={deleteMutation.isPending}
                    className="rounded-xl border border-mordobo-border px-4 py-2 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
                  >
                    {t("users.back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={
                      deleteMutation.isPending ||
                      deleteTypeConfirm.trim().toLowerCase() !== "delete"
                    }
                    className="rounded-xl bg-mordobo-danger text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? t("users.deleting") : t("users.deleteAccountButton")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserDetailPanel({
  detail,
  onClose,
  onSuspendToggle,
  onBanToggle,
  onNotify,
  onResetPassword,
  onDelete,
  statusMutationPending,
  resetPasswordPending,
}: {
  detail: ClientDetail;
  onClose: () => void;
  onSuspendToggle: () => void;
  onBanToggle: () => void;
  onNotify: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  statusMutationPending: boolean;
  resetPasswordPending: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { profile, booking_history, reviews_given, payment_methods, addresses, activity_log } =
    detail;
  const name = profile.full_name || profile.email || "—";
  const softDeleted = isClientSoftDeleted(profile);

  return (
    <div className="space-y-6">
      {softDeleted && (
        <p className="text-sm text-mordobo-warning border border-mordobo-warning/40 rounded-xl px-3 py-2 bg-mordobo-warning/10">
          {t("users.accountDeletedHint")}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.profile_image && (
            <img
              src={profile.profile_image}
              alt=""
              className="w-16 h-16 rounded-xl object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-mordobo-text">{name}</h3>
            <p className="text-sm text-mordobo-textSecondary">{profile.email}</p>
            <p className="text-sm text-mordobo-textSecondary">{profile.phone_number ?? "—"}</p>
            <p className="text-sm text-mordobo-textSecondary">
              {profile.country ?? "—"}
              {profile.date_of_birth ? ` · DOB: ${profile.date_of_birth}` : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge color={statusBadgeColor(profile.status)}>{userAccountStatusLabel(t, profile.status)}</Badge>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-mordobo-border px-3 py-1.5 text-sm text-mordobo-textSecondary hover:bg-mordobo-surfaceHover"
        >
          {t("users.close")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSuspendToggle}
          disabled={statusMutationPending || softDeleted || profile.status === "banned"}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {profile.status === "suspended" ? t("users.activate") : t("users.suspend")}
        </button>
        <button
          type="button"
          onClick={onBanToggle}
          disabled={statusMutationPending || softDeleted}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {profile.status === "banned" ? t("users.unban") : t("users.ban")}
        </button>
        <button
          type="button"
          onClick={onNotify}
          disabled={softDeleted}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {t("users.notify")}
        </button>
        <button
          type="button"
          onClick={onResetPassword}
          disabled={resetPasswordPending || softDeleted}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {resetPasswordPending ? t("users.sending") : t("users.resetPassword")}
        </button>
        {!softDeleted && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-mordobo-danger/50 bg-mordobo-danger/10 px-3 py-1.5 text-sm text-mordobo-danger hover:bg-mordobo-danger/20"
          >
            {t("users.deleteAccountButton")}
          </button>
        )}
      </div>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">{t("users.bookingHistory")}</h4>
        {booking_history.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">{t("providers.noJobsYet")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mordobo-border text-left text-mordobo-textSecondary">
                  <th className="pb-2 pr-2 font-medium">{t("transactions.date")}</th>
                  <th className="pb-2 pr-2 font-medium">{t("transactions.service")}</th>
                  <th className="pb-2 pr-2 font-medium">{t("common.status")}</th>
                  <th className="pb-2 font-medium text-right">{t("transactions.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {booking_history.slice(0, 20).map((b) => (
                  <tr key={b.id} className="border-b border-mordobo-border/50">
                    <td className="py-1.5 pr-2 text-mordobo-text">
                      {formatDate(b.activity_at ?? b.scheduled_at ?? b.created_at, i18n.language)}
                    </td>
                    <td className="py-1.5 pr-2 text-mordobo-textSecondary">
                      {b.service_name ?? "—"}
                    </td>
                    <td className="py-1.5 pr-2">{b.order_status}</td>
                    <td className="py-1.5 text-right text-mordobo-text">
                      {b.total_amount != null ? `$${Number(b.total_amount).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">{t("users.reviewsGiven")}</h4>
        {reviews_given.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">{t("providers.noReviewsYet")}</p>
        ) : (
          <ul className="space-y-2">
            {reviews_given.slice(0, 10).map((r) => (
              <li key={r.id} className="text-sm border-b border-mordobo-border/50 pb-2">
                <span className="text-mordobo-text">{r.rating}★</span>{" "}
                <span className="text-mordobo-textSecondary">{r.comment ?? "—"}</span> —{" "}
                <span className="text-mordobo-textMuted">{r.supplier_name ?? "Provider"}</span> ·{" "}
                {formatDate(r.created_at, i18n.language)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">{t("users.paymentMethods")}</h4>
        {payment_methods.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">{t("providers.none")}</p>
        ) : (
          <ul className="text-sm text-mordobo-textSecondary space-y-1">
            {payment_methods.map((p, i) => (
              <li key={i}>{p.payment_method}</li>
            ))}
          </ul>
        )}
      </section>

      {addresses.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-mordobo-text mb-2">{t("users.addresses")}</h4>
          <ul className="text-sm text-mordobo-textSecondary space-y-1">
            {addresses.map((a) => (
              <li key={a.id}>
                {a.name ?? "Address"}: {[a.address_line1, a.city, a.state, a.postal_code, a.country]
                  .filter(Boolean)
                  .join(", ")}
                {a.is_default ? " (default)" : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">{t("users.activityLog")}</h4>
        {activity_log.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">{t("providers.none")}</p>
        ) : (
          <ul className="space-y-2">
            {activity_log.slice(0, 20).map((a) => (
              <li key={a.id} className="text-sm border-b border-mordobo-border/50 pb-2">
                <span className="text-mordobo-text font-medium">{a.action_type}</span>
                {a.admin_name || a.admin_email ? (
                  <span className="text-mordobo-textMuted">
                    {" "}
                    by {a.admin_name || a.admin_email}
                  </span>
                ) : null}{" "}
                · {formatDate(a.created_at, i18n.language)}
                {a.details && Object.keys(a.details).length > 0 && (
                  <span className="text-mordobo-textSecondary">
                    {" "}
                    ({JSON.stringify(a.details)})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
