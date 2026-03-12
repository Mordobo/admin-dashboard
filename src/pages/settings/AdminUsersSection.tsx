import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import {
  listAdminUsers,
  inviteAdmin,
  updateAdminUser,
  deactivateAdminUser,
} from "@/services/settingsService";
import type { AdminUserSettings, Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const ROLES: Role[] = ["super_admin", "admin", "moderator"];
const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
};
const STATUS_COLORS: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  inactive: "danger",
};

export function AdminUsersSection() {
  const { auth } = useAuth();
  const isSuperAdmin = auth.role === "super_admin";
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("admin");
  const [inviteName, setInviteName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("admin");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["settings-admin-users"],
    queryFn: listAdminUsers,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: Role; status?: string } }) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
      setEditingId(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-admin-users"] });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim().toLowerCase(), role: inviteRole, full_name: inviteName.trim() || undefined });
  };

  const handleSaveRole = (user: AdminUserSettings) => {
    if (editRole === user.role) {
      setEditingId(null);
      return;
    }
    updateMutation.mutate({ id: user.id, payload: { role: editRole } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-mordobo-textSecondary">
        Loading admin users…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-mordobo-text m-0">Admin Users</h2>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90"
          >
            Invite admin
          </button>
        )}
      </div>

      {inviteOpen && (
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">Invite new administrator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Email *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Full name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-mordobo-textMuted uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full py-2.5 px-3.5 bg-mordobo-surface border border-mordobo-border rounded-xl text-mordobo-text text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          {inviteMutation.isError && (
            <p className="text-mordobo-danger text-sm mb-4">
              {(inviteMutation.error as Error)?.message ?? "Failed to send invitation"}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="py-2.5 px-5 bg-mordobo-surface border border-mordobo-border rounded-xl text-sm font-semibold text-mordobo-text cursor-pointer hover:bg-mordobo-surfaceHover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
              className="py-2.5 px-5 bg-mordobo-accent text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {inviteMutation.isPending ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-mordobo-border">
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">User</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Role</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Last login</th>
                {isSuperAdmin && (
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-mordobo-textMuted uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-mordobo-border last:border-0">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-mordobo-text">{user.full_name || user.email}</div>
                    <div className="text-[13px] text-mordobo-textSecondary">{user.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                          className="py-2 px-3 bg-mordobo-surface border border-mordobo-border rounded-lg text-mordobo-text text-sm"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(user)}
                          disabled={updateMutation.isPending}
                          className="text-mordobo-accentLight text-sm hover:underline"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-mordobo-textMuted text-sm hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-mordobo-text">{ROLE_LABELS[user.role]}</span>
                        {isSuperAdmin && user.status === "active" && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(user.id);
                              setEditRole(user.role);
                            }}
                            className="ml-2 text-mordobo-accentLight text-xs hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge color={STATUS_COLORS[user.status] ?? "info"}>{user.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-mordobo-textSecondary">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3.5 px-4">
                      {user.status === "active" && (
                        <button
                          type="button"
                          onClick={() => deactivateMutation.mutate(user.id)}
                          disabled={deactivateMutation.isPending}
                          className="text-mordobo-danger text-sm hover:underline disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-12 text-center text-mordobo-textSecondary text-sm">No admin users yet.</div>
        )}
      </div>
    </div>
  );
}
