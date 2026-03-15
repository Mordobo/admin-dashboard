import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/Badge";
import {
  listOnboardingApplications,
  getOnboardingCounts,
  getOnboardingDetail,
  getOnboardingDocuments,
  getOnboardingDocumentUrl,
  getOnboardingActivity,
  saveOnboardingNotes,
  saveOnboardingChecklist,
  approveOnboardingApplication,
  rejectOnboardingApplication,
} from "@/services/onboardingService";
import type { OnboardingDocumentItem } from "@/types";

const CHECKLIST_KEYS: string[] = [
  "identity_verified",
  "certifications_valid",
  "background_check_clean",
  "service_area_confirmed",
  "profile_complete",
];
const CHECKLIST_I18N: Record<string, string> = {
  identity_verified: "onboarding.identityVerified",
  certifications_valid: "onboarding.certificationsValid",
  background_check_clean: "onboarding.backgroundCheckClean",
  service_area_confirmed: "onboarding.serviceAreaConfirmed",
  profile_complete: "onboarding.profileComplete",
};

const STATUS_COLORS: Record<string, "warning" | "info" | "success" | "danger"> = {
  pending: "warning",
  in_review: "info",
  approved: "success",
  rejected: "danger",
};

export function Onboarding() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notesDraft, setNotesDraft] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const limit = 20;

  const { data: counts = { all: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 } } = useQuery({
    queryKey: ["onboarding-counts"],
    queryFn: getOnboardingCounts,
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["onboarding-list", filter, search, page],
    queryFn: () =>
      listOnboardingApplications({
        status: filter === "all" ? undefined : filter,
        search: search.trim() || undefined,
        page,
        limit,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["onboarding-detail", id],
    queryFn: () => getOnboardingDetail(id!),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["onboarding-documents", id],
    queryFn: () => getOnboardingDocuments(id!),
    enabled: !!id,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["onboarding-activity", id],
    queryFn: () => getOnboardingActivity(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (detail?.adminNotes !== undefined) setNotesDraft(detail.adminNotes ?? "");
  }, [detail?.adminNotes]);

  const saveNotesMutation = useMutation({
    mutationFn: ({ applicationId, notes }: { applicationId: string; notes: string }) =>
      saveOnboardingNotes(applicationId, notes),
    onSuccess: (_data, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-detail", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-activity", applicationId] });
    },
  });

  const saveChecklistMutation = useMutation({
    mutationFn: ({
      applicationId,
      checklist,
    }: {
      applicationId: string;
      checklist: Record<string, boolean>;
    }) => saveOnboardingChecklist(applicationId, checklist),
    onSuccess: (_data, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-detail", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-activity", applicationId] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ applicationId, notes }: { applicationId: string; notes?: string }) =>
      approveOnboardingApplication(applicationId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-list"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-counts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowApproveModal(false);
      setPendingActionId(null);
      navigate("/onboarding");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      rejectOnboardingApplication(applicationId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-list"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-counts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowRejectModal(false);
      setPendingActionId(null);
      setRejectReason("");
      navigate("/onboarding");
    },
  });

  const handleChecklistChange = useCallback(
    (applicationId: string, key: string, checked: boolean) => {
      if (!detail?.reviewChecklist) return;
      const next = { ...detail.reviewChecklist, [key]: checked };
      saveChecklistMutation.mutate({ applicationId, checklist: next });
    },
    [detail?.reviewChecklist, saveChecklistMutation]
  );

  const handleViewDocument = useCallback(
    async (applicationId: string, doc: OnboardingDocumentItem) => {
      try {
        const url = await getOnboardingDocumentUrl(applicationId, doc.id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        // Storage may not be configured or document missing
      }
    },
    []
  );

  if (id) {
    if (detailLoading || !detail) {
      return (
        <div className="p-6">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="text-mordobo-accentLight text-sm mb-5 cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit"
          >
            {t("onboarding.backToList")}
          </button>
          <div className="text-mordobo-textSecondary text-sm">
            {detailLoading ? t("onboarding.loading") : t("onboarding.applicationNotFound")}
          </div>
        </div>
      );
    }

    const canAct = detail.status === "pending" || detail.status === "in_review";
    const checklist = detail.reviewChecklist ?? {};

    return (
      <div>
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="text-mordobo-accentLight text-sm mb-5 cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit"
        >
          {t("onboarding.backToList")}
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-mordobo-card border border-mordobo-border rounded-[14px] p-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-xl font-bold text-mordobo-text">
                {t("onboarding.application")}: {detail.id}
              </h2>
              <Badge color={STATUS_COLORS[detail.status] ?? "info"}>
                {detail.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-5 mb-7">
              {[
                [t("onboarding.fullName"), detail.name],
                [t("onboarding.serviceCategory"), detail.service],
                [t("onboarding.location"), detail.location],
                [t("onboarding.applicationDate"), detail.date || detail.applicationDate],
              ].map(([label, val]) => (
                <div key={String(label)}>
                  <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                    {label}
                  </div>
                  <div className="text-[15px] font-medium text-mordobo-text">
                    {String(val ?? "—")}
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-3">
                {t("onboarding.submittedDocuments")} ({documents.length})
              </div>
              {documents.length === 0 ? (
                <div className="text-[13px] text-mordobo-textSecondary py-2">
                  {t("onboarding.noDocumentsUploaded")}
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center py-2.5 px-3.5 bg-mordobo-surface rounded-lg mb-2 border border-mordobo-border"
                  >
                    <span className="text-[13px] text-mordobo-text">
                      {doc.documentType}
                      {doc.fileName ? ` — ${doc.fileName}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleViewDocument(id, doc)}
                      className="text-xs text-mordobo-accentLight cursor-pointer hover:underline bg-transparent border-0 font-inherit"
                    >
                      {t("onboarding.view")}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mb-6">
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-3">
                {t("onboarding.adminNotes")}
              </div>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => {
                  if (id && notesDraft !== (detail?.adminNotes ?? "")) {
                    saveNotesMutation.mutate({ applicationId: id, notes: notesDraft });
                  }
                }}
                placeholder={t("onboarding.adminNotesPlaceholder")}
                className="w-full min-h-[100px] bg-mordobo-surface border border-mordobo-border rounded-xl p-3.5 text-mordobo-text text-[13px] resize-y box-border"
              />
            </div>
            {canAct && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPendingActionId(id);
                    setShowApproveModal(true);
                  }}
                  disabled={approveMutation.isPending}
                  className="flex-1 py-3 px-5 bg-mordobo-success text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {t("onboarding.approveApplication")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingActionId(id);
                    setShowRejectModal(true);
                  }}
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-3 px-5 bg-mordobo-danger text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {t("onboarding.rejectApplication")}
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
              <h3 className="m-0 mb-4 text-sm font-semibold text-mordobo-text">
                {t("onboarding.reviewChecklist")}
              </h3>
              {CHECKLIST_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 py-2 text-[13px] text-mordobo-textSecondary cursor-pointer border-b border-mordobo-border last:border-0"
                >
                  <input
                    type="checkbox"
                    className="accent-mordobo-accent"
                    checked={!!checklist[key]}
                    onChange={(e) =>
                      id && handleChecklistChange(id, key, e.target.checked)
                    }
                    disabled={!canAct}
                  />
                  {t(CHECKLIST_I18N[key])}
                </label>
              ))}
            </div>
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
              <h3 className="m-0 mb-4 text-sm font-semibold text-mordobo-text">
                {t("onboarding.activityLog")}
              </h3>
              {activity.length === 0 ? (
                <div className="text-[13px] text-mordobo-textSecondary py-2">
                  {t("onboarding.noActivityRecorded")}
                </div>
              ) : (
                <ul className="list-none p-0 m-0 space-y-2">
                  {activity.map((entry) => (
                    <li
                      key={entry.id}
                      className="text-[13px] text-mordobo-textSecondary border-l-2 border-mordobo-border pl-3 py-1"
                    >
                      <span className="font-medium text-mordobo-text">
                        {entry.eventType.replace(/_/g, " ")}
                      </span>
                      <span className="block text-xs text-mordobo-textMuted">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {showApproveModal && pendingActionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="m-0 mb-3 text-lg font-semibold text-mordobo-text">
                {t("onboarding.approveApplicationConfirm")}
              </h3>
              <p className="text-sm text-mordobo-textSecondary mb-4">
                {t("onboarding.approveApplicationMessage")}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setPendingActionId(null);
                  }}
                  className="py-2 px-4 bg-mordobo-surface text-mordobo-text border border-mordobo-border rounded-lg text-sm cursor-pointer hover:bg-mordobo-surfaceHover"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    approveMutation.mutate({
                      applicationId: pendingActionId,
                      notes: notesDraft.trim() || undefined,
                    })
                  }
                  disabled={approveMutation.isPending}
                  className="py-2 px-4 bg-mordobo-success text-white border-0 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {approveMutation.isPending ? t("onboarding.approving") : t("onboarding.approveButton")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && pendingActionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="m-0 mb-3 text-lg font-semibold text-mordobo-text">
                {t("onboarding.rejectApplicationConfirm")}
              </h3>
              <p className="text-sm text-mordobo-textSecondary mb-2">
                {t("onboarding.rejectReasonPlaceholder")}
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("onboarding.rejectionReasonOptional")}
                className="w-full min-h-[80px] bg-mordobo-surface border border-mordobo-border rounded-lg p-3 text-mordobo-text text-[13px] resize-y mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setPendingActionId(null);
                    setRejectReason("");
                  }}
                  className="py-2 px-4 bg-mordobo-surface text-mordobo-text border border-mordobo-border rounded-lg text-sm cursor-pointer hover:bg-mordobo-surfaceHover"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    rejectMutation.mutate({
                      applicationId: pendingActionId,
                      reason: rejectReason.trim(),
                    })
                  }
                  disabled={rejectMutation.isPending}
                  className="py-2 px-4 bg-mordobo-danger text-white border-0 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {rejectMutation.isPending ? t("onboarding.rejecting") : t("onboarding.rejectButton")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filters = ["all", "pending", "in_review", "approved", "rejected"] as const;
  const list = listData?.data ?? [];
  const pagination = listData?.pagination ?? {
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize font-inherit border ${
                filter === f
                  ? "bg-mordobo-accent text-white border-mordobo-accent"
                  : "bg-mordobo-surface text-mordobo-textSecondary border-mordobo-border"
              }`}
            >
              {f.replace("_", " ")} ({counts[f] ?? 0})
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">
            🔍
          </span>
          <input
            type="search"
            placeholder={t("onboarding.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-3.5 py-2 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] w-60"
          />
        </div>
      </div>
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        {listLoading ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">
            {t("onboarding.loading")}
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">
            {t("onboarding.noApplicationsMatch")}
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-mordobo-border">
                  {[t("onboarding.id"), t("onboarding.applicant"), t("onboarding.serviceCategory"), t("onboarding.location"), t("onboarding.documents"), t("onboarding.date"), t("common.status"), t("onboarding.actions")].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-3.5 px-4 text-left text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {list.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-mordobo-border cursor-pointer hover:bg-mordobo-surface/50"
                    onClick={() => navigate(`/onboarding/${req.id}`)}
                  >
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-accentLight font-medium">
                      {req.id.slice(0, 8)}…
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-text font-medium">
                      {req.name}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                      {req.service}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                      {req.location}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                      {req.documents} {t("onboarding.files")}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                      {req.date ? new Date(req.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge color={STATUS_COLORS[req.status] ?? "info"}>
                        {req.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/onboarding/${req.id}`)}
                        className="py-1.5 px-3 bg-mordobo-accentDim text-mordobo-accentLight border-0 rounded-md text-xs cursor-pointer font-medium"
                      >
                        {t("onboarding.review")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between py-3 px-4 border-t border-mordobo-border text-sm text-mordobo-textSecondary">
                <span>
                  {t("onboarding.pageOf", { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="py-1.5 px-3 rounded-lg border border-mordobo-border bg-mordobo-surface text-mordobo-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("onboarding.previous")}
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="py-1.5 px-3 rounded-lg border border-mordobo-border bg-mordobo-surface text-mordobo-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("onboarding.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
