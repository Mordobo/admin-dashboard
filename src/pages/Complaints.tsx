import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import { listComplaints } from "@/services/adminService";
import type { Complaint } from "@/types";

export function Complaints() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["admin-complaints", typeFilter],
    queryFn: () => listComplaints({ type: typeFilter === "all" ? undefined : typeFilter }),
  });

  const filtered = typeFilter === "all" ? list : list.filter((c) => c.type === typeFilter);
  const searchFiltered = search.trim()
    ? filtered.filter(
        (c) =>
          c.subject.toLowerCase().includes(search.toLowerCase()) ||
          c.from.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase())
      )
    : filtered;

  const selected = selectedId ? list.find((c) => c.id === selectedId) : null;

  const typeFilters = ["all", "complaint", "claim", "suggestion"] as const;

  if (selected) {
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
            <div className="flex justify-between items-center mb-5">
              <h2 className="m-0 text-xl font-bold text-mordobo-text">
                {selected.id}: {selected.subject}
              </h2>
              <div className="flex gap-2">
                <Badge color={selected.type === "complaint" ? "danger" : selected.type === "claim" ? "warning" : "info"}>
                  {selected.type}
                </Badge>
                <Badge color={selected.priority === "critical" ? "danger" : selected.priority === "high" ? "warning" : "info"}>
                  {selected.priority}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                ["Submitted By", `${selected.from} (${selected.role})`],
                ["Date", selected.date],
                ["Status", selected.status.replace("_", " ")],
              ].map(([label, val]) => (
                <div key={String(label)}>
                  <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">{label}</div>
                  <div className="text-sm font-medium text-mordobo-text capitalize">{String(val)}</div>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2.5">Description</div>
              <div className="bg-mordobo-surface border border-mordobo-border rounded-xl p-4 text-sm text-mordobo-textSecondary leading-relaxed">
                {selected.description ?? "Sin descripción."}
              </div>
            </div>
            <div className="mb-6">
              <div className="text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2.5">Conversation Thread</div>
              <div className="text-[13px] text-mordobo-textSecondary py-2">No hay mensajes aún.</div>
              <textarea
                placeholder="Write a response..."
                className="w-full min-h-[80px] mt-2 bg-mordobo-surface border border-mordobo-border rounded-xl p-3.5 text-mordobo-text text-[13px] resize-y box-border"
              />
              <button type="button" className="mt-2 py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90">
                Send Response
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select className="flex-1 min-w-[140px] py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px]">
                <option>Change Status...</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
                <option>Escalated</option>
              </select>
              <button type="button" className="py-2.5 px-5 bg-mordobo-successDim text-mordobo-success border border-mordobo-success/30 rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90">
                Mark Resolved
              </button>
              <button type="button" className="py-2.5 px-5 bg-mordobo-dangerDim text-mordobo-danger border border-mordobo-danger/30 rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90">
                Escalate
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
              <h3 className="m-0 0 mb-4 text-sm font-semibold text-mordobo-text">Related Information</h3>
              <p className="text-xs text-mordobo-textSecondary">No hay datos relacionados cargados.</p>
            </div>
            <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
              <h3 className="m-0 0 mb-4 text-sm font-semibold text-mordobo-text">Quick Actions</h3>
              {["Issue partial refund", "Contact provider", "Contact client", "Suspend provider", "Flag for review"].map((action, i) => (
                <button
                  key={i}
                  type="button"
                  className="block w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] text-left cursor-pointer mb-2 last:mb-0 hover:bg-mordobo-surfaceHover"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize font-inherit border ${
                typeFilter === f
                  ? "bg-mordobo-accent text-white border-mordobo-accent"
                  : "bg-mordobo-surface text-mordobo-textSecondary border-mordobo-border"
              }`}
            >
              {f} ({f === "all" ? list.length : list.filter((c) => c.type === f).length})
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="py-2 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-[13px] w-60"
        />
      </div>
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">Cargando...</div>
        ) : searchFiltered.length === 0 ? (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">No hay quejas o sugerencias que coincidan.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                {["ID", "Type", "From", "Subject", "Priority", "Status", "Date", "Actions"].map((h) => (
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
              {searchFiltered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-mordobo-border cursor-pointer hover:bg-mordobo-surface/50"
                  onClick={() => setSelectedId(c.id)}
                >
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-accentLight font-medium">{c.id}</td>
                  <td className="py-3.5 px-4">
                    <Badge color={c.type === "complaint" ? "danger" : c.type === "claim" ? "warning" : "info"}>{c.type}</Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[13px] text-mordobo-text font-medium">{c.from}</div>
                    <div className="text-[11px] text-mordobo-textMuted">{c.role}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary max-w-[250px] truncate">{c.subject}</td>
                  <td className="py-3.5 px-4">
                    <Badge
                      color={
                        c.priority === "critical" ? "danger" : c.priority === "high" ? "warning" : c.priority === "medium" ? "info" : "accent"
                      }
                    >
                      {c.priority}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge color={c.status === "open" ? "warning" : c.status === "in_progress" ? "info" : "success"}>
                      {c.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">{c.date}</td>
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
        )}
      </div>
    </div>
  );
}
