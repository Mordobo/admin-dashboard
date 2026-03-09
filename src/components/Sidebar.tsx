import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NAV_ITEMS } from "@/utils/constants";
import { useState } from "react";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
  };
  return labels[role] ?? "Admin";
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const { auth } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const user = auth.user;
  const displayName = user?.full_name ?? "Admin";
  const role = roleLabel(auth.role);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        style={{ display: open ? "block" : "none" }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 flex flex-col flex-shrink-0 bg-mordobo-surface border-r border-mordobo-border transition-[transform,width] duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[72px]" : "w-[260px]"}`}
      >
      <div className="p-5 border-b border-mordobo-border flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-mordobo-surfaceHover text-mordobo-textSecondary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mordobo-accent to-purple-500 flex items-center justify-center text-base font-bold text-white shrink-0">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-base font-bold text-mordobo-text tracking-tight">Mordobo</div>
              <div className="text-[10px] text-mordobo-textMuted uppercase tracking-widest">Backoffice</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 w-full py-2.5 px-3.5 rounded-xl text-sm font-normal text-left mb-0.5 transition-all duration-150 ${
                isActive
                  ? "bg-mordobo-accentDim border border-mordobo-accent/25 font-semibold text-mordobo-accentLight"
                  : "text-mordobo-textSecondary hover:bg-mordobo-surfaceHover/50 border border-transparent"
              }`
            }
            end={item.path === "/"}
          >
            <span className="text-base shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && user && (
        <div className="p-4 border-t border-mordobo-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mordobo-accentDim flex items-center justify-center text-sm font-semibold text-mordobo-accentLight shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-mordobo-text truncate">{displayName}</div>
              <div className="text-xs text-mordobo-textMuted">{role}</div>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
