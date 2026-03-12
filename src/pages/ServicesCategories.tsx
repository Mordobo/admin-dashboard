import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategoriesTree,
  createCategory,
  createSubcategory,
  updateCategoryOrSubcategory,
  reorderCategories,
  deleteCategoryOrSubcategory,
} from "@/services/categoriesService";
import type { ServiceCatalogCategory, ServiceCatalogSubcategory, CreateCategoryPayload } from "@/types";

const QUERY_KEY = ["admin-categories-tree"];

function displayName(cat: { name_en?: string | null; name_es?: string | null; name?: string }) {
  return cat.name_en || cat.name_es || cat.name || "—";
}

export function ServicesCategories() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"none" | "category" | "subcategory">("none");
  const [parentIdForSub, setParentIdForSub] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPayload, setEditPayload] = useState<CreateCategoryPayload>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<boolean>(false);

  const [newNameEn, setNewNameEn] = useState("");
  const [newNameEs, setNewNameEs] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newDescEs, setNewDescEs] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newActive, setNewActive] = useState(true);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCategoriesTree,
  });

  const createCatMutation = useMutation({
    mutationFn: () =>
      createCategory({
        name_en: newNameEn.trim() || undefined,
        name_es: newNameEs.trim() || undefined,
        icon: newIcon.trim() || undefined,
        color: newColor.trim() || undefined,
        description_en: newDescEn.trim() || undefined,
        description_es: newDescEs.trim() || undefined,
        active: newActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setFormMode("none");
      resetNewForm();
    },
  });

  const createSubMutation = useMutation({
    mutationFn: () => {
      if (!parentIdForSub) throw new Error("No parent");
      return createSubcategory(parentIdForSub, {
        name_en: newNameEn.trim() || undefined,
        name_es: newNameEs.trim() || undefined,
        icon: newIcon.trim() || undefined,
        color: newColor.trim() || undefined,
        description_en: newDescEn.trim() || undefined,
        description_es: newDescEs.trim() || undefined,
        active: newActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setFormMode("none");
      setParentIdForSub(null);
      resetNewForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => updateCategoryOrSubcategory(id, editPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditingId(null);
      setEditPayload({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategoryOrSubcategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirmId(null);
      setDeleteConfirmSub(false);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (payload: { categoryIds?: string[]; subcategoryOrders?: Record<string, string[]> }) =>
      reorderCategories(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  function resetNewForm() {
    setNewNameEn("");
    setNewNameEs("");
    setNewDescEn("");
    setNewDescEs("");
    setNewIcon("");
    setNewColor("");
    setNewActive(true);
  }

  function openEdit(cat: ServiceCatalogCategory | ServiceCatalogSubcategory) {
    setEditingId(cat.id);
    setEditPayload({
      name_en: cat.name_en ?? undefined,
      name_es: cat.name_es ?? undefined,
      icon: cat.icon ?? undefined,
      color: cat.color ?? undefined,
      description_en: cat.description_en ?? undefined,
      description_es: cat.description_es ?? undefined,
      active: cat.active,
    });
  }

  function moveCategory(categoryId: string, direction: "up" | "down") {
    const ids = categories.map((c) => c.id);
    const i = ids.indexOf(categoryId);
    if (i === -1) return;
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderMutation.mutate({ categoryIds: ids });
  }

  function moveSubcategory(parentId: string, subcategoryId: string, direction: "up" | "down") {
    const cat = categories.find((c) => c.id === parentId);
    if (!cat?.subcategories?.length) return;
    const ids = cat.subcategories.map((s) => s.id);
    const i = ids.indexOf(subcategoryId);
    if (i === -1) return;
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const subcategoryOrders: Record<string, string[]> = { ...(reorderMutation.variables?.subcategoryOrders ?? {}) };
    subcategoryOrders[parentId] = ids;
    reorderMutation.mutate({
      categoryIds: categories.map((c) => c.id),
      subcategoryOrders: { ...subcategoryOrders },
    });
  }

  const isCreating = formMode === "category" || formMode === "subcategory";
  const createError = createCatMutation.error ?? createSubMutation.error;
  const createPending = createCatMutation.isPending || createSubMutation.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold text-mordobo-text m-0 mb-2">{t("servicesCategories.title")}</h1>
      <p className="text-mordobo-textSecondary text-sm m-0 mb-6">{t("servicesCategories.subtitle")}</p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setFormMode("category");
            setParentIdForSub(null);
            resetNewForm();
          }}
          className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90"
        >
          {t("servicesCategories.addCategory")}
        </button>
      </div>

      {isCreating && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 mb-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">
            {formMode === "subcategory" ? t("servicesCategories.newSubcategory") : t("servicesCategories.newCategory")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("servicesCategories.nameEn")}
              </label>
              <input
                type="text"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("servicesCategories.nameEs")}
              </label>
              <input
                type="text"
                value={newNameEs}
                onChange={(e) => setNewNameEs(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("servicesCategories.descriptionEn")}
              </label>
              <input
                type="text"
                value={newDescEn}
                onChange={(e) => setNewDescEn(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("servicesCategories.descriptionEs")}
              </label>
              <input
                type="text"
                value={newDescEs}
                onChange={(e) => setNewDescEs(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("servicesCategories.icon")}
              </label>
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder={t("servicesCategories.iconPlaceholder")}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("servicesCategories.color")}
              </label>
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder={t("servicesCategories.colorPlaceholder")}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("common.status")}
              </label>
              <select
                value={newActive ? "active" : "inactive"}
                onChange={(e) => setNewActive(e.target.value === "active")}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              >
                <option value="active">{t("common.active")}</option>
                <option value="inactive">{t("common.inactive")}</option>
              </select>
            </div>
          </div>
          {createError && (
            <p className="text-mordobo-danger text-sm mb-4">
              {(createError as Error)?.message ?? t("servicesCategories.createFailed")}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormMode("none");
                setParentIdForSub(null);
                resetNewForm();
              }}
              className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => (formMode === "subcategory" ? createSubMutation.mutate() : createCatMutation.mutate())}
              disabled={createPending}
              className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {createPending ? t("servicesCategories.creating") : t("common.create")}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-mordobo-textMuted text-sm">{t("common.loading")}</p>
      ) : categories.length === 0 ? (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-8 text-center text-mordobo-textSecondary text-sm">
          {t("servicesCategories.noCategories")}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, catIndex) => (
            <div
              key={cat.id}
              className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden"
            >
              <div
                className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-mordobo-surfaceHover/50"
                onClick={() => setExpandedId((id) => (id === cat.id ? null : cat.id))}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-mordobo-textMuted">{expandedId === cat.id ? "▼" : "▶"}</span>
                  {cat.icon && <span className="text-lg">{cat.icon}</span>}
                  <div className="min-w-0">
                    <div className="font-medium text-mordobo-text truncate">{displayName(cat)}</div>
                    <div className="text-xs text-mordobo-textMuted">
                      {t("servicesCategories.providerCount", { count: cat.provider_count ?? 0 })}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      cat.active ? "bg-green-500/20 text-green-700" : "bg-gray-500/20 text-gray-600"
                    }`}
                  >
                    {cat.active ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => moveCategory(cat.id, "up")}
                    disabled={catIndex === 0 || reorderMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-mordobo-surfaceHover text-mordobo-textSecondary disabled:opacity-40"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCategory(cat.id, "down")}
                    disabled={catIndex === categories.length - 1 || reorderMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-mordobo-surfaceHover text-mordobo-textSecondary disabled:opacity-40"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setParentIdForSub(cat.id);
                      setFormMode("subcategory");
                      resetNewForm();
                    }}
                    className="py-1.5 px-3 rounded-lg text-sm font-medium text-mordobo-accentLight hover:bg-mordobo-accentDim"
                  >
                    {t("servicesCategories.addSubcategory")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(cat);
                    }}
                    className="py-1.5 px-3 rounded-lg text-sm font-medium text-mordobo-textSecondary hover:bg-mordobo-surfaceHover"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(cat.id);
                      setDeleteConfirmSub(false);
                    }}
                    className="py-1.5 px-3 rounded-lg text-sm font-medium text-mordobo-danger hover:bg-red-500/10"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>

              {expandedId === cat.id && (
                <div className="border-t border-mordobo-border bg-mordobo-surface/50 p-4 pl-12">
                  {!cat.subcategories?.length ? (
                    <p className="text-mordobo-textMuted text-sm mb-3">{t("servicesCategories.noSubcategories")}</p>
                  ) : (
                    <ul className="space-y-2 mb-3">
                      {cat.subcategories.map((sub, subIndex) => (
                        <li
                          key={sub.id}
                          className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-mordobo-card border border-mordobo-border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {sub.icon && <span>{sub.icon}</span>}
                            <span className="font-medium text-mordobo-text truncate">{displayName(sub)}</span>
                            <span className="text-xs text-mordobo-textMuted">
                              {t("servicesCategories.providerCount", { count: sub.provider_count ?? 0 })}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                sub.active ? "bg-green-500/20 text-green-700" : "bg-gray-500/20 text-gray-600"
                              }`}
                            >
                              {sub.active ? t("common.active") : t("common.inactive")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSubcategory(cat.id, sub.id, "up")}
                              disabled={subIndex === 0 || reorderMutation.isPending}
                              className="p-1 rounded hover:bg-mordobo-surfaceHover text-mordobo-textSecondary disabled:opacity-40"
                              aria-label="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSubcategory(cat.id, sub.id, "down")}
                              disabled={subIndex === (cat.subcategories?.length ?? 0) - 1 || reorderMutation.isPending}
                              className="p-1 rounded hover:bg-mordobo-surfaceHover text-mordobo-textSecondary disabled:opacity-40"
                              aria-label="Move down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(sub)}
                              className="py-1 px-2 rounded text-sm text-mordobo-textSecondary hover:bg-mordobo-surfaceHover"
                            >
                              {t("common.edit")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmId(sub.id);
                                setDeleteConfirmSub(true);
                              }}
                              className="py-1 px-2 rounded text-sm text-mordobo-danger hover:bg-red-500/10"
                            >
                              {t("common.delete")}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId && (
        <EditModal
          editPayload={editPayload}
          setEditPayload={setEditPayload}
          onClose={() => {
            setEditingId(null);
            setEditPayload({});
          }}
          onSave={() => updateMutation.mutate({ id: editingId })}
          isPending={updateMutation.isPending}
          error={updateMutation.error}
          t={t}
        />
      )}

      {deleteConfirmId && (
        <DeleteConfirmModal
          isSubcategory={deleteConfirmSub}
          onConfirm={() => deleteMutation.mutate(deleteConfirmId)}
          onClose={() => {
            setDeleteConfirmId(null);
            setDeleteConfirmSub(false);
          }}
          isPending={deleteMutation.isPending}
          error={deleteMutation.error}
          t={t}
        />
      )}
    </div>
  );
}

function EditModal({
  editPayload,
  setEditPayload,
  onClose,
  onSave,
  isPending,
  error,
  t,
}: {
  editPayload: CreateCategoryPayload;
  setEditPayload: (p: CreateCategoryPayload) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
  error: Error | null;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-mordobo-text mb-4">
          {t("servicesCategories.editCategory")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("servicesCategories.nameEn")}
            </label>
            <input
              type="text"
              value={editPayload.name_en ?? ""}
              onChange={(e) => setEditPayload({ ...editPayload, name_en: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("servicesCategories.nameEs")}
            </label>
            <input
              type="text"
              value={editPayload.name_es ?? ""}
              onChange={(e) => setEditPayload({ ...editPayload, name_es: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("servicesCategories.descriptionEn")}
            </label>
            <input
              type="text"
              value={editPayload.description_en ?? ""}
              onChange={(e) => setEditPayload({ ...editPayload, description_en: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("servicesCategories.descriptionEs")}
            </label>
            <input
              type="text"
              value={editPayload.description_es ?? ""}
              onChange={(e) => setEditPayload({ ...editPayload, description_es: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("servicesCategories.icon")}
            </label>
            <input
              type="text"
              value={editPayload.icon ?? ""}
              onChange={(e) => setEditPayload({ ...editPayload, icon: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("servicesCategories.color")}
            </label>
            <input
              type="text"
              value={editPayload.color ?? ""}
              onChange={(e) => setEditPayload({ ...editPayload, color: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("common.status")}
            </label>
            <select
              value={editPayload.active !== false ? "active" : "inactive"}
              onChange={(e) => setEditPayload({ ...editPayload, active: e.target.value === "active" })}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            >
              <option value="active">{t("common.active")}</option>
              <option value="inactive">{t("common.inactive")}</option>
            </select>
          </div>
        </div>
        {error && (
          <p className="text-mordobo-danger text-sm mb-4">{(error as Error)?.message ?? t("servicesCategories.updateFailed")}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? t("servicesCategories.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  isSubcategory,
  onConfirm,
  onClose,
  isPending,
  error,
  t,
}: {
  isSubcategory: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
  error: Error | null;
  t: (key: string) => string;
}) {
  const title = isSubcategory ? t("servicesCategories.deleteSubcategoryConfirmTitle") : t("servicesCategories.deleteConfirmTitle");
  const message = isSubcategory
    ? t("servicesCategories.deleteSubcategoryConfirmMessage")
    : t("servicesCategories.deleteConfirmMessage");
  const hasProvidersMsg = isSubcategory
    ? t("servicesCategories.cannotDeleteSubcategoryHasProviders")
    : t("servicesCategories.cannotDeleteHasProviders");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-mordobo-text mb-2">{title}</h3>
        <p className="text-mordobo-textSecondary text-sm mb-4">{message}</p>
        {error && (
          <p className="text-mordobo-danger text-sm mb-4">
            {(error as Error)?.message?.includes("active providers") ? hasProvidersMsg : (error as Error)?.message ?? t("servicesCategories.deleteFailed")}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="py-2.5 px-5 bg-mordobo-danger text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
