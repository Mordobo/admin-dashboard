import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import {
  listComplaints,
  getComplaintCounts,
  getComplaintDetail,
  getComplaintMessages,
  getRelatedJob,
  respondToComplaint,
  updateComplaintStatus,
  escalateComplaint,
  refundComplaint,
  updateComplaint,
} from "@/services/complaintsService";
import type { Complaint, ComplaintDetail, ComplaintMessage, ComplaintStatus } from "@/types";

const STATUS_OPTIONS: ComplaintStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
  "escalated",
];

function formatDate(val: string | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(val);
  }
}

export function Complaints() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const [responseText, setResponseText] = useState("");
  const [statusDropdown, setStatusDropdown] = useState<string>("");
  const [refundModal, setRefundModal] = useState<{ id: string; orderId: string | null } | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>("");

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["admin-complaints-counts"],
    queryFn: getComplaintCounts,
  });

  const { data: listResult, isLoading: listLoading } = useQuery({
    queryKey: ["admin-complaints", typeFilter, searchSubmitted, page],
    queryFn: () =>
      listComplaints({
        type: typeFilter === "all" ? undefined : typeFilter,
        search: searchSubmitted || undefined,
        page,
        limit: 20,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-complaint-detail", selectedId],
    queryFn: () => getComplaintDetail(selectedId!),
    enabled: !!selectedId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["admin-complaint-messages", selectedId],
    queryFn: () => getComplaintMessages(selectedId!),
    enabled: !!selectedId,
  });

  const { data: relatedJob } = useQuery({
    queryKey: ["admin-complaint-related-job", selectedId],
    queryFn: () => getRelatedJob(selectedId!),
    enabled: !!selectedId,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      respondToComplaint(id, message),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-complaint-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail", id] });
      setResponseText("");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ComplaintStatus }) =>
      updateComplaintStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints-counts"] });
      setStatusDropdown("");
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => escalateComplaint(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints-counts"] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      amount,
    }: {
      id: string;
      reason: string;
      amount?: number;
    }) => refundComplaint(id, { reason, amount }),
    onSuccess: () => {
      setRefundModal(null);
      setRefundReason("");
      setRefundAmount("");
      if (selectedId) {
        queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail", selectedId] });
        queryClient.invalidateQueries({ queryKey: ["admin-complaint-related-job", selectedId] });
      }
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, flag }: { id: string; flag: boolean }) =>
      updateComplaint(id, { isFlaggedForReview: flag }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail", id] });
    },
  });

  const list = listResult?.data ?? [];
  const pagination = listResult?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  const handleSearch = () => setSearchSubmitted(search);
  const handleStatusChange = (id: string, newStatus: string) => {
    if (!newStatus) return;
    statusMutation.mutate({ id, status: newStatus as ComplaintStatus });
  };

  if (selectedId && (detail || detailLoading)) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-mordobo-accentLight text-sm mb-5 cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit"
        >
          ← Back to list
        </button>
        {detailLoading ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">
            Loading…
          </div>
        ) : detail ? (
          <DetailView
            detail={detail}
            messages={messages}
            messagesLoading={messagesLoading}
            relatedJob={relatedJob?.job ?? null}
            responseText={responseText}
            setResponseText={setResponseText}
            statusDropdown={statusDropdown}
            setStatusDropdown={setStatusDropdown}
            onSendResponse={() => {
              if (responseText.trim()) {
                respondMutation.mutate({ id: selectedId!, message: responseText.trim() });
              }
            }}
            onStatusChange={(status) => handleStatusChange(selectedId!, status)}
            onMarkResolved={() => handleStatusChange(selectedId!, "resolved")}
            onEscalate={() => {
              if (window.confirm("Escalate this ticket?")) {
                escalateMutation.mutate(selectedId!);
              }
            }}
            onRefund={() => setRefundModal({ id: selectedId!, orderId: detail.orderId ?? null })}
            onFlagForReview={() =>
              flagMutation.mutate({
                id: selectedId!,
                flag: !detail.isFlaggedForReview,
              })
            }
            respondSending={respondMutation.isPending}
            statusUpdating={statusMutation.isPending}
          />
        ) : null}

        {refundModal && (
          <RefundModal
            complaintId={refundModal.id}
            hasOrder={!!refundModal.orderId}
            reason={refundReason}
            setReason={setRefundReason}
            amount={refundAmount}
            setAmount={setRefundAmount}
            onClose={() => {
              setRefundModal(null);
              setRefundReason("");
              setRefundAmount("");
            }}
            onConfirm={() => {
              if (!refundReason.trim()) return;
              const amount =
                refundAmount.trim() && !Number.isNaN(Number(refundAmount))
                  ? Number(refundAmount)
                  : undefined;
              refundMutation.mutate({
                id: refundModal.id,
                reason: refundReason.trim(),
                amount,
              });
            }}
            loading={refundMutation.isPending}
          />
        )}
      </div>
    );
  }

  const countAll = counts?.all ?? 0;
  const countComplaint = counts?.complaint ?? 0;
  const countClaim = counts?.claim ?? 0;
  const countSuggestion = counts?.suggestion ?? 0;
  const typeFilters = [
    { key: "all", label: "All", count: countAll },
    { key: "complaint", label: "Complaint", count: countComplaint },
    { key: "claim", label: "Claim", count: countClaim },
    { key: "suggestion", label: "Suggestion", count: countSuggestion },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTypeFilter(key);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize font-inherit border ${
                typeFilter === key
                  ? "bg-mordobo-accent text-white border-mordobo-accent"
                  : "bg-mordobo-surface text-mordobo-textSecondary border-mordobo-border"
              }`}
            >
              {label} ({countsLoading ? "…" : count})
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="search"
            placeholder="Search by ID, subject, or user name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="py-2 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] w-60"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="py-2 px-4 bg-mordobo-accent text-white border-0 rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        {listLoading ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">
            Loading…
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">
            No complaints or suggestions match your filters.
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-mordobo-border">
                  {["ID", "Type", "From", "Subject", "Priority", "Status", "Date", "Actions"].map(
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
                {list.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-mordobo-border cursor-pointer hover:bg-mordobo-surface/50"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-accentLight font-medium">
                      {c.id.slice(0, 8)}…
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        color={
                          c.type === "complaint"
                            ? "danger"
                            : c.type === "claim"
                              ? "warning"
                              : "info"
                        }
                      >
                        {c.type}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[13px] text-mordobo-text font-medium">{c.from}</div>
                      <div className="text-[11px] text-mordobo-textMuted">{c.role}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary max-w-[250px] truncate">
                      {c.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        color={
                          c.priority === "critical"
                            ? "danger"
                            : c.priority === "high"
                              ? "warning"
                              : c.priority === "medium"
                                ? "info"
                                : "accent"
                        }
                      >
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        color={
                          c.status === "open"
                            ? "warning"
                            : c.status === "in_progress"
                              ? "info"
                              : c.status === "escalated"
                                ? "danger"
                                : "success"
                        }
                      >
                        {c.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                      {formatDate(c.date ?? c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className="py-1.5 px-3 bg-mordobo-accentDim text-mordobo-accentLight border-0 rounded-md text-xs cursor-pointer font-medium"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center py-3 px-4 border-t border-mordobo-border text-sm text-mordobo-textSecondary">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="py-1.5 px-3 rounded border border-mordobo-border bg-mordobo-surface disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="py-1.5 px-3 rounded border border-mordobo-border bg-mordobo-surface disabled:opacity-50 cursor-pointer"
                  >
                    Next
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

function DetailView({
  detail,
  messages,
  messagesLoading,
  relatedJob,
  responseText,
  setResponseText,
  statusDropdown,
  setStatusDropdown,
  onSendResponse,
  onStatusChange,
  onMarkResolved,
  onEscalate,
  onRefund,
  onFlagForReview,
  respondSending,
  statusUpdating,
}: {
  detail: ComplaintDetail;
  messages: ComplaintMessage[];
  messagesLoading: boolean;
  relatedJob: {
    jobId: string;
    providerName: string | null;
    providerEmail: string | null;
    serviceName: string | null;
    amount: number | null;
    jobDate: string | null;
    orderStatus: string | null;
  } | null;
  responseText: string;
  setResponseText: (s: string) => void;
  statusDropdown: string;
  setStatusDropdown: (s: string) => void;
  onSendResponse: () => void;
  onStatusChange: (status: string) => void;
  onMarkResolved: () => void;
  onEscalate: () => void;
  onRefund: () => void;
  onFlagForReview: () => void;
  respondSending: boolean;
  statusUpdating: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 bg-mordobo-card border border-mordobo-border rounded-[14px] p-7">
        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-xl font-bold text-mordobo-text">
            {detail.id.slice(0, 8)}…: {detail.subject}
          </h2>
          <div className="flex gap-2">
            <Badge
              color={
                detail.type === "complaint"
                  ? "danger"
                  : detail.type === "claim"
                    ? "warning"
                    : "info"
              }
            >
              {detail.type}
            </Badge>
            <Badge
              color={
                detail.priority === "critical"
                  ? "danger"
                  : detail.priority === "high"
                    ? "warning"
                    : detail.priority === "medium"
                      ? "info"
                      : "accent"
              }
            >
              {detail.priority}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            ["Submitted By", `${detail.from} (${detail.role})`],
            ["Date", formatDate(detail.date ?? detail.createdAt)],
            ["Status", detail.status.replace("_", " ")],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {label}
              </div>
              <div className="text-sm font-medium text-mordobo-text capitalize">{String(val)}</div>
            </div>
          ))}
        </div>
        <div className="mb-6">
          <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2.5">
            Description
          </div>
          <div className="bg-mordobo-surface border border-mordobo-border rounded-xl p-4 text-sm text-mordobo-textSecondary leading-relaxed">
            {detail.description ?? "No description."}
          </div>
        </div>
        <div className="mb-6">
          <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2.5">
            Conversation Thread
          </div>
          {messagesLoading ? (
            <div className="text-[13px] text-mordobo-textSecondary py-2">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-[13px] text-mordobo-textSecondary py-2">
              No messages yet.
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg text-[13px] ${
                    m.senderType === "admin"
                      ? "bg-mordobo-accentDim border border-mordobo-accent/25 text-mordobo-text"
                      : "bg-mordobo-surface border border-mordobo-border text-mordobo-textSecondary"
                  }`}
                >
                  <div className="text-[11px] text-mordobo-textMuted mb-1 capitalize">
                    {m.senderType} · {formatDate(m.createdAt)}
                  </div>
                  <div className="whitespace-pre-wrap">{m.messageText}</div>
                </div>
              ))}
            </div>
          )}
          <textarea
            placeholder="Write a response…"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="w-full min-h-[80px] mt-2 bg-mordobo-surface border border-mordobo-border rounded-xl p-3.5 text-mordobo-text text-[13px] resize-y box-border"
          />
          <button
            type="button"
            onClick={onSendResponse}
            disabled={!responseText.trim() || respondSending}
            className="mt-2 py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {respondSending ? "Sending…" : "Send Response"}
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={statusDropdown}
            onChange={(e) => {
              const v = e.target.value;
              setStatusDropdown(v);
              if (v) onStatusChange(v);
            }}
            disabled={statusUpdating}
            className="flex-1 min-w-[140px] py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px]"
          >
            <option value="">Change status…</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onMarkResolved}
            disabled={statusUpdating}
            className="py-2.5 px-5 bg-mordobo-successDim text-mordobo-success border border-mordobo-success/30 rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            Mark Resolved
          </button>
          <button
            type="button"
            onClick={onEscalate}
            disabled={statusUpdating}
            className="py-2.5 px-5 bg-mordobo-dangerDim text-mordobo-danger border border-mordobo-danger/30 rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            Escalate
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="m-0 mb-4 text-sm font-semibold text-mordobo-text">
            Related Information
          </h3>
          {relatedJob ? (
            <ul className="text-xs text-mordobo-textSecondary space-y-2 list-none p-0 m-0">
              <li>
                <strong className="text-mordobo-text">Job ID:</strong> {relatedJob.jobId?.slice(0, 8)}…
              </li>
              <li>
                <strong className="text-mordobo-text">Provider:</strong>{" "}
                {relatedJob.providerName ?? "—"}
              </li>
              <li>
                <strong className="text-mordobo-text">Service:</strong>{" "}
                {relatedJob.serviceName ?? "—"}
              </li>
              <li>
                <strong className="text-mordobo-text">Amount:</strong>{" "}
                {relatedJob.amount != null ? `$${Number(relatedJob.amount).toFixed(2)}` : "—"}
              </li>
              <li>
                <strong className="text-mordobo-text">Job date:</strong>{" "}
                {relatedJob.jobDate ? formatDate(relatedJob.jobDate) : "—"}
              </li>
            </ul>
          ) : (
            <p className="text-xs text-mordobo-textSecondary m-0">
              No related job for this ticket.
            </p>
          )}
        </div>
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="m-0 mb-4 text-sm font-semibold text-mordobo-text">Quick Actions</h3>
          <button
            type="button"
            onClick={onRefund}
            className="block w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] text-left cursor-pointer mb-2 hover:bg-mordobo-surfaceHover"
          >
            Issue partial refund
          </button>
          {relatedJob?.providerEmail && (
            <a
              href={`mailto:${relatedJob.providerEmail}`}
              className="block w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] text-left cursor-pointer mb-2 hover:bg-mordobo-surfaceHover no-underline"
            >
              Contact provider
            </a>
          )}
          <button
            type="button"
            onClick={onFlagForReview}
            className="block w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] text-left cursor-pointer mb-2 hover:bg-mordobo-surfaceHover"
          >
            {detail.isFlaggedForReview ? "Unflag from review" : "Flag for review"}
          </button>
          <p className="text-[11px] text-mordobo-textMuted mt-2 mb-0">
            Contact client / Suspend provider: use Users or Providers section.
          </p>
        </div>
      </div>
    </div>
  );
}

