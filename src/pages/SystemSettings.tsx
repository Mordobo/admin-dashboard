import { useState } from "react";
import { AdminUsersSection } from "./settings/AdminUsersSection";
import { PlatformConfigSection } from "./settings/PlatformConfigSection";
import { EmailTemplatesSection } from "./settings/EmailTemplatesSection";
import { AuditLogSection } from "./settings/AuditLogSection";

const TABS = [
  { id: "users", label: "Admin Users", icon: "👥" },
  { id: "platform", label: "Platform Config", icon: "⚙️" },
  { id: "emails", label: "Email Templates", icon: "📧" },
  { id: "audit", label: "Audit Log", icon: "📋" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div>
      <h1 className="text-2xl font-bold text-mordobo-text m-0 mb-6">System Settings</h1>
      <p className="text-mordobo-textSecondary text-sm m-0 mb-6">
        Platform configuration, admin user management, email templates, and audit log.
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

      {activeTab === "users" && <AdminUsersSection />}
      {activeTab === "platform" && <PlatformConfigSection />}
      {activeTab === "emails" && <EmailTemplatesSection />}
      {activeTab === "audit" && <AuditLogSection />}
    </div>
  );
}
