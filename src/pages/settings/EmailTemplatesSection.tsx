import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEmailTemplates, updateEmailTemplate } from "@/services/settingsService";
import type { EmailTemplate } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export function EmailTemplatesSection() {
  const { auth } = useAuth();
  const isSuperAdmin = auth.role === "super_admin";
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editBodyPlain, setEditBodyPlain] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["settings-email-templates"],
    queryFn: listEmailTemplates,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { subject?: string; body_html?: string; body_plain?: string } }) =>
      updateEmailTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-email-templates"] });
      if (selected) {
        setEditSubject(selected.subject);
        setEditBodyHtml(selected.body_html ?? "");
        setEditBodyPlain(selected.body_plain ?? "");
      }
    },
  });

  const openEditor = (t: EmailTemplate) => {
    setSelected(t);
    setEditSubject(t.subject);
    setEditBodyHtml(t.body_html ?? "");
    setEditBodyPlain(t.body_plain ?? "");
  };

  const handleSave = () => {
    if (!selected) return;
    updateMutation.mutate({
      id: selected.id,
      payload: {
        subject: editSubject,
        body_html: editBodyHtml || undefined,
        body_plain: editBodyPlain || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        Loading email templates…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <p className="text-mordobo-textSecondary">Only Super Admin can view and edit email templates.</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-mordobo-accentLight text-sm cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit"
        >
          ← Back to templates
        </button>
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">{selected.name} ({selected.slug})</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Subject</label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Body (HTML)</label>
              <textarea
                value={editBodyHtml}
                onChange={(e) => setEditBodyHtml(e.target.value)}
                rows={8}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm font-mono resize-y"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Body (plain)</label>
              <textarea
                value={editBodyPlain}
                onChange={(e) => setEditBodyPlain(e.target.value)}
                rows={4}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm resize-y"
              />
            </div>
          </div>
          {updateMutation.isError && (
            <p className="text-mordobo-danger text-sm mt-2">{(updateMutation.error as Error)?.message ?? "Failed to save"}</p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving…" : "Save template"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-mordobo-text m-0">Email templates</h2>
      <div className="grid gap-4">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-4 flex items-center justify-between flex-wrap gap-3"
          >
            <div>
              <div className="font-medium text-mordobo-text">{t.name}</div>
              <div className="text-[13px] text-mordobo-textSecondary">{t.slug} · {t.subject}</div>
            </div>
            <button
              type="button"
              onClick={() => openEditor(t)}
              className="py-2 px-4 bg-mordobo-accentDim text-mordobo-accentLight border-0 rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
      {templates.length === 0 && (
        <div className="py-12 text-center text-mordobo-textSecondary text-sm bg-mordobo-card border border-mordobo-border rounded-[14px]">
          No email templates configured. Add them from your backend or seed data.
        </div>
      )}
    </div>
  );
}
