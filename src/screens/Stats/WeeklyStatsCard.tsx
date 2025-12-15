import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

import { useNutritionTargets } from '@hooks/useNutritionTargets';
import { useAuth } from '@context/AuthContext';
import { fetchDailyLog, calculateSummary } from '@utils/mealsApi';
import { useSteps } from '@hooks/useSteps';

type MetricKey = 'steps' | 'activeKcal' | 'workoutMin' | 'waterL';

type DayMetric = {
  steps: number;
  activeKcal: number;
  workoutMin: number;
  waterL: number;
};

type MetricsMap = Record<string, DayMetric>; // key: YYYY-MM-DD

const STORAGE_KEY = 'stats:weeklyMetrics:v1';

const getDateKey = (date: Date) => date.toISOString().split('T')[0];

const getDayLabel = (date: Date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

const startOfWeekMonday = (date: Date) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};

const getWeekDays = (weekOffset: number): { date: Date; key: string; label: string }[] => {
  const base = new Date();
  base.setDate(base.getDate() + weekOffset * 7);
  const start = startOfWeekMonday(base);

  const arr: { date: Date; key: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push({ date: d, key: getDateKey(d), label: getDayLabel(d) });
  }
  return arr;
};

const formatRangeLabel = (days: { date: Date }[]) => {
  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}`;
  };
  if (!days.length) return '';
  return `${fmt(days[0].date)} – ${fmt(days[days.length - 1].date)}`;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

const metricConfig: Record<
  MetricKey,
  {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    unit: string;
    maxFallback: number;
    decimals?: number;
  }
> = {
  steps: {
    title: 'Steps',
    subtitle: 'Week overview',
    icon: 'walk',
    unit: '',
    maxFallback: 10000,
  },
  activeKcal: {
    title: 'Calories',
    subtitle: 'Week overview',
    icon: 'flame',
    unit: 'kcal',
    maxFallback: 600,
  },
  workoutMin: {
    title: 'Exercise',
    subtitle: 'Week overview',
    icon: 'barbell',
    unit: 'min',
    maxFallback: 60,
  },
  waterL: {
    title: 'Water',
    subtitle: 'Week overview',
    icon: 'water',
    unit: 'L',
    maxFallback: 2,
    decimals: 1,
  },
};

const emptyDay = (): DayMetric => ({
  steps: 0,
  activeKcal: 0,
  workoutMin: 0,
  waterL: 0,
});

const formatValue = (value: number, metric: MetricKey) => {
  const d = metricConfig[metric].decimals;
  if (d != null) return (Math.round(value * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
  return Math.round(value).toString();
};

const parseNumberSafe = (raw: string) => {
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

const SegButton: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  palette: any;
}> = ({ label, active, onPress, palette }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: active ? palette.primary : palette.border,
        backgroundColor: active ? palette.primary : palette.card100,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: active ? palette.onPrimary : palette.text, fontWeight: '800', fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const WeeklyStatsCard: React.FC = () => {
  const { palette, isDark } = useTheme() as any;

  const { session } = useAuth();
  const userId = session?.user?.id;

  const targets = useNutritionTargets();
  const goalKcal = targets?.calories || 0;

  const STEP_GOAL_FOR_SYNC = 6000;
  const { steps: liveSteps, isAvailable: stepsAvailable } = useSteps(STEP_GOAL_FOR_SYNC);

  const [metric, setMetric] = useState<MetricKey>('steps');
  const [weekView, setWeekView] = useState<0 | -1>(0);
  const [data, setData] = useState<MetricsMap>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // modal inputs
  const [stepsInput, setStepsInput] = useState('0');
  const [caloriesInput, setCaloriesInput] = useState('0');
  const [exerciseInput, setExerciseInput] = useState('0');
  const [waterInput, setWaterInput] = useState('0');

  const thisWeek = useMemo(() => getWeekDays(0), []);
  const lastWeek = useMemo(() => getWeekDays(-1), []);
  const shownWeek = useMemo(() => (weekView === 0 ? thisWeek : lastWeek), [weekView, thisWeek, lastWeek]);

  const todayKey = useMemo(() => getDateKey(new Date()), []);

  const optimalValue = useMemo(() => {
    if (metric === 'steps') return 6000;
    if (metric === 'activeKcal') return goalKcal || 0;
    if (metric === 'workoutMin') return 45;
    return 2; // waterL
  }, [metric, goalKcal]);

  const saveAll = useCallback(async (next: MetricsMap) => {
    setData(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[WeeklyStatsCard] save error', e);
    }
  }, []);

  const ensureKeys = useCallback(async (base: MetricsMap) => {
    const next: MetricsMap = { ...base };
    [...thisWeek, ...lastWeek].forEach(d => {
      if (!next[d.key]) next[d.key] = emptyDay();
    });
    setData(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[WeeklyStatsCard] ensureKeys save error', e);
    }
  }, [thisWeek, lastWeek]);

  const load = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as MetricsMap;
        await ensureKeys(parsed);
      } else {
        const init: MetricsMap = {};
        [...thisWeek, ...lastWeek].forEach(d => (init[d.key] = emptyDay()));
        setData(init);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      }
    } catch (e) {
      console.warn('[WeeklyStatsCard] load error', e);
    }
  }, [ensureKeys, thisWeek, lastWeek]);

  useEffect(() => {
    load();
  }, [load]);

  const patchToday = useCallback(
    (patch: Partial<DayMetric>) => {
      setData(prev => {
        const current = prev[todayKey] ?? emptyDay();
        const nextDay: DayMetric = { ...current, ...patch };
        const next: MetricsMap = { ...prev, [todayKey]: nextDay };

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e =>
          console.warn('[WeeklyStatsCard] patchToday save error', e)
        );

        return next;
      });
    },
    [todayKey]
  );

  const syncTodayCaloriesFromDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      const logs = await fetchDailyLog(userId, todayKey);
      const summary = calculateSummary(logs);
      const consumedKcal = Math.round(summary?.calories || 0);

      setData(prev => {
        const current = prev[todayKey] ?? emptyDay();
        if ((current.activeKcal ?? 0) === consumedKcal) return prev;

        const next: MetricsMap = {
          ...prev,
          [todayKey]: { ...current, activeKcal: consumedKcal },
        };

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e =>
          console.warn('[WeeklyStatsCard] sync calories save error', e)
        );
        return next;
      });
    } catch (e) {
      console.warn('[WeeklyStatsCard] sync calories error', e);
    }
  }, [todayKey, userId]);

  const syncTodayStepsFromDashboard = useCallback(() => {
    if (!stepsAvailable) return;
    const val = Math.max(0, Math.round(liveSteps || 0));

    setData(prev => {
      const current = prev[todayKey] ?? emptyDay();
      if ((current.steps ?? 0) === val) return prev;

      const next: MetricsMap = {
        ...prev,
        [todayKey]: { ...current, steps: val },
      };

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e =>
        console.warn('[WeeklyStatsCard] sync steps save error', e)
      );

      return next;
    });
  }, [liveSteps, stepsAvailable, todayKey]);

  // sync na start
  useEffect(() => {
    syncTodayCaloriesFromDashboard();
    syncTodayStepsFromDashboard();
  }, [syncTodayCaloriesFromDashboard, syncTodayStepsFromDashboard]);

  // sync po wejściu na ekran
  useFocusEffect(
    useCallback(() => {
      syncTodayCaloriesFromDashboard();
      syncTodayStepsFromDashboard();
    }, [syncTodayCaloriesFromDashboard, syncTodayStepsFromDashboard])
  );

  // sync steps
  useEffect(() => {
    syncTodayStepsFromDashboard();
  }, [syncTodayStepsFromDashboard]);

  const chartData = useMemo(() => {
    return shownWeek.map(d => {
      const day = data[d.key] ?? emptyDay();
      return { ...d, value: day[metric] ?? 0 };
    });
  }, [data, shownWeek, metric]);

  const maxValue = useMemo(() => {
    const values = chartData.map(x => x.value);
    const max = Math.max(...values, 0);

    const fallback = metricConfig[metric].maxFallback;

    const goalFloor =
      metric === 'steps'
        ? 6000
        : metric === 'activeKcal'
        ? goalKcal || 0
        : metric === 'workoutMin'
        ? 30
        : 2;

    return Math.max(max, fallback, goalFloor);
  }, [chartData, metric, goalKcal]);

  const computeWeekTotals = useCallback(
    (week: { key: string }[]) => {
      const vals = week.map(d => (data[d.key] ?? emptyDay())[metric] ?? 0);
      const total = vals.reduce((a, b) => a + b, 0);
      const avg = total / 7;
      return { total, avg };
    },
    [data, metric]
  );

  const thisWeekStats = useMemo(() => computeWeekTotals(thisWeek), [computeWeekTotals, thisWeek]);
  const lastWeekStats = useMemo(() => computeWeekTotals(lastWeek), [computeWeekTotals, lastWeek]);

  const delta = useMemo(() => {
    const diff = thisWeekStats.total - lastWeekStats.total;
    const base = lastWeekStats.total;
    const pct = base > 0 ? (diff / base) * 100 : null;
    return { diff, pct };
  }, [thisWeekStats.total, lastWeekStats.total]);

  const deltaIcon = useMemo(() => {
    if (Math.abs(delta.diff) < 1e-9) return 'remove' as const;
    return delta.diff > 0 ? ('trending-up' as const) : ('trending-down' as const);
  }, [delta.diff]);

  const deltaText = useMemo(() => {
    const sign = delta.diff > 0 ? '+' : delta.diff < 0 ? '−' : '';
    const abs = Math.abs(delta.diff);

    const diffStr =
      metric === 'waterL'
        ? `${sign}${formatValue(abs, metric)}`
        : `${sign}${formatValue(abs, metric)}`;

    const pctStr =
      delta.pct == null
        ? ''
        : ` (${delta.pct > 0 ? '+' : ''}${Math.round(delta.pct)}%)`;

    return `${diffStr}${pctStr}`;
  }, [delta.diff, delta.pct, metric]);

  const openDay = useCallback(
    (dateKey: string) => {
      const current = data[dateKey] ?? emptyDay();
      setSelectedKey(dateKey);

      setStepsInput(String(current.steps ?? 0));
      setCaloriesInput(String(current.activeKcal ?? 0));
      setExerciseInput(String(current.workoutMin ?? 0));
      setWaterInput(String(current.waterL ?? 0));

      setModalVisible(true);
    },
    [data]
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedKey(null);
  }, []);

  const onSave = useCallback(async () => {
    if (!selectedKey) return;

    const nextDay: DayMetric = {
      steps: clamp(Math.round(parseNumberSafe(stepsInput)), 0, 200000),
      activeKcal: clamp(Math.round(parseNumberSafe(caloriesInput)), 0, 5000),
      workoutMin: clamp(Math.round(parseNumberSafe(exerciseInput)), 0, 600),
      waterL: clamp(parseNumberSafe(waterInput), 0, 20),
    };

    const next: MetricsMap = { ...data, [selectedKey]: nextDay };
    await saveAll(next);
    closeModal();
  }, [closeModal, data, saveAll, selectedKey, stepsInput, caloriesInput, exerciseInput, waterInput]);

  const onClearDay = useCallback(async () => {
    if (!selectedKey) return;
    const next: MetricsMap = { ...data, [selectedKey]: emptyDay() };
    await saveAll(next);
    closeModal();
  }, [closeModal, data, saveAll, selectedKey]);

  const cardStyle = {
    marginHorizontal: 10,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card100,
    padding: 16,
  } as const;

  const shownRange = useMemo(() => formatRangeLabel(shownWeek), [shownWeek]);

  return (
    <View style={cardStyle}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900' }}>Weekly summary</Text>
          <Text style={{ color: palette.subText, fontSize: 13, marginTop: 2 }}>{shownRange}</Text>
        </View>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Ionicons name="stats-chart" size={18} color={palette.primary} />
        </View>
      </View>

      {/* Week toggle */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <SegButton label="This week" active={weekView === 0} onPress={() => setWeekView(0)} palette={palette} />
        <SegButton label="Last week" active={weekView === -1} onPress={() => setWeekView(-1)} palette={palette} />
      </View>

      {/* Metric segmented control */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <SegButton label="Steps" active={metric === 'steps'} onPress={() => setMetric('steps')} palette={palette} />
        <SegButton
          label="Calories"
          active={metric === 'activeKcal'}
          onPress={() => setMetric('activeKcal')}
          palette={palette}
        />
        <SegButton
          label="Exercise"
          active={metric === 'workoutMin'}
          onPress={() => setMetric('workoutMin')}
          palette={palette}
        />
        <SegButton label="Water" active={metric === 'waterL'} onPress={() => setMetric('waterL')} palette={palette} />
      </View>

      {/* Metric header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 10 }}>
        <Ionicons name={metricConfig[metric].icon} size={18} color={palette.primary} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 14 }}>{metricConfig[metric].title}</Text>
          <Text style={{ color: palette.subText, fontSize: 12 }}>{metricConfig[metric].subtitle}</Text>
        </View>

        <View style={{ marginLeft: 'auto' }}>
          <Text style={{ color: palette.subText, fontSize: 12, fontWeight: '700' }}>
            Optimally: {formatValue(optimalValue, metric)} {metricConfig[metric].unit}
          </Text>
        </View>
      </View>

      {/* Comparison row (this week vs last week) */}
      <View
        style={{
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.background,
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: palette.subText, fontSize: 12, fontWeight: '800' }}>
            This week vs last week
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={deltaIcon}
              size={16}
              color={Math.abs(delta.diff) < 1e-9 ? palette.subText : delta.diff > 0 ? palette.primary : theme.colors.danger}
            />
            <Text
              style={{
                color: Math.abs(delta.diff) < 1e-9 ? palette.subText : delta.diff > 0 ? palette.primary : theme.colors.danger,
                fontWeight: '900',
                fontSize: 12,
              }}
            >
              {deltaText} {metricConfig[metric].unit}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.subText, fontSize: 11, fontWeight: '700' }}>This week</Text>
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: '900', marginTop: 2 }}>
              {formatValue(thisWeekStats.total, metric)} {metricConfig[metric].unit}
            </Text>
            <Text style={{ color: palette.subText, fontSize: 11, marginTop: 2 }}>
              Avg/day: {formatValue(thisWeekStats.avg, metric)} {metricConfig[metric].unit}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.subText, fontSize: 11, fontWeight: '700' }}>Last week</Text>
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: '900', marginTop: 2 }}>
              {formatValue(lastWeekStats.total, metric)} {metricConfig[metric].unit}
            </Text>
            <Text style={{ color: palette.subText, fontSize: 11, marginTop: 2 }}>
              Avg/day: {formatValue(lastWeekStats.avg, metric)} {metricConfig[metric].unit}
            </Text>
          </View>
        </View>
      </View>

      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 6 }}>
        {chartData.map(item => {
          const value = item.value ?? 0;
          const h = value > 0 ? (value / maxValue) * 92 : 8;

          const isToday = item.key === todayKey;

          const stepGoal = 6000;
          const kcalGoal = goalKcal || 0;

          const barColor =
            value <= 0
              ? palette.border
              : metric === 'steps'
              ? value >= stepGoal
                ? palette.primary
                : palette.subText
              : metric === 'activeKcal'
              ? (kcalGoal > 0 ? value >= kcalGoal : value >= 400)
                ? palette.primary
                : palette.subText
              : metric === 'workoutMin'
              ? value >= 30
                ? palette.primary
                : palette.subText
              : value >= 1.5
              ? palette.primary
              : palette.subText;

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.75}
              onPress={() => openDay(item.key)}
              style={{ width: 40, alignItems: 'center' }}
            >
              <View
                style={{
                  width: 18,
                  height: h,
                  borderRadius: 10,
                  backgroundColor: barColor,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  fontWeight: isToday ? '900' : '700',
                  color: isToday ? palette.text : palette.subText,
                }}
              >
                {item.label}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 10, color: palette.subText }}>
                {value > 0
                  ? `${formatValue(value, metric)}${metricConfig[metric].unit ? ' ' + metricConfig[metric].unit : ''}`
                  : '--'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal: edit day */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
        <Pressable
          style={{ flex: 1, backgroundColor: palette.overlay, justifyContent: 'center', padding: 18 }}
          onPress={closeModal}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: palette.card100,
                borderRadius: theme.radius.lg,
                padding: 18,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900' }}>Edit day</Text>
              <Text style={{ color: palette.subText, marginTop: 4 }}>{selectedKey ?? ''}</Text>

              {/* Inputs */}
              <View style={{ marginTop: 14, gap: 10 }}>
                <Field label="Steps" value={stepsInput} onChangeText={setStepsInput} keyboardType="numeric" palette={palette} />
                <Field
                  label="Calories"
                  value={caloriesInput}
                  onChangeText={setCaloriesInput}
                  keyboardType="numeric"
                  palette={palette}
                />
                <Field
                  label="Exercise (min)"
                  value={exerciseInput}
                  onChangeText={setExerciseInput}
                  keyboardType="numeric"
                  palette={palette}
                />
                <Field
                  label="Water (L)"
                  value={waterInput}
                  onChangeText={setWaterInput}
                  keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  palette={palette}
                />
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                <TouchableOpacity
                  onPress={onClearDay}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.background,
                  }}
                >
                  <Text style={{ color: theme.colors.danger, fontWeight: '800' }}>Clear</Text>
                </TouchableOpacity>

                <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={closeModal} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
                    <Text style={{ color: palette.subText, fontWeight: '800' }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onSave}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: palette.primary,
                    }}
                  >
                    <Text style={{ color: palette.onPrimary, fontWeight: '900' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </View>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  palette: any;
}> = ({ label, value, onChangeText, keyboardType, palette }) => {
  return (
    <View>
      <Text style={{ color: palette.subText, fontSize: 12, marginBottom: 6, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder="0"
        placeholderTextColor={palette.subText}
        style={{
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 11,
          backgroundColor: palette.background,
          color: palette.text,
          fontWeight: '700',
        }}
      />
    </View>
  );
};

export default WeeklyStatsCard;
