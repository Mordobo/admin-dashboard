import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { i18n } = useTranslation();
  const langKey = (i18n.resolvedLanguage ?? i18n.language ?? "en").toLowerCase();
  return (
    <div className="flex h-screen bg-mordobo-bg text-mordobo-text overflow-hidden">
      <Sidebar key={langKey} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet key={langKey} />
        </main>
      </div>
    </div>
  );
}
