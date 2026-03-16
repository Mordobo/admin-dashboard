import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import { Badge } from "@/components/Badge";
import {
  listFaqs,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  createFaqQuestion,
  updateFaqQuestion,
  deleteFaqQuestion,
  createFaqAnswer,
  updateFaqAnswer,
  deleteFaqAnswer,
} from "@/services/contentService";
import type { ContentStatus } from "@/types";

/** Prefer API error message (e.g. schema_not_migrated) over generic axios message. */
function getApiErrorMessage(error: unknown): string {
  const ax = error as AxiosError<{ message?: string; detail?: string; hint?: string }>;
  const msg = ax.response?.data?.message ?? ax.response?.data?.detail;
  const hint = ax.response?.data?.hint;
  if (msg && hint) return `${msg} ${hint}`;
  if (msg) return msg;
  return (error as Error)?.message ?? "Failed to create category";
}

const STATUS_OPTIONS: ContentStatus[] = ["draft", "published"];
const STATUS_LABELS: Record<ContentStatus, string> = { draft: "Draft", published: "Published" };
const STATUS_COLORS: Record<ContentStatus, "warning" | "success"> = { draft: "warning", published: "success" };

export function FaqsSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newCategoryTitleEn, setNewCategoryTitleEn] = useState("");
  const [newCategoryTitleEs, setNewCategoryTitleEs] = useState("");
  const [newCategoryStatus, setNewCategoryStatus] = useState<ContentStatus>("draft");
  const [editCategoryTitleEn, setEditCategoryTitleEn] = useState("");
  const [editCategoryTitleEs, setEditCategoryTitleEs] = useState("");
  const [editCategoryStatus, setEditCategoryStatus] = useState<ContentStatus>("draft");
  const [addingQuestionCategoryId, setAddingQuestionCategoryId] = useState<string | null>(null);
  const [newQuestionEn, setNewQuestionEn] = useState("");
  const [newQuestionEs, setNewQuestionEs] = useState("");
  const [newQuestionStatus, setNewQuestionStatus] = useState<ContentStatus>("draft");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionEn, setEditQuestionEn] = useState("");
  const [editQuestionEs, setEditQuestionEs] = useState("");
  const [editQuestionStatus, setEditQuestionStatus] = useState<ContentStatus>("draft");
  const [addingAnswerQuestionId, setAddingAnswerQuestionId] = useState<string | null>(null);
  const [newAnswerEn, setNewAnswerEn] = useState("");
  const [newAnswerEs, setNewAnswerEs] = useState("");
  const [newAnswerStatus, setNewAnswerStatus] = useState<ContentStatus>("draft");
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerEn, setEditAnswerEn] = useState("");
  const [editAnswerEs, setEditAnswerEs] = useState("");
  const [editAnswerStatus, setEditAnswerStatus] = useState<ContentStatus>("draft");

  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ["content-faqs"],
    queryFn: listFaqs,
  });

  const createCategoryMutation = useMutation({
    mutationFn: () =>
      createFaqCategory({
        title_en: newCategoryTitleEn.trim() || undefined,
        title_es: newCategoryTitleEs.trim() || undefined,
        status: newCategoryStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-faqs"] });
      setCategoryFormOpen(false);
      setNewCategoryTitleEn("");
      setNewCategoryTitleEs("");
      setNewCategoryStatus("draft");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      updateFaqCategory(id, {
        title_en: editCategoryTitleEn.trim() || undefined,
        title_es: editCategoryTitleEs.trim() || undefined,
        status: editCategoryStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-faqs"] });
      setEditingCategoryId(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteFaqCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content-faqs"] }),
  });

  const createQuestionMutation = useMutation({
    mutationFn: ({ categoryId }: { categoryId: string }) =>
      createFaqQuestion(categoryId, {
        question_en: newQuestionEn.trim() || undefined,
        question_es: newQuestionEs.trim() || undefined,
        status: newQuestionStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-faqs"] });
      setAddingQuestionCategoryId(null);
      setNewQuestionEn("");
      setNewQuestionEs("");
      setNewQuestionStatus("draft");
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ categoryId, questionId }: { categoryId: string; questionId: string }) =>
      updateFaqQuestion(categoryId, questionId, {
        question_en: editQuestionEn.trim() || undefined,
        question_es: editQuestionEs.trim() || undefined,
        status: editQuestionStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-faqs"] });
      setEditingQuestionId(null);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: ({ categoryId, questionId }: { categoryId: string; questionId: string }) =>
      deleteFaqQuestion(categoryId, questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content-faqs"] }),
  });

  const createAnswerMutation = useMutation({
    mutationFn: ({ categoryId, questionId }: { categoryId: string; questionId: string }) =>
      createFaqAnswer(categoryId, questionId, {
        answer_en: newAnswerEn.trim() || undefined,
        answer_es: newAnswerEs.trim() || undefined,
        status: newAnswerStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-faqs"] });
      setAddingAnswerQuestionId(null);
      setNewAnswerEn("");
      setNewAnswerEs("");
      setNewAnswerStatus("draft");
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: ({
      categoryId,
      questionId,
      answerId,
    }: {
      categoryId: string;
      questionId: string;
      answerId: string;
    }) =>
      updateFaqAnswer(categoryId, questionId, answerId, {
        answer_en: editAnswerEn.trim() || undefined,
        answer_es: editAnswerEs.trim() || undefined,
        status: editAnswerStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-faqs"] });
      setEditingAnswerId(null);
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: ({
      categoryId,
      questionId,
      answerId,
    }: {
      categoryId: string;
      questionId: string;
      answerId: string;
    }) => deleteFaqAnswer(categoryId, questionId, answerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content-faqs"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        {t("content.faqsLoading")}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[14px] border border-mordobo-border bg-mordobo-card p-6 text-center">
        <p className="text-mordobo-danger text-sm mb-2">{t("content.faqsLoadError")}</p>
        <p className="text-mordobo-textMuted text-xs">
          {(error as Error)?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-mordobo-text m-0">{t("content.faqs")}</h2>
        <button
          type="button"
          onClick={() => setCategoryFormOpen(true)}
          className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90"
        >
          {t("content.addCategory")}
        </button>
      </div>
      <p className="text-mordobo-textMuted text-sm mb-2">{t("content.faqsPublishHint")}</p>

      {categoryFormOpen && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">{t("content.newFaqCategory")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Title (EN)
              </label>
              <input
                type="text"
                value={newCategoryTitleEn}
                onChange={(e) => setNewCategoryTitleEn(e.target.value)}
                placeholder="Category title"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Title (ES)
              </label>
              <input
                type="text"
                value={newCategoryTitleEs}
                onChange={(e) => setNewCategoryTitleEs(e.target.value)}
                placeholder="Título de categoría"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={newCategoryStatus}
                onChange={(e) => setNewCategoryStatus(e.target.value as ContentStatus)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {createCategoryMutation.isError && (
            <p className="text-mordobo-danger text-sm mb-4">
              {getApiErrorMessage(createCategoryMutation.error)}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCategoryFormOpen(false)}
              className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => createCategoryMutation.mutate()}
              disabled={createCategoryMutation.isPending}
              className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {createCategoryMutation.isPending ? "Creating…" : "Create category"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden"
          >
            <div
              className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-mordobo-surfaceHover/50"
              onClick={() =>
                setExpandedCategoryId((id) => (id === cat.id ? null : cat.id))
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-mordobo-textMuted">
                  {expandedCategoryId === cat.id ? "▼" : "▶"}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-mordobo-text truncate">
                    {cat.title_en || cat.title_es || "Untitled category"}
                  </div>
                  <div className="text-xs text-mordobo-textMuted">
                    {(cat.questions?.length ?? 0)} question(s)
                    {(cat.status === "published" &&
                      (cat.questions ?? []).filter((q) => q.status === "published").length === 0 &&
                      (cat.questions?.length ?? 0) > 0) && (
                      <span className="block text-mordobo-warning mt-0.5">
                        {t("content.faqsNoPublishedQuestions")}
                      </span>
                    )}
                  </div>
                </div>
                <Badge color={STATUS_COLORS[cat.status ?? "draft"]}>
                  {STATUS_LABELS[(cat.status as ContentStatus) ?? "draft"]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {editingCategoryId === cat.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        updateCategoryMutation.mutate({ id: cat.id })
                      }
                      disabled={updateCategoryMutation.isPending}
                      className="text-mordobo-accentLight text-sm hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategoryId(null)}
                      className="text-mordobo-textMuted text-sm hover:underline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setEditCategoryTitleEn(cat.title_en ?? "");
                        setEditCategoryTitleEs(cat.title_es ?? "");
                        setEditCategoryStatus((cat.status as ContentStatus) ?? "draft");
                      }}
                      className="text-mordobo-accentLight text-sm hover:underline"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      disabled={deleteCategoryMutation.isPending}
                      className="text-mordobo-danger text-sm hover:underline disabled:opacity-50"
                    >
                      {t("common.delete")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingCategoryId === cat.id && (
              <div className="px-4 pb-4 pt-0 border-t border-mordobo-border mt-0 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                      Title (EN)
                    </label>
                    <input
                      type="text"
                      value={editCategoryTitleEn}
                      onChange={(e) => setEditCategoryTitleEn(e.target.value)}
                      className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                      Title (ES)
                    </label>
                    <input
                      type="text"
                      value={editCategoryTitleEs}
                      onChange={(e) => setEditCategoryTitleEs(e.target.value)}
                      className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={editCategoryStatus}
                      onChange={(e) => setEditCategoryStatus(e.target.value as ContentStatus)}
                      className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {expandedCategoryId === cat.id && (
              <div className="border-t border-mordobo-border bg-mordobo-surface/30 p-4 space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingQuestionCategoryId(cat.id);
                      setNewQuestionEn("");
                      setNewQuestionEs("");
                    }}
                    className="py-2 px-4 bg-mordobo-accentDim border border-mordobo-accent/25 text-mordobo-accentLight rounded-xl text-sm font-medium hover:opacity-90"
                  >
                    {t("content.addQuestion")}
                  </button>
                </div>

                {addingQuestionCategoryId === cat.id && (
                  <div className="bg-mordobo-card border border-mordobo-border rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                          Question (EN)
                        </label>
                        <input
                          type="text"
                          value={newQuestionEn}
                          onChange={(e) => setNewQuestionEn(e.target.value)}
                          placeholder="Question text"
                          className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                          Question (ES)
                        </label>
                        <input
                          type="text"
                          value={newQuestionEs}
                          onChange={(e) => setNewQuestionEs(e.target.value)}
                          placeholder="Texto de la pregunta"
                          className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                          Status
                        </label>
                        <select
                          value={newQuestionStatus}
                          onChange={(e) => setNewQuestionStatus(e.target.value as ContentStatus)}
                          className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAddingQuestionCategoryId(null)}
                        className="py-2 px-4 border border-mordobo-border rounded-xl text-sm text-mordobo-textSecondary hover:bg-mordobo-surfaceHover"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => createQuestionMutation.mutate({ categoryId: cat.id })}
                        disabled={createQuestionMutation.isPending}
                        className="py-2 px-4 bg-mordobo-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {createQuestionMutation.isPending ? t("content.adding") : t("content.addQuestion")}
                      </button>
                    </div>
                  </div>
                )}

                {(cat.questions ?? []).map((q) => (
                  <div key={q.id} className="border border-mordobo-border rounded-xl p-4 space-y-3">
                    {editingQuestionId === q.id ? (
                      <>
                        <input
                          type="text"
                          value={editQuestionEn}
                          onChange={(e) => setEditQuestionEn(e.target.value)}
                          placeholder="Question (EN)"
                          className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={editQuestionEs}
                          onChange={(e) => setEditQuestionEs(e.target.value)}
                          placeholder="Question (ES)"
                          className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                        />
                        <div>
                          <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">Status</label>
                          <select
                            value={editQuestionStatus}
                            onChange={(e) => setEditQuestionStatus(e.target.value as ContentStatus)}
                            className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestionMutation.mutate({
                                categoryId: cat.id,
                                questionId: q.id,
                              })
                            }
                            disabled={updateQuestionMutation.isPending}
                            className="text-mordobo-accentLight text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingQuestionId(null)}
                            className="text-mordobo-textMuted text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-mordobo-text m-0">
                              {q.question_en || q.question_es || "Untitled question"}
                            </p>
                            <span className="mt-1 inline-block">
                              <Badge color={STATUS_COLORS[(q.status as ContentStatus) ?? "draft"]}>
                                {STATUS_LABELS[(q.status as ContentStatus) ?? "draft"]}
                              </Badge>
                            </span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(q.id);
                                setEditQuestionEn(q.question_en ?? "");
                                setEditQuestionEs(q.question_es ?? "");
                                setEditQuestionStatus((q.status as ContentStatus) ?? "draft");
                              }}
                              className="text-mordobo-accentLight text-xs hover:underline"
                            >
                              {t("common.edit")}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteQuestionMutation.mutate({
                                  categoryId: cat.id,
                                  questionId: q.id,
                                })
                              }
                              disabled={deleteQuestionMutation.isPending}
                              className="text-mordobo-danger text-xs hover:underline"
                            >
                              {t("common.delete")}
                            </button>
                          </div>
                        </div>
                        <div className="pl-3 border-l-2 border-mordobo-border space-y-2">
                          {(q.answers ?? []).map((ans) => (
                            <div key={ans.id} className="flex items-start justify-between gap-2">
                              {editingAnswerId === ans.id ? (
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={editAnswerEn}
                                    onChange={(e) => setEditAnswerEn(e.target.value)}
                                    placeholder="Answer (EN)"
                                    className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={editAnswerEs}
                                    onChange={(e) => setEditAnswerEs(e.target.value)}
                                    placeholder="Answer (ES)"
                                    className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                                  />
                                  <div>
                                    <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">Status</label>
                                    <select
                                      value={editAnswerStatus}
                                      onChange={(e) => setEditAnswerStatus(e.target.value as ContentStatus)}
                                      className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                                    >
                                      {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                          {STATUS_LABELS[s]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateAnswerMutation.mutate({
                                          categoryId: cat.id,
                                          questionId: q.id,
                                          answerId: ans.id,
                                        })
                                      }
                                      disabled={updateAnswerMutation.isPending}
                                      className="text-mordobo-accentLight text-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingAnswerId(null)}
                                      className="text-mordobo-textMuted text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-mordobo-textSecondary text-sm m-0">
                                    {ans.answer_en || ans.answer_es || "No answer"}
                                  </p>
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAnswerId(ans.id);
                                        setEditAnswerEn(ans.answer_en ?? "");
                                        setEditAnswerEs(ans.answer_es ?? "");
                                        setEditAnswerStatus((ans.status as ContentStatus) ?? "draft");
                                      }}
                                      className="text-mordobo-accentLight text-xs"
                                    >
                                      {t("common.edit")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteAnswerMutation.mutate({
                                          categoryId: cat.id,
                                          questionId: q.id,
                                          answerId: ans.id,
                                        })
                                      }
                                      className="text-mordobo-danger text-xs"
                                    >
                                      {t("common.delete")}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          {addingAnswerQuestionId === q.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={newAnswerEn}
                                onChange={(e) => setNewAnswerEn(e.target.value)}
                                placeholder="Answer (EN)"
                                className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                              />
                              <input
                                type="text"
                                value={newAnswerEs}
                                onChange={(e) => setNewAnswerEs(e.target.value)}
                                placeholder="Answer (ES)"
                                className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                              />
                              <div>
                                <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1">Status</label>
                                <select
                                  value={newAnswerStatus}
                                  onChange={(e) => setNewAnswerStatus(e.target.value as ContentStatus)}
                                  className="w-full py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-sm"
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                      {STATUS_LABELS[s]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    createAnswerMutation.mutate({
                                      categoryId: cat.id,
                                      questionId: q.id,
                                    })
                                  }
                                  disabled={createAnswerMutation.isPending}
                                  className="text-mordobo-accentLight text-sm"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingAnswerQuestionId(null)}
                                  className="text-mordobo-textMuted text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingAnswerQuestionId(q.id)}
                              className="text-mordobo-textMuted text-xs hover:underline"
                            >
                              + Add answer
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] py-12 text-center text-mordobo-textSecondary text-sm">
            {t("content.faqsEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}
