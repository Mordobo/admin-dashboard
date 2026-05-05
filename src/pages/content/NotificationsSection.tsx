import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { sendNotification, getNotificationHistory } from "@/services/contentService";
import type { SendNotificationRequest } from "@/types";

const TARGET_VALUES: SendNotificationRequest["target"][] = ["all", "clients", "providers", "user"];

const TARGET_I18N_KEY: Record<SendNotificationRequest["target"], string> = {
  all: "content.pushTargetAll",
  clients: "content.pushTargetClients",
  providers: "content.pushTargetProviders",
  user: "content.pushTargetUser",
};

function historyTargetLabel(t: (key: string) => string, target: string): string {
  const key = TARGET_I18N_KEY[target as SendNotificationRequest["target"]];
  return key ? t(key) : target;
}

export function NotificationsSection() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<SendNotificationRequest["target"]>("all");
  const [userId, setUserId] = useState("");
  const [lastRecipientsCount, setLastRecipientsCount] = useState<number | null>(null);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["content-notifications-history"],
    queryFn: () => getNotificationHistory({ limit: 50, offset: 0 }),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: SendNotificationRequest) => sendNotification(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["content-notifications-history"] });
      setTitle("");
      setBody("");
      setUserId("");
      setLastRecipientsCount(data?.recipientsCount ?? null);
    },
  });

  const handleSend = () => {
    const payload: SendNotificationRequest = {
      title: title.trim(),
      body: body.trim() || undefined,
      target,
      ...(target === "user" && userId.trim() ? { user_id: userId.trim() } : {}),
    };
    if (!payload.title) return;
    sendMutation.mutate(payload);
  };

  const items = historyData?.items ?? [];
  const total = historyData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-mordobo-text m-0">{t("content.pushTitle")}</h2>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <h3 className="text-base font-semibold text-mordobo-text mb-4 m-0">{t("content.pushCompose")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("content.pushFieldTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setLastRecipientsCount(null);
              }}
              placeholder={t("content.pushTitlePlaceholder")}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("content.pushFieldBody")}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("content.pushBodyPlaceholder")}
              rows={3}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm resize-y"
            />
          </div>
          <div>
            <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
              {t("content.pushFieldTarget")}
            </label>
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as SendNotificationRequest["target"]);
                setLastRecipientsCount(null);
              }}
              className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
            >
              {TARGET_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t(TARGET_I18N_KEY[v])}
                </option>
              ))}
            </select>
          </div>
          {target === "user" && (
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">
                {t("content.pushFieldUserId")}
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={t("content.pushUserIdPlaceholder")}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
          )}
        </div>
        {lastRecipientsCount !== null && !sendMutation.isError && (
          <p className="text-emerald-500 dark:text-emerald-400 text-sm mb-4">
            {t("content.pushSentTo", { count: lastRecipientsCount })}
          </p>
        )}
        {sendMutation.isError && (
          <p className="text-mordobo-danger text-sm mb-4">
            {(sendMutation.error as Error)?.message ?? t("content.pushSendFailed")}
          </p>
        )}
        <button
          type="button"
          onClick={handleSend}
          disabled={sendMutation.isPending || !title.trim()}
          className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          {sendMutation.isPending ? t("content.pushSending") : t("content.pushSend")}
        </button>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <h3 className="text-base font-semibold text-mordobo-text p-4 border-b border-mordobo-border m-0">
          {t("content.pushHistoryTitle", { total })}
        </h3>
        {isLoading ? (
          <div className="py-8 text-center text-mordobo-textSecondary text-sm">
            {t("content.pushHistoryLoading")}
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-mordobo-textSecondary text-sm">
            {t("content.pushHistoryEmpty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-mordobo-border">
                  <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                    {t("content.pushColTitle")}
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                    {t("content.pushColTarget")}
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">
                    {t("content.pushColSentAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => (
                  <tr key={entry.id} className="border-b border-mordobo-border last:border-0">
                    <td className="py-3 px-4">
                      <div className="font-medium text-mordobo-text">{entry.title}</div>
                      {entry.body && (
                        <div className="text-xs text-mordobo-textMuted truncate max-w-[200px]">
                          {entry.body}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-mordobo-textSecondary">
                      {historyTargetLabel(t, entry.target)}
                    </td>
                    <td className="py-3 px-4 text-sm text-mordobo-textSecondary">
                      {new Date(entry.sent_at).toLocaleString(i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
