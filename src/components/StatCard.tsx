import type { ReactNode } from "react";

type Color = "accent" | "success" | "warning" | "danger" | "info";

const colorBg: Record<Color, string> = {
  accent: "bg-mordobo-accentDim",
  success: "bg-mordobo-successDim",
  warning: "bg-mordobo-warningDim",
  danger: "bg-mordobo-dangerDim",
  info: "bg-mordobo-infoDim",
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  color?: Color;
}

export function StatCard({ icon, label, value, change, color = "accent" }: StatCardProps) {
  return (
    <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 flex-1 min-w-[200px]">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl ${colorBg[color]} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        {change != null && (
          <span className={`text-xs font-semibold ${change > 0 ? "text-mordobo-success" : "text-mordobo-danger"}`}>
            {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-[28px] font-bold text-mordobo-text font-sans mb-1">{value}</div>
      <div className="text-[13px] text-mordobo-textSecondary">{label}</div>
    </div>
  );
}
