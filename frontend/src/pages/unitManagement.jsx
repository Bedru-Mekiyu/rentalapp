import { useState, useMemo, useEffect } from "react";
import API from "../services/api";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";

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

const calculateRentPreview = ({ baseRent, unit }) => {
  const floorMultiplier = calculateFloorMultiplier(unit.floor);
  const amenityMultiplier = calculateAmenityBonus(unit.amenitiesConfig);
  const viewMultiplier = calculateViewBonus(unit.viewAttributes);

  const afterFloor = baseRent * floorMultiplier;
  const afterAmenties = afterFloor * amenityMultiplier * viewMultiplier;

  return {
    baseRent,
    floorAdjustment: Math.round(afterFloor - baseRent),
    amenityAdjustment: Math.round(afterAmenties - afterFloor),
    total: Math.round(afterAmenties),
  };
};

export default function UnitManagement() {
  const [baseRent, setBaseRent] = useState(8000);
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  useEffect(() => {
    const mockUnits = [
      {
        id: 1,
        name: "Unit 101 (5th floor)",
        floor: 5,
        amenitiesConfig: ["Balcony", "Parking"],
        viewAttributes: ["City View"],
      },
    ];

    setUnits(mockUnits);
    setSelectedUnitId(mockUnits[0].id);
  }, []);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);

  const rent = useMemo(() => {
    if (!selectedUnit) return null;
    return calculateRentPreview({
      baseRent,
      unit: selectedUnit,
    });
  }, [baseRent, selectedUnit]);

  if (!selectedUnit || !rent) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Pricing"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="Unit Management - Pricing Rules"
          subtitle="Configure pricing rules for base rent, floor multipliers, and amenity bonuses."
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Base Price Configuration">
              <SkeletonRow className="h-10 w-full" />
            </Card>
            <Card title="Floor-Based Adjustments (Multipliers)">
              <div className="space-y-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            </Card>
          </div>
          <div>
            <Card title="Rent Preview Calculator">
              <div className="space-y-3">
                <SkeletonRow className="h-8 w-full" />
                <SkeletonRow className="h-8 w-3/4" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const floorMultipliers = [
    { minFloor: 0, maxFloor: 1, multiplier: 1.2 },
    { minFloor: 2, maxFloor: 5, multiplier: 1.0 },
    { minFloor: 6, maxFloor: 10, multiplier: 0.95 },
    { minFloor: 11, maxFloor: 25, multiplier: 0.9 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pricing"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Unit Management - Pricing Rules"
        subtitle="Configure pricing rules for base rent, floor multipliers, and amenity bonuses."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* left */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Base Price Configuration">
            <label className="text-sm text-gray-600 ">
              Base Monthly Rent(ETB)
            </label>
            <input
              type="number "
              value={baseRent}
              onChange={(e) => setBaseRent(+e.target.value)}
              className="form-input mt-2 text-sm"
            />
          </Card>

          <Card title="Floor-Based Adjustments (Multipliers)">
            <div className="grid grid-cols-3 gap-4 text-xs font-semibold mb-2 text-gray-500">
              <span>Min Floor</span>
              <span>Max Floor</span>
              <span>Multiplier</span>
            </div>

            {floorMultipliers.map((rule, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 mb-3">
                <input
                  disabled
                  value={rule.minFloor}
                  className="form-input text-xs bg-slate-50"
                />
                <input
                  disabled
                  value={rule.maxFloor}
                  className="form-input text-xs bg-slate-50"
                />
                <input
                  disabled
                  value={`× ${rule.multiplier}`}
                  className="form-input text-xs bg-slate-50"
                />
              </div>
            ))}
          </Card>
        </div>

        {/* right */}
        <div>
          <Card title="Rent Preview Calculator">
            <p className="mb-4 text-sm text-gray-600">
              See the estimated rent based on your configured rules.
            </p>
            <div className="mb-4">
              <label className="mb-1 text-xs font-medium block text-gray-500  ">
                Select unit for preview
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => selectedUnitId(Number(e.target.value))}
                className="form-select text-sm"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 text-sm">
              <Row label="Base Rent" value={`${rent.baseRent} ETB`} />
              <Row
                label="Floor Adjustment"
                value={`${rent.floorAdjustment} ETB`}
              />
              <Row
                label="Amenity Adjustments"
                value={`${rent.amenityAdjustment} ETB`}
              />

              <hr />
              <div className="font-semibold text-lg text-emerald-600 flex justify-between  ">
                <span>Total Estimated Rent</span>
                <span>{rent.total} ETB</span>
              </div>

              <div className="pt-4 text-xs text-gray-600">
                <p>
                  <b>Unit:</b> {selectedUnit.name}
                </p>
                <p>
                  <b>Floor:</b> {selectedUnit.floor}
                </p>
                <p>
                  <b>Amenities:</b> {selectedUnit.amenitiesConfig.join(", ")}
                </p>
                <p>
                  <b>Views:</b> {selectedUnit.viewAttributes.join(",")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600 ">{label}</span>
    <span className="font-medium ">{value}</span>
  </div>
);