function RefundModal({
  complaintId,
  hasOrder,
  reason,
  setReason,
  amount,
  setAmount,
  onClose,
  onConfirm,
  loading,
}: {
  complaintId: string;
  hasOrder: boolean;
  reason: string;
  setReason: (s: string) => void;
  amount: string;
  setAmount: (s: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!hasOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-mordobo-card border border-mordobo-border rounded-xl p-6 max-w-md w-full mx-4">
          <h3 className="m-0 mb-2 text-lg font-semibold text-mordobo-text">No related order</h3>
          <p className="text-sm text-mordobo-textSecondary mb-4">
            This complaint has no linked order. Refunds are only available when the ticket is
            linked to an order with a payment.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-mordobo-card border border-mordobo-border rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="m-0 mb-4 text-lg font-semibold text-mordobo-text">Issue refund</h3>
        <p className="text-sm text-mordobo-textSecondary mb-4">
          Refund will be applied to the payment for the related order. Leave amount empty for full
          refund.
        </p>
        <label className="block text-sm font-medium text-mordobo-text mb-1">
          Reason (required)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Refund reason"
          className="w-full py-2 px-3 border border-mordobo-border rounded-lg bg-mordobo-surface text-mordobo-text mb-4"
        />
        <label className="block text-sm font-medium text-mordobo-text mb-1">
          Amount (optional, partial refund)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Leave empty for full refund"
          className="w-full py-2 px-3 border border-mordobo-border rounded-lg bg-mordobo-surface text-mordobo-text mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!reason.trim() || loading}
            className="py-2 px-4 bg-mordobo-accent text-white border-0 rounded-lg cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing…" : "Issue refund"}
          </button>
        </div>
      </div>
    </div>
  );
}
