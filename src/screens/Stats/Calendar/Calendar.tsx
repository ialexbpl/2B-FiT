import React from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'moment/locale/en-gb';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import * as Notifications from 'expo-notifications';

import { useTheme } from '../../../context/ThemeContext';
import { theme } from '../../../styles/theme';
import { makeCalendarStyles } from '@screens/Stats/Calendar/CalendarStyles';

moment.updateLocale('en', { week: { dow: 1 } });

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ROW_HEIGHT = 96;

type ActivityType = 'workout' | 'meal' | 'other';

type CalendarEvent = {
  id: string;
  dateKey: string;
  type: ActivityType;
  start: string;
  end: string;
  description: string;
  notificationId?: string;
  reminderOffsetMin?: number;
};


const TYPE_COLORS: Record<ActivityType, string> = {
  workout: '#22c55e',
  meal: '#f59e0b',
  other: '#60a5fa',
};

const typeLabel = (t: ActivityType) =>
  t === 'workout' ? 'Workout' : t === 'meal' ? 'Meal' : 'Other';

const toDateKey = (d: Date) => moment(d).format('YYYY-MM-DD');
const isHHMM = (v: string) => /^\d{2}:\d{2}$/.test(v);
const toMinutes = (v: string) => {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const buildDateTime = (dateKey: string, hhmm: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, h ?? 0, m ?? 0, 0, 0);
};

