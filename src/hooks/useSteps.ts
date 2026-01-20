// src/hooks/useSteps.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

type StepsSource = 'pedometer' | 'unavailable';

type UseStepsResult = {
  steps: number;
  goal: number;
  isAvailable: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  source: StepsSource;
};

type StepRangeResult = {
  steps: number;
  source: StepsSource;
};

const ensurePedometerPermissions = async () => {
  try {
    const getPerm = (Pedometer as any).getPermissionsAsync;
    const requestPerm = (Pedometer as any).requestPermissionsAsync;
    if (getPerm && requestPerm) {
      const { status } = await getPerm();
      if (status !== 'granted') {
        const { status: reqStatus } = await requestPerm();
        return reqStatus === 'granted';
      }
    }
  } catch (permErr) {
    console.warn('Pedometer permission check failed', permErr);
  }
  return true;
};

export const getStepsForRange = async (start: Date, end: Date): Promise<StepRangeResult> => {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return { steps: 0, source: 'unavailable' };

    const allowed = await ensurePedometerPermissions();
    if (!allowed) return { steps: 0, source: 'unavailable' };

    if (Platform.OS === 'android') {
      // Android doesn't support getStepCountAsync; enable live updates instead.
      return { steps: 0, source: 'pedometer' };
    }

    const result = await Pedometer.getStepCountAsync(start, end);
    const steps = Math.max(0, Math.round(result?.steps ?? 0));
    return { steps, source: 'pedometer' };
  } catch (err) {
    console.warn('Pedometer step range failed', err);
    return { steps: 0, source: 'unavailable' };
  }
};

const START_OF_DAY = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const useSteps = (goal: number = 10000): UseStepsResult => {
  const [steps, setSteps] = useState(0);
  const [baselineSteps, setBaselineSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stepsSource, setStepsSource] = useState<StepsSource>('pedometer');
  const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);

  const stopSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const startLiveUpdates = useCallback((baseline: number) => {
    stopSubscription();
    subscriptionRef.current = Pedometer.watchStepCount(result => {
      // watchStepCount returns steps since the watcher was started (cumulative)
      setSteps(baseline + result.steps);
    });
  }, [stopSubscription]);

  const syncSteps = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const start = START_OF_DAY();
        const end = new Date();
        const result = await getStepsForRange(start, end);
        setStepsSource(result.source);

        if (result.source === 'unavailable') {
          setIsAvailable(false);
          setSteps(0);
          setBaselineSteps(0);
          stopSubscription();
          return;
        }

        setIsAvailable(true);
        if (result.source === 'pedometer' && Platform.OS === 'android') {
          if (!subscriptionRef.current) {
            setBaselineSteps(result.steps);
            setSteps(result.steps);
            startLiveUpdates(result.steps);
          }
          return;
        }

        setBaselineSteps(result.steps);
        setSteps(result.steps);

        stopSubscription();
        startLiveUpdates(result.steps);
      } catch (err: any) {
        console.error('Steps fetch error', err);
        setError(err?.message ?? 'Failed to load steps');
        setSteps(0);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [startLiveUpdates, stopSubscription]
  );

  useEffect(() => {
    syncSteps();
    return () => {
      stopSubscription();
    };
  }, [stopSubscription, syncSteps]);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'android' && stepsSource === 'pedometer') {
      await syncSteps(true);
      return;
    }
    stopSubscription();
    await syncSteps();
  }, [stepsSource, stopSubscription, syncSteps]);

  return {
    steps,
    goal,
    isAvailable,
    loading,
    error,
    refresh,
    source: stepsSource,
  };
};
