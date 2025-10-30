import type { Palette } from '@styles/theme';

export const ACTIVITY_LEVELS = ['Low', 'Moderate', 'High', 'Very High'];
export const ALLERGY_OPTIONS = ['Gluten', 'Lactose', 'Nuts', 'Soy', 'Eggs', 'Fish'];

export type ModalType = 'age' | 'height' | 'weight' | 'goal' | 'activity' | 'allergies' | null;

export const modalTitles: Record<Exclude<ModalType, null>, string> = {
  age: 'Change age',
  height: 'Change height',
  weight: 'Change weight',
  goal: 'Set target weight',
  activity: 'Select activity level',
  allergies: 'Select allergies',
};

export const modalDescriptions: Record<Exclude<ModalType, null>, string> = {
  age: 'Adjust your age so we can personalize your plan.',
  height: 'Keep your height current for precise calculations.',
  weight: 'Update the latest number from the scale.',
  goal: 'Set a target weight that motivates you.',
  activity: 'Pick the activity level that matches your routine.',
  allergies: 'Select ingredients you want us to avoid.',
};

export const modalPlaceholders: Record<'age' | 'height' | 'weight' | 'goal', string> = {
  age: 'Enter your age',
  height: 'Enter your height (cm)',
  weight: 'Enter your weight (kg)',
  goal: 'Enter target weight (kg)',
};

export const numericMaxLength: Record<'age' | 'height' | 'weight' | 'goal', number> = {
  age: 3,
  height: 3,
  weight: 3,
  goal: 3
};

export type ProfileInformationsProps = {
  palette: Palette;
};
