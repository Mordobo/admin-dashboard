import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listBanners, createBanner, updateBanner, deleteBanner } from "@/services/contentService";
import { Badge } from "@/components/Badge";
import type { Banner, ContentStatus } from "@/types";

const STATUS_OPTIONS: ContentStatus[] = ["draft", "published"];
const STATUS_LABELS: Record<ContentStatus, string> = { draft: "Draft", published: "Published" };
const STATUS_COLORS: Record<ContentStatus, "warning" | "success"> = {
  draft: "warning",
  published: "success",
};

export function BannersSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [order, setOrder] = useState(0);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["content-banners"],
    queryFn: listBanners,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createBanner({
        title: title.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
        status,
        order,
        start_at: startAt.trim() ? new Date(startAt.trim()).toISOString() : undefined,
        end_at: endAt.trim() ? new Date(endAt.trim()).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-banners"] });
      setFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      updateBanner(id, {
        title: title.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
        status,
        order,
        start_at: startAt.trim() ? new Date(startAt.trim()).toISOString() : undefined,
        end_at: endAt.trim() ? new Date(endAt.trim()).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-banners"] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content-banners"] }),
  });

  function resetForm() {
    setTitle("");
    setImageUrl("");
    setLinkUrl("");
    setStatus("draft");
    setOrder(0);
    setStartAt("");
    setEndAt("");
  }

  function openEdit(banner: Banner) {
    setEditingId(banner.id);
    setTitle(banner.title ?? "");
    setImageUrl(banner.image_url ?? "");
    setLinkUrl(banner.link_url ?? "");
    setStatus((banner.status as ContentStatus) ?? "draft");
    setOrder(banner.order ?? 0);
    setStartAt(banner.start_at ? banner.start_at.slice(0, 16) : "");
    setEndAt(banner.end_at ? banner.end_at.slice(0, 16) : "");
  }

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId });
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        Loading banners…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-mordobo-text m-0">Banners & Promotions</h2>
        <button
          type="button"
          onClick={() => {
            setFormOpen(true);
            setEditingId(null);
            resetForm();
          }}
          className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90"
        >
          Add banner
        </button>
      </div>

      {(formOpen || editingId) && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4 m-0">
            {editingId ? t("content.editBanner") : t("content.newBanner")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Banner title"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Link URL (optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Order
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                min={0}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Start at (optional)
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                End at (optional)
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-mordobo-danger text-sm mb-4">
              {((createMutation.error ?? updateMutation.error) as Error)?.message ??
                "Failed to save"}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
                resetForm();
              }}
              className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {editingId
                ? updateMutation.isPending
                  ? "Saving…"
                  : "Save"
                : createMutation.isPending
                  ? "Creating…"
                  : "Create banner"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  Preview
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  Title
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  Order
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  Period
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="border-b border-mordobo-border last:border-0">
                  <td className="py-3 px-4">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt=""
                        className="w-16 h-10 object-cover rounded-lg bg-mordobo-surface"
                      />
                    ) : (
                      <span className="text-mordobo-textMuted text-xs">No image</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-mordobo-text">{banner.title || "—"}</div>
                    {banner.link_url && (
                      <div className="text-xs text-mordobo-textMuted truncate max-w-[180px]">
                        {banner.link_url}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge color={STATUS_COLORS[(banner.status as ContentStatus) ?? "draft"]}>
                      {STATUS_LABELS[(banner.status as ContentStatus) ?? "draft"]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-mordobo-textSecondary">{banner.order ?? 0}</td>
                  <td className="py-3 px-4 text-xs text-mordobo-textMuted">
                    {banner.start_at || banner.end_at
                      ? `${banner.start_at ? new Date(banner.start_at).toLocaleDateString() : "—"} / ${banner.end_at ? new Date(banner.end_at).toLocaleDateString() : "—"}`
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => openEdit(banner)}
                      className="text-mordobo-accentLight text-sm hover:underline mr-2"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(banner.id)}
                      disabled={deleteMutation.isPending}
                      className="text-mordobo-danger text-sm hover:underline disabled:opacity-50"
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {banners.length === 0 && (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">
            No banners yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
