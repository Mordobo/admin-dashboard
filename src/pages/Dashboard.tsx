import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { fetchDashboardStats, listOnboardingRequests, listComplaints } from "@/services/adminService";
import type { OnboardingRequest, Complaint } from "@/types";

export function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60_000,
  });
  const { data: onboardingList = [] } = useQuery({
    queryKey: ["admin-onboarding", "recent"],
    queryFn: () => listOnboardingRequests(),
    staleTime: 60_000,
  });
  const { data: complaintsList = [] } = useQuery({
    queryKey: ["admin-complaints", "recent"],
    queryFn: () => listComplaints(),
    staleTime: 60_000,
  });

  const s = stats ?? { pendingOnboarding: 0, openComplaints: 0, activeUsers: 0, activeProviders: 0 };
  const recentOnboarding = (onboardingList as OnboardingRequest[]).slice(0, 4);
  const recentComplaints = (complaintsList as Complaint[]).slice(0, 4);

  return (
    <div>
      <div className="flex gap-4 flex-wrap mb-8">
        <StatCard
          icon="📋"
          label="Pending Onboarding"
          value={s.pendingOnboarding}
          change={s.pendingOnboardingChange}
          color="accent"
        />
        <StatCard
          icon="📨"
          label="Open Complaints"
          value={s.openComplaints}
          change={s.openComplaintsChange}
          color="warning"
        />
        <StatCard
          icon="👥"
          label="Active Users"
          value={s.activeUsers.toLocaleString()}
          change={s.activeUsersChange}
          color="success"
        />
        <StatCard
          icon="🔧"
          label="Active Providers"
          value={s.activeProviders}
          change={s.activeProvidersChange}
          color="info"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="m-0 text-base font-semibold text-mordobo-text">Recent Onboarding Requests</h3>
            <Link to="/onboarding" className="text-xs text-mordobo-accentLight hover:underline cursor-pointer">
              View all →
            </Link>
          </div>
          {recentOnboarding.length === 0 ? (
            <p className="text-sm text-mordobo-textSecondary py-4">No hay solicitudes recientes.</p>
          ) : (
            recentOnboarding.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center py-3 border-b border-mordobo-border last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-mordobo-text">{req.name}</div>
                  <div className="text-xs text-mordobo-textSecondary">{req.service} · {req.location}</div>
                </div>
                <Badge
                  color={
                    req.status === "pending"
                      ? "warning"
                      : req.status === "in_review"
                        ? "info"
                        : req.status === "approved"
                          ? "success"
                          : "danger"
                  }
                >
                  {req.status.replace("_", " ")}
                </Badge>
              </div>
            ))
          )}
        </div>
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="m-0 text-base font-semibold text-mordobo-text">Recent Complaints</h3>
            <Link to="/complaints" className="text-xs text-mordobo-accentLight hover:underline cursor-pointer">
              View all →
            </Link>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="text-sm text-mordobo-textSecondary py-4">No hay quejas o sugerencias recientes.</p>
          ) : (
            recentComplaints.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center py-3 border-b border-mordobo-border last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-mordobo-text">{c.subject}</div>
                  <div className="text-xs text-mordobo-textSecondary">{c.from} · {c.role}</div>
                </div>
                <Badge
                  color={
                    c.priority === "critical"
                      ? "danger"
                      : c.priority === "high"
                        ? "warning"
                        : c.priority === "medium"
                          ? "info"
                          : "accent"
                  }
                >
                  {c.priority}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
