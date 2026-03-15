import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { BackofficeAccessDeniedError } from "@/hooks/useAuth";
import type { Login2FAPayload } from "@/hooks/useAuth";

export function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step2FA, setStep2FA] = useState<Login2FAPayload | null>(null);
  const [code2FA, setCode2FA] = useState("");
  const { login, completeLoginWith2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const needs2FA = await login(email, password);
      if (needs2FA) {
        setStep2FA(needs2FA);
        setCode2FA("");
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof BackofficeAccessDeniedError) {
        setError(err.message);
        return;
      }
      const ax = err as { response?: { data?: { message?: string; code?: string } } };
      const msg = ax?.response?.data?.message ?? (ax?.response?.data?.code === "invalid_credentials" ? t("login.invalidCredentials") : null);
      setError(msg || t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!step2FA) return;
    setError("");
    setLoading(true);
    try {
      await completeLoginWith2FA(step2FA.twoFaToken, code2FA.trim());
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof BackofficeAccessDeniedError) {
        setError(err.message);
        return;
      }
      const ax = err as { response?: { data?: { message?: string; code?: string } } };
      const msg = ax?.response?.data?.message ?? (ax?.response?.data?.code === "invalid_code" ? t("login.invalidCode") : null);
      setError(msg || t("login.invalidCode"));
    } finally {
      setLoading(false);
    }
  }

  function handleBackToPassword() {
    setStep2FA(null);
    setCode2FA("");
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mordobo-bg p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mordobo-accent to-purple-500 flex items-center justify-center text-xl font-bold text-white">
            M
          </div>
          <div>
            <div className="text-xl font-bold text-mordobo-text tracking-tight">Mordobo</div>
            <div className="text-xs text-mordobo-textMuted uppercase tracking-widest">Backoffice</div>
          </div>
        </div>

        <div className="bg-mordobo-card border border-mordobo-border rounded-2xl p-8">
          {step2FA ? (
            <>
              <h2 className="text-lg font-semibold text-mordobo-text mb-2">{t("login.twoFactorTitle")}</h2>
              <p className="text-sm text-mordobo-textSecondary mb-6">
                {t("login.twoFactorDescription", { email: step2FA.email })}
              </p>
              <form onSubmit={handleSubmit2FA} className="space-y-4">
                <div>
                  <label htmlFor="code2fa" className="block text-sm font-medium text-mordobo-textSecondary mb-1.5">
                    {t("login.code")}
                  </label>
                  <input
                    id="code2fa"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t("login.codePlaceholder")}
                    maxLength={6}
                    className="w-full px-4 py-2.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-center text-lg tracking-widest placeholder:text-mordobo-textMuted focus:outline-none focus:ring-2 focus:ring-mordobo-accent/50"
                  />
                </div>
                {error && (
                  <p className="text-sm text-mordobo-danger" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBackToPassword}
                    className="flex-1 py-3 px-4 bg-mordobo-surface border border-mordobo-border text-mordobo-text rounded-xl font-semibold hover:bg-mordobo-surfaceHover"
                  >
                    {t("login.back")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || code2FA.length !== 6}
                    className="flex-1 py-3 px-4 bg-mordobo-accent hover:bg-mordobo-accentLight text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t("login.verifying") : t("login.verify")}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-mordobo-text mb-6">{t("login.signIn")}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-mordobo-textSecondary mb-1.5">
                    {t("login.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text placeholder:text-mordobo-textMuted focus:outline-none focus:ring-2 focus:ring-mordobo-accent/50"
                    placeholder="admin@mordobo.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-mordobo-textSecondary mb-1.5">
                    {t("login.password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text placeholder:text-mordobo-textMuted focus:outline-none focus:ring-2 focus:ring-mordobo-accent/50"
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <p className="text-sm text-mordobo-danger" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-mordobo-accentLight hover:underline">
                    {t("login.forgotPassword")}
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-mordobo-accent hover:bg-mordobo-accentLight text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("login.signingIn") : t("login.signIn")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
