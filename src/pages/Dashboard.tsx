import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { fetchDashboardStats, listOnboardingRequests, listComplaints } from "@/services/adminService";
import type { OnboardingRequest, Complaint } from "@/types";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60_000,
  });
  const { data: onboardingList = [], isLoading: onboardingLoading } = useQuery({
    queryKey: ["admin-onboarding", "recent", 5],
    queryFn: () => listOnboardingRequests({ limit: 5 }),
    staleTime: 60_000,
  });
  const { data: complaintsList = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["admin-complaints", "recent", 5],
    queryFn: () => listComplaints({ limit: 5 }),
    staleTime: 60_000,
  });

  const s = stats ?? { pendingOnboarding: 0, openComplaints: 0, activeUsers: 0, activeProviders: 0 };
  const recentOnboarding = (onboardingList as OnboardingRequest[]).slice(0, 5);
  const recentComplaints = (complaintsList as Complaint[]).slice(0, 5);

  return (
    <div>
      <div className="flex gap-4 flex-wrap mb-8">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6 flex-1 min-w-[200px] animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-mordobo-border mb-4" />
                <div className="h-8 w-16 bg-mordobo-border rounded mb-2" />
                <div className="h-4 w-24 bg-mordobo-border rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="m-0 text-base font-semibold text-mordobo-text">Recent Onboarding Requests</h3>
            <Link to="/onboarding" className="text-xs text-mordobo-accentLight hover:underline cursor-pointer">
              View all →
            </Link>
          </div>
          {onboardingLoading ? (
            <p className="text-sm text-mordobo-textSecondary py-4">Loading…</p>
          ) : recentOnboarding.length === 0 ? (
            <p className="text-sm text-mordobo-textSecondary py-4">No recent requests.</p>
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
          {complaintsLoading ? (
            <p className="text-sm text-mordobo-textSecondary py-4">Loading…</p>
          ) : recentComplaints.length === 0 ? (
            <p className="text-sm text-mordobo-textSecondary py-4">No recent complaints or suggestions.</p>
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
