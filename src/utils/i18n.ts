import en from '@lang/en.json';
import pl from '@lang/pl.json';

type Dictionaries = typeof en & typeof pl;

const dictionaries: Record<string, Dictionaries> = {
  en: en as Dictionaries,
  pl: pl as Dictionaries,
};

let currentLocale: keyof typeof dictionaries = 'en';

export function setLocale(locale: keyof typeof dictionaries) {
  currentLocale = locale;
}

export function getLocale() {
  return currentLocale;
}

export function t(key: keyof Dictionaries | string, locale?: keyof typeof dictionaries): string {
  const dict = dictionaries[locale ?? currentLocale] ?? dictionaries.en;
  return (dict as any)[key] ?? String(key);
}

