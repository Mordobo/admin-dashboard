import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { NAV_ITEMS } from "@/utils/constants";
import { useState } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { logout } = useAuth();
  const [notificationsCount] = useState(0);

  const lng = (i18n.resolvedLanguage ?? i18n.language ?? "en").toLowerCase();
  const esActive = lng.startsWith("es");
  const handleLanguageSelect = (lng: "en" | "es") => {
    void i18n.changeLanguage(lng);
  };

  const current = NAV_ITEMS.find((n) => n.path === location.pathname || (n.path !== "/" && location.pathname.startsWith(n.path)));
  const title = current ? `${current.icon} ${t(`nav.${current.id}`)}` : `Mordobo ${t("nav.backoffice")}`;

  return (
    <header className="sticky top-0 z-10 flex justify-between items-center gap-4 px-4 md:px-8 py-4 border-b border-mordobo-border bg-mordobo-surface">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-mordobo-bg/50 text-mordobo-text"
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="m-0 text-lg md:text-[22px] font-bold text-mordobo-text tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center gap-4">
          <button type="button" className="relative p-1 rounded hover:bg-mordobo-bg/50" aria-label="Notifications">
            <span className="text-xl">🔔</span>
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-mordobo-danger flex items-center justify-center text-[9px] font-bold text-white">
              {notificationsCount}
            </span>
          </button>
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border border-mordobo-border overflow-hidden">
            <button
              type="button"
              onClick={() => handleLanguageSelect("en")}
              className={`text-xs font-medium px-2 py-1 transition-colors ${
                !esActive
                  ? "bg-mordobo-accent text-white"
                  : "text-mordobo-textMuted hover:text-mordobo-text"
              }`}
              title={t("nav.switchToEn")}
              aria-label={t("nav.switchToEn")}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSelect("es")}
              className={`text-xs font-medium px-2 py-1 transition-colors ${
                esActive
                  ? "bg-mordobo-accent text-white"
                  : "text-mordobo-textMuted hover:text-mordobo-text"
              }`}
              title={t("nav.switchToEs")}
              aria-label={t("nav.switchToEs")}
            >
              ES
            </button>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-mordobo-textSecondary hover:text-mordobo-text px-2 py-1 rounded"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
