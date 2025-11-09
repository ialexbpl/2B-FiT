export type Sex = 'Male' | 'Female';
export type ActivityLevel = 'Low' | 'Moderate' | 'High' | 'Very High';

export function mapActivityToPAL(level: string | null): number {
  switch (level as ActivityLevel) {
    case 'Low':       return 1.4;
    case 'Moderate':  return 1.6;
    case 'High':      return 1.8;
    case 'Very High': return 2.2;
    default:          return 1.4;
  }
}

// Protein (g/kg) based on activity:
// - Active (PAL ≥ 1.6): 1.6–2.2 g/kg → default 2.0
// - Less active: 1.0–1.4 g/kg → default 1.2
export function proteinPerKgFromActivity(level: string | null): number {
  const pal = mapActivityToPAL(level);
  if (pal >= 1.9) return 2.2; // very high → upper bound
  if (pal >= 1.6) return 2.0; // moderate/high → mid range
  return 1.2;                 // low → mid range
}

// BMR via Mifflin–St Jeor
export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'Male' ? base + 5 : base - 161;
}

// TDEE / CPM
export function tdeeFromBmr(bmr: number, pal: number): number {
  return bmr * pal;
}

// If goal weight differs by ≥3 kg:
// - cut: −20%
// - bulk: +10%
// - otherwise: maintain
export function goalDeltaFromWeights(currentKg: number, goalKg: number): number {
  const diff = goalKg - currentKg;
  if (diff < -3) return -0.20;
  if (diff > 3)  return +0.10;
  return 0;
}

export function applyGoal(tdeeKcal: number, delta: number): number {
  return Math.round(tdeeKcal * (1 + delta));
}

// Macros from target calories and weight
// - Protein: activity-derived g/kg
// - Fat: default 25% of calories (editable later)
// - Carbs: remainder
export function macrosFromTargets(
  calories: number,
  weightKg: number,
  activityLevel: string | null,
  fatPct: number = 0.25
) {
  const proteinPerKg = proteinPerKgFromActivity(activityLevel);
  const protein_g = Math.round(proteinPerKg * weightKg);
  const protein_kcal = protein_g * 4;

  const fat_kcal = Math.round(calories * fatPct);
  const fat_g = Math.round(fat_kcal / 9);

  const carbs_kcal = Math.max(0, calories - protein_kcal - fat_kcal);
  const carbs_g = Math.round(carbs_kcal / 4);

  return { protein_g, fat_g, carbs_g, proteinPerKg, fatPct };
}

// End-to-end calculator using your profile strings
export function computeNutritionTargets(args: {
  sex: Sex;
  age: string;
  height: string;
  weight: string;
  goalWeight: string;
  activityLevel: string | null;
}) {
  const ageNum = Number(args.age || 0);
  const heightNum = Number(args.height || 0);
  const weightNum = Number(args.weight || 0);
  const goalWeightNum = Number(args.goalWeight || 0);

  const pal = mapActivityToPAL(args.activityLevel);
  const bmr = bmrMifflin(args.sex, weightNum, heightNum, ageNum);
  const tdee = tdeeFromBmr(bmr, pal);
  const goalDelta = goalDeltaFromWeights(weightNum, goalWeightNum);
  const calories = applyGoal(tdee, goalDelta);

  const macros = macrosFromTargets(calories, weightNum, args.activityLevel);
  return {
    pal,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    goalDelta,
    calories,
    ...macros,
  };
}