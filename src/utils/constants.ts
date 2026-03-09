export const NAV_ITEMS = [
  { id: "dashboard", path: "/", icon: "📊", label: "Dashboard" },
  { id: "onboarding", path: "/onboarding", icon: "📋", label: "Provider Onboarding" },
  { id: "complaints", path: "/complaints", icon: "📨", label: "Complaints & Suggestions" },
  { id: "users", path: "/users", icon: "👥", label: "Users Management" },
  { id: "providers", path: "/providers", icon: "🔧", label: "Providers Management" },
  { id: "services", path: "/services", icon: "🏷️", label: "Services & Categories" },
  { id: "transactions", path: "/transactions", icon: "💳", label: "Transactions" },
  { id: "reports", path: "/reports", icon: "📈", label: "Reports & Analytics" },
  { id: "content", path: "/content", icon: "📝", label: "Content Management" },
  { id: "settings", path: "/settings", icon: "⚙️", label: "System Settings" },
] as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "mordobo_backoffice_access_token",
  REFRESH_TOKEN: "mordobo_backoffice_refresh_token",
  USER: "mordobo_backoffice_user",
  ROLE: "mordobo_backoffice_role",
} as const;
