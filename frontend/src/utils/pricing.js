const calculateFloorMultiplier = (floor) => {
  if (floor <= 1) return 1.2;
  if (floor <= 5) return 1.0;
  if (floor <= 10) return 0.95;
  return 0.9;
};

const calculateAmenityBonus = (amenities = []) => 1 + amenities.length * 0.02;
const calculateViewBonus = (views = []) => 1 + views.length * 0.03;

export function calculateUnitPrice(unit) {
  if (!unit || typeof unit !== "object") return null;

  const basePriceEtb = Number(unit.basePriceEtb);
  const floor = Number(unit.floor);

  if (!Number.isFinite(basePriceEtb) || !Number.isFinite(floor)) {
    return null;
  }

  const amenityMultiplier = calculateAmenityBonus(unit.amenitiesConfig || []);
  const viewMultiplier = calculateViewBonus(unit.viewAttributes || []);
  const floorMultiplier = calculateFloorMultiplier(floor);

  return Math.round(basePriceEtb * floorMultiplier * amenityMultiplier * viewMultiplier);
}

export function getLeaseMonthlyRentEtb(lease) {
  if (!lease) return null;

  const computed = calculateUnitPrice(lease.unitId);
  if (computed != null) return computed;

  return null;
}
