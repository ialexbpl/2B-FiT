import { lightPalette } from '@styles/theme';

export const ACTIVITY_LEVELS = ['Niska', 'Umiarkowana', 'Wysoka', 'Bardzo wysoka'];
export const ALLERGY_OPTIONS = ['Gluten', 'Laktoza', 'Orzechy', 'Soja', 'Jaja', 'Ryby'];

export type ModalType = 'age' | 'height' | 'weight' | 'goal' | 'activity' | 'allergies' | null;

export const modalTitles: Record<Exclude<ModalType, null>, string> = {
  age: 'Zmien wiek',
  height: 'Zmien wzrost',
  weight: 'Zmien wage',
  goal: 'Ustal cel wagowy',
  activity: 'Wybierz poziom aktywnosci',
  allergies: 'Wybierz alergie'
};

export const modalPlaceholders: Record<'age' | 'height' | 'weight' | 'goal', string> = {
  age: 'Wpisz swoj wiek',
  height: 'Wpisz swoj wzrost (cm)',
  weight: 'Wpisz swoja wage (kg)',
  goal: 'Wpisz docelowa wage (kg)'
};

export const numericMaxLength: Record<'age' | 'height' | 'weight' | 'goal', number> = {
  age: 3,
  height: 3,
  weight: 3,
  goal: 3
};

export type ProfileInformationsProps = {
  palette: typeof lightPalette;
  isDark: boolean;
};
