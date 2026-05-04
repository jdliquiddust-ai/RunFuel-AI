// ── Pace-based nutrition formulas ────────────────────────────────────────────
// pace = minutes per mile (e.g. 8.0 = 8:00/mi, 8.5 = 8:30/mi)

function carbFactor(pace)       { return Math.max(0.08, Math.min(0.35, 0.50 - 0.030 * pace)); }
function hydrationRate(pace)    { return Math.max(10,   Math.min(30,   40.0 - 2.00  * pace)); } // oz/hr
function targetIntervalFn(pace) { return Math.max(20,   Math.min(55,   5.0  * pace  - 15));   } // min between stops

// ── Macro totals ─────────────────────────────────────────────────────────────
// mode: 'training' (default) | 'race'
// Race Day = 33% more carbs + 150mg/hr extra sodium (peak-performance protocol)
export function calcTotals(weight, distance, pace, mode = 'training') {
  const cf       = carbFactor(pace);
  const base     = distance * weight * cf;
  const totalMin = distance * pace;
  const rawHyd   = (totalMin / 60) * hydrationRate(pace);

  const raceMult    = mode === 'race' ? 1.33 : 1.0;
  const sodiumBonus = mode === 'race' ? Math.round((totalMin / 60) * 150) : 0;

  return {
    carbs:     Math.round((base / 4) * raceMult),
    sodium:    Math.round(base * 2.5 * raceMult) + sodiumBonus,
    hydration: Math.round(rawHyd),
    totalMin,
    pace,
    mode,
  };
}

// ── Fuel-stop plan ───────────────────────────────────────────────────────────
export function calcFuelPlan(totalMin, pace) {
  // backward compat — old history entries may store intensity strings
  const p = typeof pace === 'string'
    ? ({ EASY: 12, MODERATE: 10, HARD: 8 }[pace] ?? 10)
    : (pace ?? 10);

  const interval = targetIntervalFn(p);
  if (totalMin < 40) return { numHits: 0, hitTimesMin: [], intervalMin: 0 };

  const usable  = totalMin * 0.85;
  const numHits = Math.max(1, Math.floor(usable / interval));
  const hitTimesMin = Array.from({ length: numHits }, (_, i) =>
    Math.round(usable * (i + 1) / (numHits + 1))
  );
  const intervalMin = numHits === 1
    ? hitTimesMin[0]
    : Math.round(hitTimesMin[1] - hitTimesMin[0]);

  return { numHits, hitTimesMin, intervalMin };
}

// ── Pace display helpers ──────────────────────────────────────────────────────
export function paceLabel(pace) {
  const mins = Math.floor(pace);
  const secs = Math.round((pace % 1) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function paceToIntensityLabel(pace) {
  if (pace < 7.5) return 'ELITE';
  if (pace < 9)   return 'FAST';
  if (pace < 11)  return 'MODERATE';
  if (pace < 13)  return 'EASY';
  return 'CASUAL';
}

export function paceColor(pace) {
  if (pace < 7.5) return '#EF4444';
  if (pace < 9)   return '#F97316';
  if (pace < 11)  return '#F59E0B';
  if (pace < 13)  return '#22C55E';
  return '#06B6D4';
}

// ── Brands ───────────────────────────────────────────────────────────────────
export const BRANDS = [
  { id: 'gu',        label: 'GU Energy',         product: 'GU Original Gel',          carbs: 22, sodium:  55, hydration:  2 },
  { id: 'maurten',   label: 'Maurten',            product: 'Maurten Gel 100',          carbs: 25, sodium:  55, hydration:  2 },
  { id: 'huma',      label: 'Huma',               product: 'Huma Chia Energy Gel',     carbs: 21, sodium:  80, hydration:  2 },
  { id: 'clif',      label: 'Clif',               product: 'Clif Shot Gel',            carbs: 24, sodium:  50, hydration:  2 },
  { id: 'honey',     label: 'Honey Stinger',      product: 'Organic Energy Gel',       carbs: 24, sodium:  50, hydration:  2 },
  { id: 'spring',    label: 'Spring Energy',      product: 'Real Food Gel',            carbs: 21, sodium: 120, hydration:  2 },
  { id: 'sis',       label: 'SiS',                product: 'GO Isotonic Gel',          carbs: 22, sodium:  28, hydration:  3 },
  { id: 'skratch',   label: 'Skratch Labs',       product: 'Sport Energy Chews',       carbs: 19, sodium:  80, hydration:  0 },
  { id: 'precision', label: 'Precision Fuel',     product: 'PF 30 Energy Gel',         carbs: 30, sodium: 175, hydration:  0 },
  { id: 'tailwind',  label: 'Tailwind',           product: 'Endurance Fuel (1 scoop)', carbs: 25, sodium: 303, hydration: 12 },
  { id: 'nuun',      label: 'Nuun',               product: 'Nuun Sport + Carbs Tab',   carbs: 12, sodium: 300, hydration: 16 },
  { id: 'saltstick', label: 'SaltStick',          product: 'SaltStick FastChews',      carbs:  1, sodium: 100, hydration:  0 },
  { id: 'vespa',     label: 'VESPA',              product: 'VESPA CV-25 Concentrate',  carbs:  8, sodium:  20, hydration:  0 },
  { id: 'sword',     label: 'SWORD Performance',  product: 'SWORD Gel',                carbs: 28, sodium: 250, hydration:  2 },
];

export function brandRec(brand, carbsHit) {
  if (!brand) return null;
  const count  = brand.carbs > 0 ? Math.max(1, Math.round(carbsHit / brand.carbs)) : 1;
  const plural = count > 1 ? 's' : '';
  return `${count} ${brand.product}${brand.carbs === 0 ? '' : plural}`;
}
