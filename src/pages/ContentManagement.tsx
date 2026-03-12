import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaqsSection } from "./content/FaqsSection";
import { LegalSection } from "./content/LegalSection";
import { NotificationsSection } from "./content/NotificationsSection";
import { BannersSection } from "./content/BannersSection";

const TAB_IDS = ["faqs", "legal", "notifications", "banners"] as const;
const TAB_ICONS: Record<(typeof TAB_IDS)[number], string> = {
  faqs: "❓",
  legal: "📜",
  notifications: "🔔",
  banners: "🖼️",
};

type TabId = (typeof TAB_IDS)[number];

export function ContentManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("faqs");

  return (
    <div>
      <h1 className="text-2xl font-bold text-mordobo-text m-0 mb-6">{t("content.title")}</h1>
      <p className="text-mordobo-textSecondary text-sm m-0 mb-6">{t("content.subtitle")}</p>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-mordobo-border pb-4">
        {TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors ${
              activeTab === tabId
                ? "bg-mordobo-accentDim border-mordobo-accent/25 text-mordobo-accentLight"
                : "bg-transparent border-mordobo-border text-mordobo-textSecondary hover:bg-mordobo-surfaceHover hover:text-mordobo-text"
            }`}
          >
            <span>{TAB_ICONS[tabId]}</span>
            {t(`content.${tabId}`)}
          </button>
        ))}
      </div>

      {activeTab === "faqs" && <FaqsSection />}
      {activeTab === "legal" && <LegalSection />}
      {activeTab === "notifications" && <NotificationsSection />}
      {activeTab === "banners" && <BannersSection />}
    </div>
  );
}
