// src/hooks/useSteps.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Pedometer } from 'expo-sensors';

type UseStepsResult = {
  steps: number;
  goal: number;
  isAvailable: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
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
  const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);

  const stopSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  };

  const startLiveUpdates = useCallback((baseline: number) => {
    stopSubscription();
    subscriptionRef.current = Pedometer.watchStepCount(result => {
      // watchStepCount returns steps since the watcher was started (cumulative)
      setSteps(baseline + result.steps);
    });
  }, []);

  const fetchBaseline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);
      if (!available) {
        setSteps(0);
        setBaselineSteps(0);
        return;
      }

      // Permissions (mainly iOS). Guard for SDKs without these methods.
      try {
        const getPerm = (Pedometer as any).getPermissionsAsync;
        const requestPerm = (Pedometer as any).requestPermissionsAsync;
        if (getPerm && requestPerm) {
          const { status } = await getPerm();
          if (status !== 'granted') {
            const { status: reqStatus } = await requestPerm();
            if (reqStatus !== 'granted') {
              setError('Permission denied');
              setSteps(0);
              setBaselineSteps(0);
              return;
            }
          }
        }
      } catch (permErr) {
        console.warn('Pedometer permission check failed', permErr);
      }

      const start = START_OF_DAY();
      const end = new Date();
      const { steps: baseline } = await Pedometer.getStepCountAsync(start, end);
      setBaselineSteps(baseline);
      setSteps(baseline);
      startLiveUpdates(baseline);
    } catch (err: any) {
      console.error('Pedometer fetch error', err);
      setError(err?.message ?? 'Failed to load steps');
      setSteps(0);
    } finally {
      setLoading(false);
    }
  }, [startLiveUpdates]);

  useEffect(() => {
    fetchBaseline();
    return () => {
      stopSubscription();
    };
  }, [fetchBaseline]);

  const refresh = useCallback(async () => {
    stopSubscription();
    await fetchBaseline();
  }, [fetchBaseline]);

  return {
    steps,
    goal,
    isAvailable,
    loading,
    error,
    refresh,
  };
};
