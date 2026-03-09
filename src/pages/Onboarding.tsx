import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import { approveProvider, rejectProvider, listOnboardingRequests } from "@/services/adminService";
import type { OnboardingRequest } from "@/types";

const DOC_NAMES: string[] = ["Government ID (Cédula)", "Professional Certification", "Background Check", "Business License"];

export function Onboarding() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["admin-onboarding", filter],
    queryFn: () => listOnboardingRequests({ status: filter === "all" ? undefined : filter }),
  });

  const filtered =
    filter === "all"
      ? list
      : list.filter((r) => r.status === filter);
  const searchFiltered = search.trim()
    ? filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.service.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase())
      )
    : filtered;

  const selectedReq = selectedId ? list.find((r) => r.id === selectedId) : null;

  const approveMutation = useMutation({
    mutationFn: approveProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedId(null);
    },
  });
  const rejectMutation = useMutation({
    mutationFn: rejectProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedId(null);
    },
  });

  if (selectedReq) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-mordobo-accentLight text-sm mb-5 cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit"
        >
          ← Back to list
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-mordobo-card border border-mordobo-border rounded-[14px] p-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-xl font-bold text-mordobo-text">Application: {selectedReq.id}</h2>
              <Badge
                color={
                  selectedReq.status === "pending"
                    ? "warning"
                    : selectedReq.status === "in_review"
                      ? "info"
                      : selectedReq.status === "approved"
                        ? "success"
                        : "danger"
                }
              >
                {selectedReq.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-5 mb-7">
              {[
                ["Full Name", selectedReq.name],
                ["Service Category", selectedReq.service],
                ["Location", selectedReq.location],
                ["Application Date", selectedReq.date],
              ].map(([label, val]) => (
                <div key={String(label)}>
                  <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">{label}</div>
                  <div className="text-[15px] font-medium text-mordobo-text">{String(val)}</div>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-3">
                Submitted Documents ({selectedReq.documents})
              </div>
              {DOC_NAMES.slice(0, selectedReq.documents).map((doc, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2.5 px-3.5 bg-mordobo-surface rounded-lg mb-2 border border-mordobo-border"
                >
                  <span className="text-[13px] text-mordobo-text">📄 {doc}</span>
                  <span className="text-xs text-mordobo-accentLight cursor-pointer hover:underline">View ↗</span>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-3">Admin Notes</div>
              <textarea
                placeholder="Add review notes here..."
                className="w-full min-h-[100px] bg-mordobo-surface border border-mordobo-border rounded-xl p-3.5 text-mordobo-text text-[13px] resize-y box-border"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => approveMutation.mutate(selectedReq.id)}
                disabled={approveMutation.isPending}
                className="flex-1 py-3 px-5 bg-mordobo-success text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                ✓ Approve Application
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate(selectedReq.id)}
                disabled={rejectMutation.isPending}
                className="flex-1 py-3 px-5 bg-mordobo-danger text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                ✗ Reject Application
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
              <h3 className="m-0 0 mb-4 text-sm font-semibold text-mordobo-text">Review Checklist</h3>
              {["Identity verified", "Certifications valid", "Background check clean", "Service area confirmed", "Profile complete"].map(
                (item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2.5 py-2 text-[13px] text-mordobo-textSecondary cursor-pointer border-b border-mordobo-border last:border-0"
                  >
                    <input type="checkbox" className="accent-mordobo-accent" />
                    {item}
                  </label>
                )
              )}
            </div>
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
              <h3 className="m-0 0 mb-4 text-sm font-semibold text-mordobo-text">Activity Log</h3>
              <div className="text-[13px] text-mordobo-textSecondary py-2">
                No hay actividad registrada.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filters = ["all", "pending", "in_review", "approved", "rejected"] as const;
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize font-inherit border ${
                filter === f
                  ? "bg-mordobo-accent text-white border-mordobo-accent"
                  : "bg-mordobo-surface text-mordobo-textSecondary border-mordobo-border"
              }`}
            >
              {f.replace("_", " ")} ({f === "all" ? list.length : list.filter((r) => r.status === f).length})
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">🔍</span>
          <input
            type="search"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-2 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] w-60"
          />
        </div>
      </div>
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">Cargando...</div>
        ) : searchFiltered.length === 0 ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">No hay solicitudes que coincidan.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                {["ID", "Applicant", "Service", "Location", "Documents", "Date", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-3.5 px-4 text-left text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchFiltered.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-mordobo-border cursor-pointer hover:bg-mordobo-surface/50"
                  onClick={() => setSelectedId(req.id)}
                >
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-accentLight font-medium">{req.id}</td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-text font-medium">{req.name}</td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">{req.service}</td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">{req.location}</td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">{req.documents} files</td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">{req.date}</td>
                  <td className="py-3.5 px-4">
                    <Badge
                      color={
                        req.status === "pending"
                          ? "warning"
                          : req.status === "in_review"
                            ? "info"
                            : req.status === "approved"
                              ? "success"
                              : "danger"
                      }
                    >
                      {req.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(req.id)}
                      className="py-1.5 px-3 bg-mordobo-accentDim text-mordobo-accentLight border-0 rounded-md text-xs cursor-pointer font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
