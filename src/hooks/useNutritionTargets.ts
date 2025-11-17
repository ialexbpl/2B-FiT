import { useMemo } from 'react';
import { useProfile } from '@context/ProfileContext';
import { computeNutritionTargets } from '@utils/testNutri';

export function useNutritionTargets() {
  const { sex, age, height, weight, goalWeight, activityLevel } = useProfile();
  return useMemo(
    () => computeNutritionTargets({ sex, age, height, weight, goalWeight, activityLevel }),
    [sex, age, height, weight, goalWeight, activityLevel]
  );
}