import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import {
  fetchTransactions,
  fetchTransaction,
  fetchTransactionsSummary,
  refundTransaction,
  flagTransactionForReview,
  exportTransactionsCsv,
} from "@/services/transactionsService";
import type {
  TransactionListItem,
  TransactionStatus,
  TransactionsListParams,
} from "@/types";


function statusBadgeColor(s: TransactionStatus): "success" | "warning" | "danger" | "info" | "accent" {
  switch (s) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "refunded":
      return "info";
    case "failed":
      return "danger";
    default:
      return "accent";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
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

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function Transactions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionsListParams>({
    page: 1,
    limit: 20,
    sort_by: "date",
    sort_order: "desc",
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [refundId, setRefundId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const summaryParams =
    filters.start_date && filters.end_date
      ? { start_date: filters.start_date, end_date: filters.end_date }
      : undefined;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["transactions-summary", summaryParams],
    queryFn: () => fetchTransactionsSummary(summaryParams),
    staleTime: 60_000,
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["transactions-list", filters],
    queryFn: () => fetchTransactions(filters),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["transaction-detail", detailId],
    queryFn: () => (detailId ? fetchTransaction(detailId) : Promise.resolve(null)),
    enabled: !!detailId,
  });

  const transactions = listData?.transactions ?? [];
  const total = listData?.total ?? 0;
  const page = listData?.page ?? 1;
  const limit = listData?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleRefund = useCallback(
    async (id: string) => {
      if (!refundReason.trim()) return;
      setRefundSubmitting(true);
      try {
        const amount = refundAmount.trim() ? parseFloat(refundAmount) : undefined;
        await refundTransaction(id, { reason: refundReason.trim(), amount });
        queryClient.invalidateQueries({ queryKey: ["transactions-list"] });
        queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
        if (detailId === id) queryClient.invalidateQueries({ queryKey: ["transaction-detail", id] });
        setRefundId(null);
        setRefundReason("");
        setRefundAmount("");
      } finally {
        setRefundSubmitting(false);
      }
    },
    [refundReason, refundAmount, detailId, queryClient]
  );

  const handleFlag = useCallback(
    async (id: string, flag: boolean) => {
      await flagTransactionForReview(id, flag);
      queryClient.invalidateQueries({ queryKey: ["transactions-list"] });
      if (detailId === id) queryClient.invalidateQueries({ queryKey: ["transaction-detail", id] });
    },
    [detailId, queryClient]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportTransactionsCsv(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${filters.start_date ?? "all"}-${filters.end_date ?? "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const selectedForRefund = refundId ? transactions.find((t) => t.id === refundId) ?? (detail && detail.id === refundId ? detail : null) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-mordobo-text">{t("transactions.title")}</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-4 py-2 text-sm font-medium text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {exporting ? t("transactions.exporting") : t("transactions.exportCsv")}
        </button>
      </div>

      {summaryLoading ? (
        <p className="text-mordobo-textSecondary">{t("transactions.loadingSummary")}</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          <StatCard
            icon="💰"
            label={t("transactions.totalRevenue")}
            value={formatMoney(summary?.totalRevenue ?? 0)}
            color="success"
          />
          <StatCard
            icon="📊"
            label={t("transactions.platformFeesCollected")}
            value={formatMoney(summary?.platformFeesCollected ?? 0)}
            color="accent"
          />
          <StatCard
            icon="↩️"
            label={t("transactions.refundsIssued")}
            value={formatMoney(summary?.refundsIssued ?? 0)}
            color="info"
          />
          <StatCard
            icon="⏳"
            label={t("transactions.pendingPayouts")}
            value={formatMoney(summary?.pendingPayouts ?? 0)}
            color="warning"
          />
        </div>
      )}

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="date"
            value={filters.start_date ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, start_date: e.target.value || undefined, page: 1 }))
            }
            className="rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
          <span className="text-mordobo-textSecondary">{t("transactions.to")}</span>
          <input
            type="date"
            value={filters.end_date ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, end_date: e.target.value || undefined, page: 1 }))
            }
            className="rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: (e.target.value || undefined) as TransactionStatus | undefined,
                page: 1,
              }))
            }
            className="rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          >
            <option value="">{t("users.allStatuses")}</option>
            <option value="completed">{t("transactions.statusCompleted")}</option>
            <option value="pending">{t("transactions.statusPending")}</option>
            <option value="refunded">{t("transactions.statusRefunded")}</option>
            <option value="failed">{t("transactions.statusFailed")}</option>
          </select>
          <input
            type="number"
            placeholder={t("transactions.minAmount")}
            value={filters.min_amount ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                min_amount: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              }))
            }
            className="w-28 rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
          <input
            type="number"
            placeholder={t("transactions.maxAmount")}
            value={filters.max_amount ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                max_amount: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              }))
            }
            className="w-28 rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
          <input
            type="search"
            placeholder={t("transactions.searchUserPlaceholder")}
            value={filters.user_search ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, user_search: e.target.value || undefined, page: 1 }))
            }
            className="min-w-[200px] rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
        </div>

        {listLoading ? (
          <p className="text-mordobo-textSecondary py-8">{t("transactions.loadingTransactions")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mordobo-border text-left text-mordobo-textSecondary">
                    <th className="pb-3 pr-4 font-medium">{t("transactions.id")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("transactions.date")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("transactions.client")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("transactions.provider")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("transactions.service")}</th>
                    <th className="pb-3 pr-4 font-medium text-right">{t("transactions.amount")}</th>
                    <th className="pb-3 pr-4 font-medium text-right">{t("transactions.platformFee")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("transactions.status")}</th>
                    <th className="pb-3 font-medium">{t("transactions.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: TransactionListItem) => (
                    <tr
                      key={tx.id}
                      className="border-b border-mordobo-border last:border-0 hover:bg-mordobo-surfaceHover/30"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-mordobo-textMuted">
                        {tx.id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-4 text-mordobo-text">{formatDate(tx.date)}</td>
                      <td className="py-3 pr-4 text-mordobo-text">
                        {tx.client_name ?? tx.client_email ?? tx.client_id}
                      </td>
                      <td className="py-3 pr-4 text-mordobo-text">
                        {tx.provider_name ?? tx.provider_email ?? tx.provider_id}
                      </td>
                      <td className="py-3 pr-4 text-mordobo-textSecondary">
                        {tx.service_name ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-mordobo-text">
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="py-3 pr-4 text-right text-mordobo-textSecondary">
                        {formatMoney(tx.platform_fee)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={statusBadgeColor(tx.status)}>{tx.status}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(tx.id)}
                            className="text-mordobo-accentLight text-xs font-medium hover:underline"
                          >
                            {t("transactions.view")}
                          </button>
                          {tx.status === "completed" && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundId(tx.id);
                                setRefundReason("");
                                setRefundAmount("");
                              }}
                              className="text-mordobo-warning text-xs font-medium hover:underline"
                            >
                              {t("transactions.refund")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleFlag(tx.id, !tx.flag_for_review)}
                            className="text-mordobo-textSecondary text-xs font-medium hover:underline"
                          >
                            {tx.flag_for_review ? t("transactions.unflag") : t("transactions.flag")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length === 0 && (
              <p className="text-mordobo-textSecondary py-8 text-center">
                {t("transactions.noMatch")}
              </p>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-mordobo-border">
                <p className="text-sm text-mordobo-textSecondary">
                  {t("transactions.pageOf", { page, totalPages, total })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    disabled={page <= 1}
                    className="rounded-lg border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text disabled:opacity-50 hover:bg-mordobo-surfaceHover"
                  >
                    {t("onboarding.previous")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text disabled:opacity-50 hover:bg-mordobo-surfaceHover"
                  >
                    {t("onboarding.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDetailId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-mordobo-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-mordobo-text">{t("transactions.transactionDetails")}</h2>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="text-mordobo-textSecondary hover:text-mordobo-text text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {detailLoading || !detail ? (
                <p className="text-mordobo-textSecondary">{t("common.loading")}</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        ID
                      </div>
                      <div className="font-mono text-mordobo-text break-all">{detail.id}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Job reference
                      </div>
                      <div className="font-mono text-mordobo-text">{detail.job_reference ?? detail.order_id}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Date
                      </div>
                      <div className="text-mordobo-text">{formatDate(detail.date)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Payment method
                      </div>
                      <div className="text-mordobo-text capitalize">
                        {detail.payment_method ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Client
                      </div>
                      <div className="text-mordobo-text">
                        {detail.client_name ?? detail.client_email ?? detail.client_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Provider
                      </div>
                      <div className="text-mordobo-text">
                        {detail.provider_name ?? detail.provider_email ?? detail.provider_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Service
                      </div>
                      <div className="text-mordobo-text">{detail.service_name ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Status
                      </div>
                      <Badge color={statusBadgeColor(detail.status)}>{detail.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
                      Payment breakdown
                    </div>
                    <div className="bg-mordobo-surface border border-mordobo-border rounded-xl p-4 space-y-2">
                      {detail.payment_breakdown?.line_items?.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm text-mordobo-text"
                        >
                          <span>{item.description}</span>
                          <span>{formatMoney(item.amount)}</span>
                        </div>
                      ))}
                      {(!detail.payment_breakdown?.line_items?.length) && (
                        <div className="flex justify-between text-sm text-mordobo-text">
                          <span>Amount</span>
                          <span>{formatMoney(detail.amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-mordobo-textSecondary pt-2 border-t border-mordobo-border">
                        <span>Platform fee</span>
                        <span>{formatMoney(detail.platform_fee)}</span>
                      </div>
                    </div>
                  </div>
                  {detail.refund_amount != null && detail.refund_amount > 0 && (
                    <div className="text-sm">
                      <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">
                        Refund
                      </div>
                      <div className="text-mordobo-text">
                        {formatMoney(detail.refund_amount)}
                        {detail.refunded_at && ` on ${formatDate(detail.refunded_at)}`}
                      </div>
                      {detail.refund_reason && (
                        <div className="text-mordobo-textSecondary mt-1">{detail.refund_reason}</div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {detail.status === "completed" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundId(detail.id);
                          setRefundReason("");
                          setRefundAmount("");
                        }}
                        className="rounded-lg bg-mordobo-warningDim text-mordobo-warning border border-mordobo-warning/30 px-4 py-2 text-sm font-medium hover:opacity-90"
                      >
                        Issue refund
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFlag(detail.id, !detail.flag_for_review)}
                      className="rounded-lg border border-mordobo-border bg-mordobo-card px-4 py-2 text-sm font-medium text-mordobo-text hover:bg-mordobo-surfaceHover"
                    >
                      {detail.flag_for_review ? "Unflag for review" : "Flag for review"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundId && selectedForRefund && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setRefundId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] max-w-md w-full shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-mordobo-text mb-4">Issue refund</h3>
            <p className="text-sm text-mordobo-textSecondary mb-4">
              Transaction amount: {formatMoney(selectedForRefund.amount)}.
              Leave amount empty for full refund.
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Refund amount (optional)"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none mb-4"
            />
            <textarea
              placeholder="Reason for refund (required)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none resize-y mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRefundId(null)}
                className="rounded-xl border border-mordobo-border bg-mordobo-card px-4 py-2 text-sm font-medium text-mordobo-text hover:bg-mordobo-surfaceHover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRefund(refundId)}
                disabled={!refundReason.trim() || refundSubmitting}
                className="rounded-xl bg-mordobo-warning px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {refundSubmitting ? "Processing…" : "Confirm refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
