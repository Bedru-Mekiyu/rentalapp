import React from "react";
import { Search, Filter, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DashboardCard from "../components/DashboardCard";

const AdminUserManagement = () => {
  const users = [
    { name: "Alice Johnson", email: "alice.johnson@example.com", role: "Administrator", mfa: "Enabled", last: "2023-10-26 14:30" },
    { name: "Bob Smith", email: "bob.smith@example.com", role: "Support Staff", mfa: "Disabled", last: "2023-10-25 09:15" },
    { name: "Charlie Brown", email: "charlie.brown@example.com", role: "Standard User", mfa: "Pending", last: "2023-10-26 10:00" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Admin User & Role Management"
        subtitle="Manage system users, assign roles, and monitor MFA status."
        actions={
          <button className="btn-primary inline-flex items-center gap-2 text-xs font-semibold">
            <UserPlus size={18} /> Add New User
          </button>
        }
      />

      <DashboardCard>
        <div className="filter-panel mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Search users..." className="form-input pl-10 text-sm" />
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50">
            <Filter size={16} /> Filter by Role
          </button>
        </div>

        <div className="table-shell overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="table-head">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="p-4">Name & Email</th>
                <th className="p-4">Roles</th>
                <th className="p-4">MFA Status</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user, idx) => (
                <tr key={idx} className="table-row stagger-item">
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-slate-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${user.mfa === "Enabled" ? "text-emerald-600" : user.mfa === "Disabled" ? "text-rose-600" : "text-amber-600"}`}>
                      {user.mfa === "Enabled" ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {user.mfa}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-mono">{user.last}</td>
                  <td className="p-4 text-center">
                    <button className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 hover:underline">
                      Edit Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>Page 1 of 5</span>
          <div className="flex gap-2">
            <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide disabled:opacity-50">
              Previous
            </button>
            <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              Next
            </button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};
module.exports = AdminUserManagement;