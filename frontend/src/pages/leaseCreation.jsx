import { useState, useEffect, useMemo } from "react";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";

const tenants = ["Abebe Kebede", "Sara Mohammed"];
const units = [
  {
    id: 1,
    name: "Unit 101 - Studio",
    floor: 2,
    basePriceEtb: 15000,
    amenitiesConfig: ["Parking", "Generator"],
    viewAttributes: ["City"],
  },
  {
    id: 2,
    name: "Unit 402 - 2BR",
    floor: 7,
    basePriceEtb: 22000,
    amenitiesConfig: ["Parking", "Elevator", "Security"],
    viewAttributes: ["City", "Garden"],
  },
];

const calculateFloorMultiplier = (floor) => {
  if (floor <= 1) return 1.2; // +20% premium
  if (floor <= 5) return 1.0; // normal
  if (floor <= 10) return 0.95; // -5%
  return 0.9; // highest floors slightly cheaper
};

const calculateAmenityBonus = (amenities = []) => {
  // Add +2% per amenity
  return 1 + amenities.length * 0.02;
};

const calculateViewBonus = (views = []) => {
  // Good views add +3% each
  return 1 + views.length * 0.03;
};

export default function LeaseCreation() {
  const [tenant, setTenant] = useState("");
  const [unitId, setUnitId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deposit, setDeposit] = useState("");

  const selectedUnit = units.find((u) => u.id === Number(unitId));

  //   useEffect(() => {}, []);
  //   useEffect(() => {
  //     if (!selectedUnit) return;
  //   }, [selectedUnit]);

  const rentSummary = useMemo(() => {
    if (!selectedUnit) return null;

    const baseRent = selectedUnit.basePriceEtb;
    const floorMultiplier = calculateFloorMultiplier(selectedUnit.floor);
    const amenityMultiplier = calculateAmenityBonus(
      selectedUnit.amenitiesConfig,
    );
    const viewMultiplier = calculateViewBonus(selectedUnit.viewAttributes);

    const afterFloor = baseRent * floorMultiplier;
    const afterAmenities = afterFloor * amenityMultiplier;
    const finalBeforeTax = afterAmenities * viewMultiplier;
    const tax = Math.round(finalBeforeTax * 0.15);

    return {
      baseRent,
      floorAdjustment: Math.round(afterFloor - baseRent),
      amenityAdjustment: Math.round(afterAmenities - afterFloor),
      viewAdjustment: Math.round(finalBeforeTax - afterAmenities),
      tax,
      total: Math.round(finalBeforeTax + tax),
    };
  }, [selectedUnit]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leases"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Create New Lease"
        subtitle="Configure tenant, unit, and billing details for a new lease."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-6">
        {/* left */}
        <div className="space-y-6">
          <DashboardCard title="Tenant & Unit Selection">
            <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant Name</label>
              <select
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                className="form-select mt-1 text-sm"
              >
                <option value="">Select Tenant</option>
                {tenants.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="form-select mt-1 text-sm"
              >
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lease Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lease End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input mt-1 text-sm"
                />
              </div>
            </div>
            </div>
          </DashboardCard>
        {rentSummary && (
          <DashboardCard title="Rent Calculation Summary">
            {[
              ["Base Rent", rentSummary.baseRent],
              ["Floor Adjustment", rentSummary.floorAdjustment],
              ["Amenities Adjustment", rentSummary.amenityAdjustment],
              ["View Adjustment", rentSummary.viewAdjustment],
              ["Tax (15%)", rentSummary.tax],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between mb-2 text-sm">
                <span>{label}</span>
                <span>ETB {value}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-emerald-600 border-t border-slate-100 mt-3 pt-3">
              <span>Total Monthly rent</span>
              <span>ETB {rentSummary.total}</span>
            </div>
          </DashboardCard>
        )}

        <DashboardCard title="Additional Terms & Notes">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Security Deposit (ETB)
              </label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="form-input mt-1 text-sm"
              />
            </div>
            <div>
              <label htmlFor="" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </label>
              <textarea
                name=""
                id=""
                rows="3"
                placeholder="Special lease terms..."
                className="form-textarea mt-1 text-sm"
              />
            </div>
          </div>
        </DashboardCard>
      </div>

        {/* right */}
        <div className="space-y-4">
          <DashboardCard title="Lease Document Preview" description="No preview generated yet.">
            <button className="rounded-full border border-emerald-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 hover:bg-emerald-50">
              Generate Preview
            </button>
          </DashboardCard>
          <button className="btn-primary w-full py-3 text-xs font-semibold">
            Finalize Lease
          </button>
          <button className="w-full rounded-full bg-red-600 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-red-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
