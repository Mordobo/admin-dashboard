import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function ForgotPassword() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-mordobo-bg p-4">
      <div className="bg-mordobo-card border border-mordobo-border rounded-2xl p-8 text-center max-w-md">
        <h2 className="text-lg font-semibold text-mordobo-text mb-2">{t("forgotPassword.title")}</h2>
        <p className="text-mordobo-textSecondary text-sm mb-4">
          {t("forgotPassword.message")}
        </p>
        <Link to="/login" className="text-mordobo-accentLight hover:underline">
          {t("forgotPassword.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
