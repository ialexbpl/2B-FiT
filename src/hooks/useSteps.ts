// src/hooks/useSteps.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

type UseStepsResult = {
  steps: number;
  goal: number;
  isAvailable: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type StepsSource = 'google-fit' | 'pedometer' | 'unavailable';

type StepRangeResult = {
  steps: number;
  source: StepsSource;
};

let googleFitModule: any | null | undefined;
let googleFitAuthorized = false;
let googleFitAuthPromise: Promise<boolean> | null = null;

const getGoogleFitModule = () => {
  if (googleFitModule !== undefined) return googleFitModule;
  try {
    googleFitModule = require('react-native-google-fit');
  } catch {
    googleFitModule = null;
  }
  return googleFitModule;
};

const getGoogleFitClient = () => {
  const module = getGoogleFitModule();
  if (!module) return null;
  return {
    GoogleFit: module.default ?? module,
    Scopes: module.Scopes ?? module?.Scopes,
    BucketUnit: module.BucketUnit ?? module?.BucketUnit,
  };
};

const ensureGoogleFitAuthorized = async (): Promise<boolean> => {
  const client = getGoogleFitClient();
  if (!client) return false;
  const { GoogleFit, Scopes } = client;

  try {
    if (GoogleFit?.isAuthorized) {
      googleFitAuthorized = true;
      return true;
    }
    if (googleFitAuthorized) return true;
    if (typeof GoogleFit?.checkIsAuthorized === 'function') {
      await GoogleFit.checkIsAuthorized();
      if (GoogleFit.isAuthorized) {
        googleFitAuthorized = true;
        return true;
      }
    }
  } catch {
    // ignore - fallback to authorize
  }

  if (!Scopes || typeof GoogleFit?.authorize !== 'function') return false;
  if (!googleFitAuthPromise) {
    const scopes = [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_BODY_READ].filter(Boolean);
    googleFitAuthPromise = GoogleFit.authorize({ scopes })
      .then((result: any) => {
        const success = result?.success ?? result === true;
        if (success) {
          googleFitAuthorized = true;
        }
        return Boolean(success);
      })
      .catch(() => false)
      .finally(() => {
        googleFitAuthPromise = null;
      });
  }
  return googleFitAuthPromise;
};

const toDayKey = (date: Date) => date.toISOString().split('T')[0];

const normalizeTime = (value: unknown): number | null => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const sumRawSteps = (rawSteps: any[], rangeStart: number, rangeEnd: number) =>
  rawSteps.reduce((sum, entry) => {
    const start = normalizeTime(entry.startDate ?? entry.start);
    const end = normalizeTime(entry.endDate ?? entry.end);
    if (start == null || end == null) return sum;
    if (end <= rangeStart || start >= rangeEnd) return sum;
    const value = Number(entry.steps ?? entry.value ?? 0);
    if (!Number.isFinite(value)) return sum;
    return sum + value;
  }, 0);

const sumDailySteps = (steps: any[], dayKeys: Set<string>) =>
  steps.reduce((sum, entry) => {
    const rawDate = entry?.date;
    const dateKey =
      typeof rawDate === 'string' ? rawDate.slice(0, 10) : rawDate instanceof Date ? toDayKey(rawDate) : null;
    if (!dateKey || !dayKeys.has(dateKey)) return sum;
    const value = Number(entry.value ?? entry.steps ?? 0);
    if (!Number.isFinite(value)) return sum;
    return sum + value;
  }, 0);

const buildDayKeys = (start: Date, end: Date) => {
  const keys = new Set<string>();
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);
  while (cursor <= limit) {
    keys.add(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

const getGoogleFitStepsForRange = async (start: Date, end: Date): Promise<number | null> => {
  if (Platform.OS !== 'android') return null;
  const client = getGoogleFitClient();
  if (!client) return null;

  const authorized = await ensureGoogleFitAuthorized();
  if (!authorized) return null;

  const { GoogleFit, BucketUnit } = client;
  try {
    const samples = await GoogleFit.getDailyStepCountSamples({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      bucketUnit: BucketUnit?.MINUTE ?? 'MINUTE',
      bucketInterval: 1,
    });
    if (!Array.isArray(samples) || samples.length === 0) return null;

    const rangeStart = start.getTime();
    const rangeEnd = end.getTime();
    const dayKeys = buildDayKeys(start, end);

    const totals = samples.map(sample => {
      const rawSteps = Array.isArray(sample?.rawSteps) ? sample.rawSteps : [];
      if (rawSteps.length) {
        return sumRawSteps(rawSteps, rangeStart, rangeEnd);
      }
      const steps = Array.isArray(sample?.steps) ? sample.steps : [];
      return sumDailySteps(steps, dayKeys);
    });

    const max = Math.max(0, ...totals);
    return Number.isFinite(max) ? Math.round(max) : null;
  } catch (err) {
    console.warn('Google Fit steps fetch failed', err);
    return null;
  }
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
  const googleFitSteps = await getGoogleFitStepsForRange(start, end);
  if (googleFitSteps != null) {
    return { steps: Math.max(0, googleFitSteps), source: 'google-fit' };
  }

  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return { steps: 0, source: 'unavailable' };

    const allowed = await ensurePedometerPermissions();
    if (!allowed) return { steps: 0, source: 'unavailable' };

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
  const googleFitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const stopGoogleFitPolling = useCallback(() => {
    if (googleFitIntervalRef.current) {
      clearInterval(googleFitIntervalRef.current);
      googleFitIntervalRef.current = null;
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
          stopGoogleFitPolling();
          return;
        }

        setIsAvailable(true);
        setBaselineSteps(result.steps);
        setSteps(result.steps);

        if (result.source === 'pedometer') {
          stopGoogleFitPolling();
          startLiveUpdates(result.steps);
        } else {
          stopSubscription();
        }
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
    [startLiveUpdates, stopGoogleFitPolling, stopSubscription]
  );

  useEffect(() => {
    syncSteps();
    return () => {
      stopSubscription();
      stopGoogleFitPolling();
    };
  }, [stopGoogleFitPolling, stopSubscription, syncSteps]);

  useEffect(() => {
    if (stepsSource !== 'google-fit') return;
    stopGoogleFitPolling();
    googleFitIntervalRef.current = setInterval(() => {
      syncSteps(true).catch(() => {});
    }, 30000);
    return () => {
      stopGoogleFitPolling();
    };
  }, [stepsSource, stopGoogleFitPolling, syncSteps]);

  const refresh = useCallback(async () => {
    stopSubscription();
    stopGoogleFitPolling();
    await syncSteps();
  }, [stopGoogleFitPolling, stopSubscription, syncSteps]);

  return {
    steps,
    goal,
    isAvailable,
    loading,
    error,
    refresh,
  };
};
