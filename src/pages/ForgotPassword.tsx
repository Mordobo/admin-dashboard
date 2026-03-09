import { Link } from "react-router-dom";

export function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mordobo-bg p-4">
      <div className="bg-mordobo-card border border-mordobo-border rounded-2xl p-8 text-center max-w-md">
        <h2 className="text-lg font-semibold text-mordobo-text mb-2">Forgot password</h2>
        <p className="text-mordobo-textSecondary text-sm mb-4">
          This flow will be implemented in a future sprint. Contact your administrator to reset your password.
        </p>
        <Link to="/login" className="text-mordobo-accentLight hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
