import type { Palette } from '@styles/theme';

export type DashboardProps = {
    palette: Palette;
};

export type SleepData = {
    day: string;
    hours: number;
};

export type FoodData = {
    consumed: number;
    goal: number;
    protein: number;
    carbs: number;
    fat: number;
};