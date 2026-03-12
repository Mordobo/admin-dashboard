import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "@/services/settingsService";

export function AuditLogSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings-audit-log"],
    queryFn: () => getAuditLog({ limit: 100 }),
  });

  const entries = data?.entries ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        Loading audit log…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-mordobo-text m-0">Audit log</h2>
      <p className="text-sm text-mordobo-textSecondary m-0">
        Timeline of administrative actions (who did what, when).
      </p>
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">When</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Who</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Action</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Resource</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-mordobo-border last:border-0">
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-sm text-mordobo-text">{entry.admin_name || entry.admin_email || "—"}</div>
                    {entry.admin_email && entry.admin_name && (
                      <div className="text-[12px] text-mordobo-textMuted">{entry.admin_email}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-mordobo-text font-mono">{entry.action_type}</td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                    {entry.resource_type && entry.resource_id
                      ? `${entry.resource_type}:${entry.resource_id}`
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary max-w-[200px] truncate">
                    {entry.details && Object.keys(entry.details).length > 0
                      ? JSON.stringify(entry.details)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">No audit entries yet.</div>
        )}
      </div>
    </div>
  );
}
