import { useState } from "react";
import { FaqsSection } from "./content/FaqsSection";
import { LegalSection } from "./content/LegalSection";
import { NotificationsSection } from "./content/NotificationsSection";
import { BannersSection } from "./content/BannersSection";

const TABS = [
  { id: "faqs", label: "FAQs", icon: "❓" },
  { id: "legal", label: "Legal Documents", icon: "📜" },
  { id: "notifications", label: "Push Notifications", icon: "🔔" },
  { id: "banners", label: "Banners & Promotions", icon: "🖼️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ContentManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("faqs");

  return (
    <div>
      <h1 className="text-2xl font-bold text-mordobo-text m-0 mb-6">Content Management</h1>
      <p className="text-mordobo-textSecondary text-sm m-0 mb-6">
        Manage FAQs, legal documents, push notifications, and app banners. Content supports EN/ES.
      </p>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-mordobo-border pb-4">
        {TABS.map((tab) => (
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
            {tab.label}
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
