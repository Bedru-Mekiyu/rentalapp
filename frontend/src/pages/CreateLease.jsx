import React from "react";
import { FileText, Save, CheckCircle } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";

const CreateLease = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leases"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Create New Lease"
        subtitle="Draft a lease agreement and review the rent calculation summary."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Selection Form */}
        <DashboardCard title="Tenant & Unit Selection">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Tenant Name</label>
              <input type="text" className="form-input mt-1 text-sm" defaultValue="Abebe Kebede" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Unit Number</label>
              <input type="text" className="form-input mt-1 text-sm" defaultValue="Unit 101-Studio" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Start Date</label>
                <input type="text" className="form-input mt-1 text-sm" defaultValue="Dec 13, 2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">End Date</label>
                <input type="text" className="form-input mt-1 text-sm" defaultValue="Dec 13, 2026" />
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Right: Rent Summary */}
        <DashboardCard title="Rent Calculation Summary" description="Preview line items before finalizing.">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr className="py-2"><td className="py-2">Base Rent</td><td className="text-right">ETB 15,000.00</td></tr>
              <tr className="py-2"><td className="py-2">Floor Adjustment</td><td className="text-right">ETB 500.00</td></tr>
              <tr className="py-2"><td className="py-2">Amenities Fee</td><td className="text-right">ETB 250.00</td></tr>
              <tr className="py-2"><td className="py-2 font-bold">Tax (15%)</td><td className="text-right">ETB 2,362.50</td></tr>
              <tr className="bg-emerald-50">
                <td className="py-3 font-bold">Total Monthly Rent</td>
                <td className="py-3 text-right font-bold text-emerald-600 text-lg">ETB 18,112.50</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-6 flex gap-3">
            <button className="flex-1 bg-slate-100 py-2 rounded font-medium">Save Draft</button>
            <button className="flex-1 bg-emerald-600 text-white py-2 rounded font-medium">Finalize Lease</button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default CreateLease;