import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminUsersSection } from "./settings/AdminUsersSection";
import { PlatformConfigSection } from "./settings/PlatformConfigSection";
import { EmailTemplatesSection } from "./settings/EmailTemplatesSection";
import { AuditLogSection } from "./settings/AuditLogSection";

const TAB_KEYS = [
  { id: "users", labelKey: "settings.adminUsers", icon: "👥" },
  { id: "platform", labelKey: "settings.platformConfig", icon: "⚙️" },
  { id: "emails", labelKey: "settings.emailTemplates", icon: "📧" },
  { id: "audit", labelKey: "settings.auditLog", icon: "📋" },
] as const;

type TabId = (typeof TAB_KEYS)[number]["id"];

export function SystemSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div>
      <h1 className="text-2xl font-bold text-mordobo-text m-0 mb-6">{t("settings.title")}</h1>
      <p className="text-mordobo-textSecondary text-sm m-0 mb-6">
        {t("settings.subtitle")}
      </p>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-mordobo-border pb-4">
        {TAB_KEYS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors ${
              activeTab === tab.id
                ? "bg-mordobo-accentDim border-mordobo-accent/25 text-mordobo-accentLight"
                : "bg-transparent border-mordobo-border text-mordobo-textSecondary hover:bg-mordobo-surfaceHover hover:text-mordobo-text"
            }`}
          >
            <span>{tab.icon}</span>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === "users" && <AdminUsersSection />}
      {activeTab === "platform" && <PlatformConfigSection />}
      {activeTab === "emails" && <EmailTemplatesSection />}
      {activeTab === "audit" && <AuditLogSection />}
    </div>
  );
}
