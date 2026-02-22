import React from 'react';
import { Search, Filter, UserPlus, ShieldCheck, ShieldAlert } from 'lucide-react';

const AdminUserManagement = () => {
  const users = [
    { name: "Alice Johnson", email: "alice.johnson@example.com", role: "Administrator", mfa: "Enabled", last: "2023-10-26 14:30" },
    { name: "Bob Smith", email: "bob.smith@example.com", role: "Support Staff", mfa: "Disabled", last: "2023-10-25 09:15" },
    { name: "Charlie Brown", email: "charlie.brown@example.com", role: "Standard User", mfa: "Pending", last: "2023-10-26 10:00" },
  ];

  return (
    <div className="p-8 bg-[#F8F9FA] min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin User & Role Management</h1>
          <p className="text-gray-500">Manage system users, assign roles, and monitor MFA status[cite: 68].</p>
        </div>
            <button className="btn-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-md">
          <UserPlus size={20} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="text" placeholder="Search users..." className="form-input pl-10 text-sm" />
          </div>
          <button className="px-4 py-2 border rounded-lg bg-white flex items-center gap-2 text-sm font-semibold hover:bg-gray-50">
            <Filter size={16} /> Filter by Role
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b">
              <th className="p-4">Name & Email</th>
              <th className="p-4">Roles</th>
              <th className="p-4">MFA Status</th>
              <th className="p-4">Last Activity</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user, idx) => (
                <tr key={idx} className="stagger-item hover:bg-emerald-50/30 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="p-4"><span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">{user.role}</span></td>
                <td className="p-4">
                  <div className={`flex items-center gap-1.5 text-xs font-black uppercase ${user.mfa === 'Enabled' ? 'text-green-600' : user.mfa === 'Disabled' ? 'text-red-500' : 'text-yellow-600'}`}>
                    {user.mfa === 'Enabled' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    {user.mfa}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500 font-mono">{user.last}</td>
                <td className="p-4 text-center">
                    <button className="text-emerald-600 font-bold text-xs hover:underline">Edit Account</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 border-t flex justify-between items-center bg-gray-50 text-xs text-gray-500">
          <span>Page 1 of 5 [cite: 82]</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded bg-white disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border rounded bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
module.exports = AdminUserManagement;