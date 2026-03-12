import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLegalDocument,
  updateLegalDocument,
  getLegalDocumentVersions,
} from "@/services/contentService";
import type { LegalDocType } from "@/types";

const LEGAL_DOC_TYPES: { value: LegalDocType; label: string }[] = [
  { value: "terms_of_service", label: "Terms of Service" },
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "provider_agreement", label: "Provider Agreement" },
  { value: "cookie_policy", label: "Cookie Policy" },
];

export function LegalSection() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<LegalDocType>("terms_of_service");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyEs, setBodyEs] = useState("");

  const { data: document, isLoading } = useQuery({
    queryKey: ["content-legal", selectedType],
    queryFn: () => getLegalDocument(selectedType),
  });

  useEffect(() => {
    if (document) {
      setBodyEn(document.body_html_en ?? "");
      setBodyEs(document.body_html_es ?? "");
    }
  }, [document]);

  const { data: versions = [] } = useQuery({
    queryKey: ["content-legal-versions", selectedType],
    queryFn: () => getLegalDocumentVersions(selectedType),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateLegalDocument(selectedType, {
        body_html_en: bodyEn.trim() || undefined,
        body_html_es: bodyEs.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-legal", selectedType] });
      queryClient.invalidateQueries({ queryKey: ["content-legal-versions", selectedType] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  if (isLoading && !document) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        Loading document…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-mordobo-text m-0">Legal Documents</h2>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-4">
        <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
          Document type
        </label>
        <div className="flex flex-wrap gap-2">
          {LEGAL_DOC_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedType(value)}
              className={`py-2 px-4 rounded-xl text-sm font-medium border transition-colors ${
                selectedType === value
                  ? "bg-mordobo-accentDim border-mordobo-accent/25 text-mordobo-accentLight"
                  : "bg-transparent border-mordobo-border text-mordobo-textSecondary hover:bg-mordobo-surfaceHover hover:text-mordobo-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-4">
          <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
            Content (English)
          </label>
          <textarea
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            placeholder="HTML content in English"
            rows={14}
            className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm font-mono resize-y"
          />
        </div>
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-4">
          <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-2">
            Content (Spanish)
          </label>
          <textarea
            value={bodyEs}
            onChange={(e) => setBodyEs(e.target.value)}
            placeholder="Contenido HTML en español"
            rows={14}
            className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm font-mono resize-y"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving…" : "Save (creates new version)"}
        </button>
        {document?.updated_at && (
          <span className="text-mordobo-textMuted text-sm">
            Last updated: {new Date(document.updated_at).toLocaleString()}
          </span>
        )}
        {updateMutation.isError && (
          <span className="text-mordobo-danger text-sm">
            {(updateMutation.error as Error)?.message ?? "Failed to save"}
          </span>
        )}
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <h3 className="text-sm font-semibold text-mordobo-text p-4 border-b border-mordobo-border m-0">
          Version history
        </h3>
        <div className="overflow-x-auto">
          {versions.length === 0 ? (
            <div className="py-8 text-center text-mordobo-textSecondary text-sm">
              No versions yet. Save the document to create the first version.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-mordobo-border">
                  <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                    Saved at
                  </th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-b border-mordobo-border last:border-0">
                    <td className="py-3 px-4 text-sm text-mordobo-textSecondary">
                      {new Date(v.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
