import type { ReactNode } from "react";

const colorMap = {
  success: { bg: "bg-mordobo-successDim", text: "text-mordobo-success" },
  warning: { bg: "bg-mordobo-warningDim", text: "text-mordobo-warning" },
  danger: { bg: "bg-mordobo-dangerDim", text: "text-mordobo-danger" },
  info: { bg: "bg-mordobo-infoDim", text: "text-mordobo-info" },
  accent: { bg: "bg-mordobo-accentDim", text: "text-mordobo-accentLight" },
} as const;

type BadgeColor = keyof typeof colorMap;

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
}

export function Badge({ color = "accent", children }: BadgeProps) {
  const c = colorMap[color];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${c.bg} ${c.text}`}
    >
      {children}
    </span>
  );
}