const ensureNotificationPermission = async () => {
  const { status, granted } = await Notifications.getPermissionsAsync();

  if (granted || status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const req = await Notifications.requestPermissionsAsync();
  return req.granted || req.status === Notifications.PermissionStatus.GRANTED;
};


export default function Calendar() {
  const carouselRef = React.useRef<ICarouselInstance>(null);

  const [week, setWeek] = React.useState(0);
  const [value, setValue] = React.useState(new Date());

  const { palette } = useTheme();
  const styles = React.useMemo(() => makeCalendarStyles(palette, theme), [palette]);

  // === MODAL STATE ===
  const [modalVisible, setModalVisible] = React.useState(false);
  const [formType, setFormType] = React.useState<ActivityType>('workout');
  const [formStart, setFormStart] = React.useState('08:00');
  const [formEnd, setFormEnd] = React.useState('09:00');
  const [formDesc, setFormDesc] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const DESC_MAX = 140;

  const [formReminderOn, setFormReminderOn] = React.useState(true);
  const [formReminderOffset, setFormReminderOffset] = React.useState(1);

  // === EVENTS STATE (in-memory) ===
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);

  const selectedDateKey = React.useMemo(() => toDateKey(value), [value]);

  const dayEvents = React.useMemo(() => {
    return events
      .filter(e => e.dateKey === selectedDateKey)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [events, selectedDateKey]);

  const weeks = React.useMemo(() => {
    const center = moment(value).startOf('week');
    return [-1, 0, 1].map(adj =>
      Array.from({ length: 7 }).map((_, index) => {
        const date = moment(center).add(adj, 'week').add(index, 'day');
        return { weekday: date.format('ddd'), date: date.toDate() };
      })
    );
  }, [value]);

  const handleSnap = React.useCallback((index: number) => {
    if (index === 1) return;
    const delta = index - 1;
    setValue(prev => moment(prev).add(delta, 'week').toDate());
    setWeek(prev => prev + delta);
    requestAnimationFrame(() => {
      carouselRef.current?.scrollTo({ index: 1, animated: false });
    });
  }, []);

  const renderWeek = React.useCallback(
    ({ item: dates }: { item: { weekday: string; date: Date }[] }) => (
      <View style={styles.itemRow}>
        {dates.map((item, j) => {
          const isActive = value.toDateString() === item.date.toDateString();
          const isToday = new Date().toDateString() === item.date.toDateString();

          return (
            <Pressable
              key={`${item.date.getTime()}-${j}`}
              onPress={() => setValue(item.date)}
              style={[
                styles.item,
                isActive && { backgroundColor: palette.primary, borderColor: palette.primary },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.itemWeekday,
                  isActive && { color: palette.onPrimary },
                  isToday && !isActive && { color: theme.colors.danger },
                  isToday && isActive && { color: palette.text },
                ]}
              >
                {item.weekday}
              </Text>
              <Text
                style={[
                  styles.itemDate,
                  isActive && { color: palette.onPrimary },
                  isToday && !isActive && { color: theme.colors.danger },
                  isToday && isActive && { color: palette.text },
                ]}
              >
                {item.date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ),
    [palette.primary, palette.onPrimary, palette.text, styles.item, styles.itemDate, styles.itemRow, styles.itemWeekday, value]
  );

  // === OPEN/CLOSE MODAL ===
  const openModal = React.useCallback(() => {
    const now = new Date();
    const start = dateToHHMM(roundToStep(now, 5));
    const end = dateToHHMM(roundToStep(new Date(now.getTime() + 60 * 60000), 5));
    setFormType('workout');
    setFormStart(start);
    setFormEnd(end);
    setFormDesc('');
    setFormError(null);
    setFormReminderOn(true);
    setFormReminderOffset(1);
    setModalVisible(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setModalVisible(false);
  }, []);

  const durationMin = React.useMemo(() => {
    if (!isHHMM(formStart) || !isHHMM(formEnd)) return null;
    const d = toMinutes(formEnd) - toMinutes(formStart);
    return d > 0 ? d : null;
  }, [formStart, formEnd]);

  const canSave = React.useMemo(() => {
    if (!isHHMM(formStart) || !isHHMM(formEnd)) return false;
    if ((durationMin ?? 0) <= 0) return false;
    if (!formDesc.trim()) return false;
    return true;
  }, [formStart, formEnd, formDesc, durationMin]);

  const setPreset = React.useCallback((mins: number) => {
    if (!isHHMM(formStart)) return;
    const newEnd = fromMinutes(Math.min(23 * 60 + 55, toMinutes(formStart) + mins));
    setFormEnd(newEnd);
  }, [formStart]);

const onSave = React.useCallback(async () => {
  if (!isHHMM(formStart) || !isHHMM(formEnd)) {
    setFormError('Use format HH:MM (e.g., 08:30).');
    return;
  }
  if (toMinutes(formEnd) <= toMinutes(formStart)) {
    setFormError('End time must be later than start time.');
    return;
  }
  if (!formDesc.trim()) {
    setFormError('Add a short description.');
    return;
  }

  let notificationId: string | undefined;

  // === PLANOWANIE POWIADOMIENIA ===
  if (formReminderOn) {
    const allowed = await ensureNotificationPermission();
    if (!allowed) {
      Alert.alert(
        'Notifications disabled',
        'You can enable notifications for 2B FiT in system settings.'
      );
    } else {
      const startDate = buildDateTime(selectedDateKey, formStart);

      // --- DO TESTÓW: 1 Minuta przed startem ---
      const REMINDER_OFFSET_MIN = 1;
      const reminderDate = new Date(
        startDate.getTime() - REMINDER_OFFSET_MIN * 60 * 1000
      );

      const now = new Date();
      const diffSeconds = Math.max(1, Math.floor((reminderDate.getTime() - now.getTime()) / 1000));

      // jeśli powiadomienie w przeszłości lub za 5 sekund, to nie planuj
      if (reminderDate.getTime() <= now.getTime() + 5000) {
        console.log(
          '[Calendar] Reminder time already passed or is too soon, skipping schedule'
        );
        console.log(
          '[Calendar] Now:',
          new Date().toISOString()
        );
      } else {
        try {

          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: typeLabel(formType),
              body: formDesc.trim() || `${formStart} – ${formEnd}`,
              data: {
                dateKey: selectedDateKey,
                start: formStart,
                end: formEnd,
                type: formType,
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: diffSeconds,
            },
          });

          console.log(
            '[Calendar] Scheduled notification',
            notificationId,
            'at',
            reminderDate.toISOString()
          );
          console.log(
            '[Calendar] Now:',
            new Date().toISOString()
          );
          console.log('[Calendar] (in seconds):', diffSeconds);
        } catch (e) {
          console.warn('Failed to schedule notification', e);
        }
      }
    }
  }

  const newEvent: CalendarEvent = {
    id: `${Date.now()}`,
    dateKey: selectedDateKey,
    type: formType,
    start: formStart,
    end: formEnd,
    description: formDesc.trim(),
    notificationId,
    reminderOffsetMin: formReminderOn ? 1 : undefined,
  };

  setEvents(prev => [...prev, newEvent]);
  setModalVisible(false);
}, [
  formDesc,
  formEnd,
  formStart,
  formType,
  formReminderOn,
  selectedDateKey,
]);




  // === DELETE HANDLERS ===
  const deleteEvent = React.useCallback((id: string) => {
    setEvents(prev => {
      const target = prev.find(e => e.id === id);
      if (target?.notificationId) {
        Notifications.cancelScheduledNotificationAsync(target.notificationId).catch(
          (e) => console.warn('Failed to cancel notification', e)
        );
      }
      return prev.filter(e => e.id !== id);
    });
  }, []);


  const confirmDelete = React.useCallback((id: string) => {
    Alert.alert(
      'Delete event?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(id),
        },
      ],
      { cancelable: true }
    );
  }, [deleteEvent]);

  const renderEventItem = ({ item }: { item: CalendarEvent }) => (
    <View style={styles.eventItem}>
      <View style={[styles.eventDot, { backgroundColor: TYPE_COLORS[item.type] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTime}>{item.start} – {item.end}</Text>
        <Text style={styles.eventTitle}>{typeLabel(item.type)}</Text>
        {!!item.description && <Text style={styles.eventDesc}>{item.description}</Text>}
      </View>

      <Pressable
        onPress={() => confirmDelete(item.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Delete event"
        style={{
          alignSelf: 'center',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.card,
        }}
        android_ripple={{ color: palette.border }}
      >
        <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: 12 }}>
          Delete
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>
            {value.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <View style={styles.picker}>
          <Carousel
            ref={carouselRef}
            width={SCREEN_WIDTH}
            height={ROW_HEIGHT}
            data={weeks}
            renderItem={renderWeek}
            defaultIndex={1}
            loop={false}
            pagingEnabled
            snapEnabled
            scrollAnimationDuration={220}
            onSnapToItem={handleSnap}
            style={{ overflow: 'visible' }}
          />
        </View>

        <View style={styles.eventsHeaderRow}>
          <Text style={styles.eventsHeader}>Events</Text>
        </View>

        <ScrollView
          style={{ maxHeight: 200 }}
          contentContainerStyle={styles.eventsList}
        >
          {dayEvents.length === 0 ? (
            <Text style={styles.emptyText}>No events for this day.</Text>
          ) : (
            dayEvents.map((event) => (
              <View key={event.id}>
                {renderEventItem({ item: event })}
              </View>
            ))
          )}
        </ScrollView>

      </View>

      <Pressable
        onPress={openModal}
        style={styles.fab}
        android_ripple={{ color: palette.border }}
        accessibilityRole="button"
        accessibilityLabel="Add event"
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingKeyboardWrapper>
          <Pressable style={[styles.modalOverlay, { backgroundColor: palette.overlay }]} onPress={closeModal}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.handle} />

                <View style={styles.modalHeader}>
                  <View style={styles.dateCol}>
                    <Text style={styles.modalTitle}>New</Text>
                    <Text style={styles.modalSubtitle}>
                      {moment(selectedDateKey).locale('en').format('dddd, D MMMM YYYY')}
                    </Text>
                  </View>
                  <View style={styles.typePill}>
                    <View style={[styles.typeDot, { backgroundColor: TYPE_COLORS[formType] }]} />
                    <Text style={styles.typePillText}>{typeLabel(formType)}</Text>
                  </View>
                </View>

                <View style={styles.segmentRow}>
                  {(['workout', 'meal', 'other'] as ActivityType[]).map(t => {
                    const active = formType === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setFormType(t)}
                        style={[
                          styles.segmentBtn,
                          active && { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <View style={styles.segmentInner}>
                          <View style={[styles.segmentDot, { backgroundColor: active ? palette.onPrimary : TYPE_COLORS[t] }]} />
                          <Text style={[styles.segmentText, active && { color: palette.onPrimary }]}>
                            {typeLabel(t)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* === Time pickery === */}
                <View style={styles.row}>
                  <TimeField
                    label="Start"
                    value={formStart}
                    onChange={(t) => { setFormStart(t); setFormError(null); }}
                    style={{ marginRight: 8 }}
                    palette={palette}
                    minuteStep={5}
                  />
                  <TimeField
                    label="End"
                    value={formEnd}
                    onChange={(t) => { setFormEnd(t); setFormError(null); }}
                    style={{ marginLeft: 8 }}
                    palette={palette}
                    minuteStep={5}
                  />
                </View>

                <View style={styles.presetRow}>
                  {[30, 60, 90].map(m => (
                    <Pressable
                      key={m}
                      onPress={() => setPreset(m)}
                      style={styles.presetChip}
                      accessibilityRole="button"
                      accessibilityLabel={`Set duration ${m} minutes`}
                    >
                      <Text style={styles.presetChipText}>{m} min</Text>
                    </Pressable>
                  ))}
                  {durationMin != null && (
                    <View style={styles.durationPill}>
                      <Text style={styles.durationText}>
                        Duration: {durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ` : ''}{durationMin % 60 ? `${durationMin % 60}m` : (durationMin >= 60 ? '' : `${durationMin}m`)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.reminderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderLabel}>Reminder</Text>
                    <Text style={styles.reminderHint}>
                      Notify me {formReminderOffset} minutes before start
                    </Text>
                  </View>
                  <Switch
                    value={formReminderOn}
                    onValueChange={setFormReminderOn}
                    thumbColor={formReminderOn ? palette.primary : palette.border}
                    trackColor={{ false: palette.border, true: palette.primary }}
                  />
                </View>

                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.charCounter}>{formDesc.length}/{DESC_MAX}</Text>
                  </View>
                  <TextInput
                    value={formDesc}
                    onChangeText={(t) => { setFormDesc(t); setFormError(null); }}
                    placeholder="Description..."
                    placeholderTextColor={palette.subText}
                    style={[styles.input, { height: 96, textAlignVertical: 'top', paddingTop: 10 }]}
                    multiline
                    maxLength={DESC_MAX}
                  />
                </View>

                {!!formError && <Text style={styles.errorText}>{formError}</Text>}

                <View style={styles.modalActions}>
                  <Pressable onPress={closeModal} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
                    <Text style={styles.btnGhostText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={onSave}
                    disabled={!canSave}
                    style={[
                      styles.btn,
                      styles.btnPrimary,
                      !canSave && styles.btnDisabled,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnPrimaryText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Pressable>
        </KeyboardAvoidingKeyboardWrapper>
      </Modal>
    </SafeAreaView>
  );
}

/** Wrapper: iOS przesuwa kartę nad klawiaturą */
const KeyboardAvoidingKeyboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1 }}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

/** === TimeField (natywny picker czasu) === */

const roundToStep = (date: Date, step = 5) => {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const rounded = Math.round(minutes / step) * step;
  d.setMinutes(Math.min(rounded, 55), 0, 0);
  return d;
};

const dateToHHMM = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const hhmmToDate = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(isFinite(h) ? h : 0, isFinite(m) ? m : 0, 0, 0);
  return d;
};

const TimeField: React.FC<{
  label: string;
  value: string;                  // "HH:MM"
  onChange: (t: string) => void;
  style?: any;
  palette: any;
  minuteStep?: number;
}> = ({ label, value, onChange, style, palette, minuteStep = 5 }) => {
  const { isDark } = useTheme();
  const [open, setOpen] = React.useState(false);

  const current = React.useMemo(() => {
    const d = hhmmToDate(value);
    return roundToStep(d, minuteStep);
  }, [value, minuteStep]);

  const onChangeAndroid = (_: any, selected?: Date) => {
    // Android: dialog zamyka się sam – domknij stan i ustaw wartość
    setOpen(false);
    if (!selected) return;
    onChange(dateToHHMM(roundToStep(selected, minuteStep)));
  };

  return (
    <View style={[{ flex: 1 }, style]}>
      <Text style={{ fontSize: 12, color: palette.subText, marginBottom: 6 }}>{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={[
          {
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: palette.background,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        ]}
        android_ripple={{ color: palette.border }}
        accessibilityRole="button"
        accessibilityLabel={`${label} time picker`}
      >
        <Text style={{ color: value ? palette.text : palette.subText, fontSize: 14 }}>
          {value || '00:00'}
        </Text>
        <Text style={{ color: palette.subText, fontWeight: '700' }}>⌵</Text>
      </Pressable>

      {open && ( //Set: display={Platform.OS === 'ios' ? 'compact' : 'default'}
        Platform.OS === 'ios' ? (
          <View
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              // Use opaque card background to ensure wheel text contrast
              backgroundColor: palette.card100,
              overflow: 'hidden',
            }}
          >
            <DateTimePicker
              value={current}
              mode="time"
              display="spinner"
              // Force visible text color and correct theme on iOS
              themeVariant={isDark ? 'dark' : 'light'}
              textColor={palette.text}
              style={{ height: 216 }}
              onChange={(_, d) => {
                if (!d) return;
                onChange(dateToHHMM(roundToStep(d, minuteStep)));
              }}
              // iOS wspiera krok minut przez minuteInterval
              minuteInterval={minuteStep as any}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 8 }}>
              <Pressable
                onPress={() => setOpen(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.border }}
              >
                <Text style={{ color: palette.text, fontWeight: '700' }}>Close</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <DateTimePicker
            value={current}
            mode="time"
            display="default"
            is24Hour
            onChange={onChangeAndroid}
          />
        )
      )}
    </View>
  );
};
