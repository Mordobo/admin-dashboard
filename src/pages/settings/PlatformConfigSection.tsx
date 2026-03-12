import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlatformConfig, updatePlatformConfig } from "@/services/settingsService";
import type { PlatformConfig as PlatformConfigType } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const defaultConfig: PlatformConfigType = {
  service_fee_percentage: 10,
  job_amount_min: 5000,
  job_amount_max: 500000,
  supported_cities: ["Bogotá", "Medellín", "Cali"],
  supported_languages: ["es", "en"],
  maintenance_mode: false,
};

export function PlatformConfigSection() {
  const { auth } = useAuth();
  const isSuperAdmin = auth.role === "super_admin";
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["settings-platform"],
    queryFn: getPlatformConfig,
  });

  const [form, setForm] = useState<PlatformConfigType>(defaultConfig);
  const [citiesText, setCitiesText] = useState("");
  const [languagesText, setLanguagesText] = useState("");

  useEffect(() => {
    if (!config) return;
    setForm(config);
    setCitiesText(Array.isArray(config.supported_cities) ? config.supported_cities.join(", ") : "");
    setLanguagesText(Array.isArray(config.supported_languages) ? config.supported_languages.join(", ") : "");
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: updatePlatformConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-platform"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<PlatformConfigType> = {
      ...form,
      supported_cities: citiesText.split(",").map((s) => s.trim()).filter(Boolean),
      supported_languages: languagesText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        Loading platform config…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <p className="text-mordobo-textSecondary">
          Only Super Admin can view and edit platform configuration.
        </p>
        {config && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-mordobo-textMuted">Service fee:</span> {config.service_fee_percentage}%</div>
            <div><span className="text-mordobo-textMuted">Maintenance:</span> {config.maintenance_mode ? "On" : "Off"}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-mordobo-text m-0">Platform configuration</h2>
      <form onSubmit={handleSubmit} className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Service fee %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.service_fee_percentage}
              onChange={(e) => setForm((f) => ({ ...f, service_fee_percentage: Number(e.target.value) }))}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Min job amount</label>
            <input
              type="number"
              min={0}
              value={form.job_amount_min}
              onChange={(e) => setForm((f) => ({ ...f, job_amount_min: Number(e.target.value) }))}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Max job amount</label>
            <input
              type="number"
              min={0}
              value={form.job_amount_max}
              onChange={(e) => setForm((f) => ({ ...f, job_amount_max: Number(e.target.value) }))}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Supported cities (comma-separated)</label>
          <input
            type="text"
            value={citiesText}
            onChange={(e) => setCitiesText(e.target.value)}
            placeholder="Bogotá, Medellín, Cali"
            className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Supported languages (comma-separated)</label>
          <input
            type="text"
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
            placeholder="es, en"
            className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-mordobo-text">Maintenance mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={form.maintenance_mode}
            onClick={() => setForm((f) => ({ ...f, maintenance_mode: !f.maintenance_mode }))}
            className={`relative w-11 h-6 rounded-full border-0 transition-colors ${
              form.maintenance_mode ? "bg-mordobo-warning" : "bg-mordobo-border"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                form.maintenance_mode ? "left-6" : "left-1"
              }`}
            />
          </button>
          <span className="text-sm text-mordobo-textSecondary">{form.maintenance_mode ? "On" : "Off"}</span>
        </div>
        {updateMutation.isError && (
          <p className="text-mordobo-danger text-sm">{(updateMutation.error as Error)?.message ?? "Failed to save"}</p>
        )}
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
