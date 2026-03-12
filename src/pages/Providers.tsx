import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategoriesTree } from "@/services/categoriesService";
import {
  fetchProviders,
  fetchProvider,
  updateProviderStatus,
  toggleProviderVerify,
  toggleProviderFeature,
  updateProviderCommission,
} from "@/services/providersService";
import type { ProviderListItem, ProviderDetail, ProviderListParams } from "@/types";
import type { ServiceCatalogCategory } from "@/types";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Active only" },
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "rejected", label: "Rejected" },
];

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

function statusBadgeColor(s: string): "success" | "warning" | "danger" | "info" | "accent" {
  switch (s) {
    case "active":
      return "success";
    case "suspended":
      return "danger";
    case "pending_verification":
      return "warning";
    case "rejected":
      return "info";
    default:
      return "accent";
  }
}

export function Providers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProviderListParams>({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    category: "",
    rating: undefined,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [commissionModal, setCommissionModal] = useState<{ id: string; current: number | null } | null>(null);
  const [commissionInput, setCommissionInput] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-tree"],
    queryFn: getCategoriesTree,
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["providers-list", filters],
    queryFn: () => fetchProviders(filters),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["provider-detail", detailId],
    queryFn: () => (detailId ? fetchProvider(detailId) : Promise.resolve(null)),
    enabled: !!detailId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) =>
      updateProviderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers-list"] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ["provider-detail", detailId] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => toggleProviderVerify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers-list"] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ["provider-detail", detailId] });
    },
  });

  const featureMutation = useMutation({
    mutationFn: (id: string) => toggleProviderFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers-list"] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ["provider-detail", detailId] });
    },
  });

  const commissionMutation = useMutation({
    mutationFn: ({ id, commission_rate }: { id: string; commission_rate: number | null }) =>
      updateProviderCommission(id, commission_rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers-list"] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ["provider-detail", detailId] });
      setCommissionModal(null);
      setCommissionInput("");
    },
  });

  const providers = listData?.providers ?? [];
  const total = listData?.total ?? 0;
  const page = listData?.page ?? 1;
  const limit = listData?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const flatCategoryOptions: { value: string; label: string }[] = [];
  categories.forEach((c: ServiceCatalogCategory) => {
    flatCategoryOptions.push({ value: c.id, label: `${c.name ?? c.name_en ?? c.id} (category)` });
    (c.subcategories ?? []).forEach((s) => {
      flatCategoryOptions.push({ value: s.id, label: `  ${s.name ?? s.name_en ?? s.id}` });
    });
  });

  const handleCommissionSubmit = useCallback(() => {
    if (!commissionModal) return;
    const v = commissionInput.trim();
    const rate = v === "" ? null : parseFloat(v);
    if (v !== "" && (Number.isNaN(rate) || rate < 0 || rate > 1)) return;
    commissionMutation.mutate({ id: commissionModal.id, commission_rate: rate });
  }, [commissionModal, commissionInput, commissionMutation]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-mordobo-text">Providers Management</h1>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="search"
            placeholder="Search by name or service"
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
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value || undefined, page: 1 }))
            }
            className="rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none min-w-[180px]"
          >
            <option value="">All categories</option>
            {flatCategoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={5}
            step={0.5}
            placeholder="Min rating"
            value={filters.rating ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                rating: e.target.value ? parseFloat(e.target.value) : undefined,
                page: 1,
              }))
            }
            className="w-24 rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          />
        </div>

        {listLoading ? (
          <p className="text-mordobo-textSecondary py-8">Loading providers…</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mordobo-border text-left text-mordobo-textSecondary">
                    <th className="pb-3 pr-4 font-medium">ID</th>
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Service Category</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium text-right">Rating</th>
                    <th className="pb-3 pr-4 font-medium text-right">Total Jobs</th>
                    <th className="pb-3 pr-4 font-medium text-right">Earnings</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p: ProviderListItem) => (
                    <tr
                      key={p.id}
                      className="border-b border-mordobo-border last:border-0 hover:bg-mordobo-surfaceHover/30"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-mordobo-textMuted">
                        {p.id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-4 text-mordobo-text">{p.name || p.email}</td>
                      <td className="py-3 pr-4 text-mordobo-textSecondary">
                        {p.service_category ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-mordobo-textSecondary">{p.location ?? "—"}</td>
                      <td className="py-3 pr-4 text-right text-mordobo-text">
                        {p.rating > 0 ? `${Number(p.rating).toFixed(1)} (${p.total_reviews})` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right text-mordobo-text">{p.total_jobs}</td>
                      <td className="py-3 pr-4 text-right font-medium text-mordobo-text">
                        {formatMoney(p.earnings)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          <Badge color={statusBadgeColor(p.status)}>{p.status}</Badge>
                          {p.verified && (
                            <span className="text-xs text-mordobo-accentLight" title="Verified">
                              ✓
                            </span>
                          )}
                          {p.is_featured && (
                            <span className="text-xs text-mordobo-warning" title="Featured">
                              ★
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(p.id)}
                            className="text-mordobo-accentLight text-xs font-medium hover:underline"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({
                                id: p.id,
                                status: p.status === "suspended" ? "active" : "suspended",
                              })
                            }
                            disabled={statusMutation.isPending}
                            className="text-mordobo-warning text-xs font-medium hover:underline disabled:opacity-50"
                          >
                            {p.status === "suspended" ? "Activate" : "Suspend"}
                          </button>
                          <button
                            type="button"
                            onClick={() => verifyMutation.mutate(p.id)}
                            disabled={verifyMutation.isPending}
                            className="text-mordobo-textSecondary text-xs font-medium hover:underline disabled:opacity-50"
                          >
                            {p.verified ? "Unverify" : "Verify"}
                          </button>
                          <button
                            type="button"
                            onClick={() => featureMutation.mutate(p.id)}
                            disabled={featureMutation.isPending}
                            className="text-mordobo-textSecondary text-xs font-medium hover:underline disabled:opacity-50"
                          >
                            {p.is_featured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCommissionModal({ id: p.id, current: p.commission_rate });
                              setCommissionInput(
                                p.commission_rate != null ? String(p.commission_rate) : ""
                              );
                            }}
                            className="text-mordobo-textSecondary text-xs font-medium hover:underline"
                          >
                            Commission
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {providers.length === 0 && (
              <p className="text-mordobo-textSecondary py-8 text-center">
                No providers match your filters.
              </p>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-mordobo-border">
                <p className="text-sm text-mordobo-textSecondary">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    disabled={page <= 1}
                    className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    disabled={page >= totalPages}
                    className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailId && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h2 className="text-lg font-semibold text-mordobo-text mb-4">Provider detail</h2>
          {detailLoading ? (
            <p className="text-mordobo-textSecondary">Loading…</p>
          ) : detail ? (
            <ProviderDetailPanel
              detail={detail}
              onClose={() => setDetailId(null)}
              onStatusChange={() =>
                statusMutation.mutate({
                  id: detail.profile.id,
                  status:
                    detail.profile.status === "suspended" ? "active" : "suspended",
                })
              }
              onVerify={() => verifyMutation.mutate(detail.profile.id)}
              onFeature={() => featureMutation.mutate(detail.profile.id)}
              onEditCommission={() => {
                setCommissionModal({
                  id: detail.profile.id,
                  current: detail.profile.commission_rate,
                });
                setCommissionInput(
                  detail.profile.commission_rate != null
                    ? String(detail.profile.commission_rate)
                    : ""
                );
              }}
              statusMutationPending={statusMutation.isPending}
              verifyMutationPending={verifyMutation.isPending}
              featureMutationPending={featureMutation.isPending}
            />
          ) : (
            <p className="text-mordobo-textSecondary">Provider not found.</p>
          )}
        </div>
      )}

      {commissionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !commissionMutation.isPending && setCommissionModal(null)}
        >
          <div
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-mordobo-text mb-2">Edit commission rate</h3>
            <p className="text-sm text-mordobo-textSecondary mb-3">
              Enter a value between 0 and 1 (e.g. 0.15 = 15%). Leave empty to use platform default.
            </p>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              placeholder="e.g. 0.15"
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              className="w-full rounded-xl border border-mordobo-border bg-mordobo-surface px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setCommissionModal(null)}
                disabled={commissionMutation.isPending}
                className="rounded-xl border border-mordobo-border px-4 py-2 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommissionSubmit}
                disabled={commissionMutation.isPending}
                className="rounded-xl bg-mordobo-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {commissionMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderDetailPanel({
  detail,
  onClose,
  onStatusChange,
  onVerify,
  onFeature,
  onEditCommission,
  statusMutationPending,
  verifyMutationPending,
  featureMutationPending,
}: {
  detail: ProviderDetail;
  onClose: () => void;
  onStatusChange: () => void;
  onVerify: () => void;
  onFeature: () => void;
  onEditCommission: () => void;
  statusMutationPending: boolean;
  verifyMutationPending: boolean;
  featureMutationPending: boolean;
}) {
  const { profile, services, job_history, reviews, documents, earnings_breakdown } = detail;
  const name = profile.business_name?.trim() || profile.full_name || profile.email || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.profile_image_url && (
            <img
              src={profile.profile_image_url}
              alt=""
              className="w-16 h-16 rounded-xl object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-mordobo-text">{name}</h3>
            <p className="text-sm text-mordobo-textSecondary">{profile.email}</p>
            <p className="text-sm text-mordobo-textSecondary">{profile.phone_number ?? "—"}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge color={statusBadgeColor(profile.status)}>{profile.status}</Badge>
              {profile.verified && <Badge color="accent">Verified</Badge>}
              {profile.is_featured && <Badge color="warning">Featured</Badge>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-mordobo-border px-3 py-1.5 text-sm text-mordobo-textSecondary hover:bg-mordobo-surfaceHover"
        >
          Close
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStatusChange}
          disabled={statusMutationPending}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {profile.status === "suspended" ? "Activate" : "Suspend"}
        </button>
        <button
          type="button"
          onClick={onVerify}
          disabled={verifyMutationPending}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {profile.verified ? "Unverify" : "Verify"}
        </button>
        <button
          type="button"
          onClick={onFeature}
          disabled={featureMutationPending}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover disabled:opacity-50"
        >
          {profile.is_featured ? "Unfeature" : "Feature"}
        </button>
        <button
          type="button"
          onClick={onEditCommission}
          className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-1.5 text-sm text-mordobo-text hover:bg-mordobo-surfaceHover"
        >
          Edit commission ({profile.commission_rate != null ? `${(profile.commission_rate * 100).toFixed(0)}%` : "default"})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon="📅"
          label="Earnings (week)"
          value={formatMoney(earnings_breakdown.week)}
          color="accent"
        />
        <StatCard
          icon="📆"
          label="Earnings (month)"
          value={formatMoney(earnings_breakdown.month)}
          color="success"
        />
        <StatCard
          icon="📊"
          label="Earnings (year)"
          value={formatMoney(earnings_breakdown.year)}
          color="info"
        />
      </div>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">Profile</h4>
        <p className="text-sm text-mordobo-textSecondary">
          {profile.bio || "No bio."} · Location: {profile.location ?? "—"} · Category:{" "}
          {profile.service_category ?? "—"}
        </p>
        {profile.hourly_rate != null && (
          <p className="text-sm text-mordobo-textSecondary">Hourly rate: {formatMoney(profile.hourly_rate)}</p>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">Services offered</h4>
        {services.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">None</p>
        ) : (
          <ul className="text-sm text-mordobo-textSecondary space-y-1">
            {services.map((svc) => (
              <li key={svc.id}>
                {svc.name} {svc.price != null ? `— ${formatMoney(svc.price)}` : ""}
                {svc.category_name ? ` (${svc.category_name})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">Job history</h4>
        {job_history.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">No jobs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mordobo-border text-left text-mordobo-textSecondary">
                  <th className="pb-2 pr-2 font-medium">Date</th>
                  <th className="pb-2 pr-2 font-medium">Service</th>
                  <th className="pb-2 pr-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {job_history.slice(0, 20).map((j) => (
                  <tr key={j.id} className="border-b border-mordobo-border/50">
                    <td className="py-1.5 pr-2 text-mordobo-text">{formatDate(j.created_at)}</td>
                    <td className="py-1.5 pr-2 text-mordobo-textSecondary">{j.service_name ?? "—"}</td>
                    <td className="py-1.5 pr-2">{j.order_status}</td>
                    <td className="py-1.5 text-right text-mordobo-text">
                      {j.payment_amount != null ? formatMoney(j.payment_amount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-mordobo-text mb-2">Reviews received</h4>
        {reviews.length === 0 ? (
          <p className="text-sm text-mordobo-textMuted">No reviews yet</p>
        ) : (
          <ul className="space-y-2">
            {reviews.slice(0, 10).map((r) => (
              <li key={r.id} className="text-sm border-b border-mordobo-border/50 pb-2">
                <span className="text-mordobo-text">{r.rating}★</span>{" "}
                <span className="text-mordobo-textSecondary">{r.comment ?? "—"}</span> —{" "}
                <span className="text-mordobo-textMuted">{r.client_name ?? "Client"}</span> ·{" "}
                {formatDate(r.created_at)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {documents.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-mordobo-text mb-2">Documents</h4>
          <ul className="text-sm text-mordobo-textSecondary space-y-1">
            {documents.map((d, i) => (
              <li key={i}>
                {d.document_type}: {d.file_name ?? d.file_path}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
