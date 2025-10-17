import { I18nManager, useWindowDimensions } from 'react-native';

export function useRTL() {
  const isRTL = I18nManager.isRTL;
  const { width, height } = useWindowDimensions();
  return { isRTL, width, height };
}

