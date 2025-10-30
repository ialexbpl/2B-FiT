//This is the theme file defining design tokens and color palettes for light and dark modes globally

//import type { ImageSourcePropType }from 'react-native';
//import bgLight from '../assets/images/bg_light.png';
//import bgDark from '../assets/images/bg_dark.png';


// Design tokens (brand and primitives)

export const theme = {
  colors: {
    // Brand and utility colors
    primary: '#22c55e', // green-500
    success: '#16a34a', // green-600
    warning: '#f59e0b', // amber-500
    danger: '#ef4444',  // red-500
  },
  spacing: (n: number) => n * 8,
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    md: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    lg: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  },
};

export type Palette = {
  background: string;   // app background
  card: string;  
  card100: string;         // surfaces, cards
  text: string;         // primary text
  subText: string;      // secondary/muted text
  border: string;       // hairlines and borders
  primary: string;      // primary interactive color (tracks etc.)
  onPrimary: string;    // text/icon on primary backgrounds
  overlay: string;      // modal overlay color
 // backgroundImage?: ImageSourcePropType; // option background image
};

export const paletteLight: Palette = {
  background: '#F7F8FA',
  card: '#ffffff52',
  card100: '#ffffffff',
  text: '#0F172A',
  subText: '#64748B',
  border: '#E2E8F0',
  primary: theme.colors.primary,
  onPrimary: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
 // backgroundImage: bgLight,
};

export const paletteDark: Palette = {
  background: '#151a25ff',
  card: 'rgba(48, 52, 57, 0.08)',//added transparent to test
  card100: '#151a25ff',//added transparent to test
  text: '#F8FAFC',
  subText: '#94A3B8',
  border: '#273244',
  primary: theme.colors.primary,
  onPrimary: '#0B1A13',
  overlay: 'rgba(0, 0, 0, 0.55)',
 // backgroundImage: bgDark,
};

// Backward-compatible aliases (if some modules still import these names)
export const lightPalette = paletteLight;
export const darkPalette = paletteDark;
