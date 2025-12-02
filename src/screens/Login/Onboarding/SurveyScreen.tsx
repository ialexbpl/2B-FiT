import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { theme } from '../../../styles/theme';
import { supabase } from '../../../utils/supabase';
import { surveyStyles as styles } from './SurveyScreenStyle';
import { useProfile } from '@context/ProfileContext';


const SEX_OPTIONS = ['Male', 'Female'] as const;
const ACTIVITY_OPTIONS = ['Low', 'Moderate', 'High', 'Very High'] as const;
const ALLERGY_OPTIONS = [
  'Gluten',
  'Lactose',
  'Nuts',
  'Soy',
  'Eggs',
  'Fish',
  'No allergies',
] as const;

type Sex = (typeof SEX_OPTIONS)[number];
type ActivityLevel = (typeof ACTIVITY_OPTIONS)[number];
type Allergy = (typeof ALLERGY_OPTIONS)[number];

type FormErrors = Partial<{
  sex: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  goal_weight_kg: string;
  activity_level: string;
  allergies: string;
}>;

type SurveyProps = {
  onCompleted?: () => void;
};

export const SurveyScreen: React.FC<SurveyProps> = ({ onCompleted }) => {
  const { palette } = useTheme();

  const { refreshProfileSettings } = useProfile();

  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [goalWeightKg, setGoalWeightKg] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const toggleAllergy = useCallback(
    (option: Allergy) => {
      if (option === 'No allergies') {
        if (allergies.includes('No allergies')) {
          setAllergies([]);
        } else {
          setAllergies(['No allergies']);
        }
        return;
      }

      const filtered = allergies.filter(a => a !== 'No allergies');
      if (filtered.includes(option)) {
        setAllergies(filtered.filter(a => a !== option));
      } else {
        setAllergies([...filtered, option]);
      }
    },
    [allergies],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!sex) newErrors.sex = 'Please select your sex.';

    const ageNum = parseInt(age, 10);
    if (!age) newErrors.age = 'Age is required.';
    else if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      newErrors.age = 'Age must be between 13 and 100.';
    }

    const heightNum = parseInt(heightCm, 10);
    if (!heightCm) newErrors.height_cm = 'Height is required.';
    else if (Number.isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      newErrors.height_cm = 'Height must be between 100 and 250 cm.';
    }

    const weightNum = parseFloat(weightKg);
    if (!weightKg) newErrors.weight_kg = 'Weight is required.';
    else if (Number.isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      newErrors.weight_kg = 'Weight must be between 30 and 300 kg.';
    }

    const goalWeightNum = parseFloat(goalWeightKg);
    if (!goalWeightKg) newErrors.goal_weight_kg = 'Goal weight is required.';
    else if (Number.isNaN(goalWeightNum) || goalWeightNum < 30 || goalWeightNum > 300) {
      newErrors.goal_weight_kg = 'Goal weight must be between 30 and 300 kg.';
    }

    if (!activityLevel) {
      newErrors.activity_level = 'Please select your activity level.';
    }

    if (!allergies || allergies.length === 0) {
      newErrors.allergies =
        'Select at least one allergy or "No allergies".';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sex, age, heightCm, weightKg, goalWeightKg, activityLevel, allergies]);

  const handleSubmit = useCallback(async () => {
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setApiError('Unable to get current user. Please sign in again.');
        await supabase.auth.signOut();
        return;
      }

      // Ensure profiles row exists (may be missing if user was deleted manually).
      const fallbackUsername = user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 8)}`;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: (user.user_metadata as any)?.username || fallbackUsername,
          full_name: (user.user_metadata as any)?.full_name || user.email || fallbackUsername,
          avatar_url: (user.user_metadata as any)?.avatar_url || null,
        }, { onConflict: 'id' });
      if (profileError) {
        console.error(profileError);
        setApiError('Failed to create your profile. Please sign in again.');
        await supabase.auth.signOut();
        return;
      }

      const { error: upsertError } = await supabase
        .from('profile_settings')
        .upsert({
          id: user.id,
          sex,
          age: parseInt(age, 10),
          height_cm: parseInt(heightCm, 10),
          weight_kg: parseFloat(weightKg),
          goal_weight_kg: parseFloat(goalWeightKg),
          activity_level: activityLevel,
          allergies,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error(upsertError);
        setApiError('Failed to save your profile. Please try again.');
        return;
      }

      try {
        await refreshProfileSettings();
      } catch (e) {
        console.warn('Failed to refresh profile settings after survey', e);
      }

      if (onCompleted) {
        onCompleted();
      }

    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    sex,
    age,
    heightCm,
    weightKg,
    goalWeightKg,
    activityLevel,
    allergies,
  ]);

  return (
    <View style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.card100,
                borderColor: palette.border,
                ...theme.shadow.md,
              },
            ]}
          >
            <Text style={[styles.title, { color: palette.text, textAlign: 'center' }]}>
              Tell us about yourself
            </Text>
            <Text style={[styles.subtitle, { color: palette.subText, textAlign: 'center' }]}>
              We will personalize your experience based on these details.
            </Text>

            {/* Sex */}
            <Text style={[styles.label, { color: palette.text }]}>Sex</Text>
            <View style={styles.chipRow}>
              {SEX_OPTIONS.map(option => {
                const selected = sex === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setSex(option)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? palette.primary : palette.border,
                        backgroundColor: selected ? palette.primary : palette.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? palette.onPrimary : palette.text,
                        fontWeight: selected ? '600' : '400',
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.sex && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.sex}
              </Text>
            )}

            {/* Age */}
            <Text style={[styles.label, { color: palette.text }]}>Age</Text>
            <TextInput
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 28"
              placeholderTextColor={palette.subText}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: errors.age ? theme.colors.danger : palette.border,
                  backgroundColor: palette.card,
                },
              ]}
            />
            {errors.age && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.age}
              </Text>
            )}

            {/* Height */}
            <Text style={[styles.label, { color: palette.text }]}>Height (cm)</Text>
            <TextInput
              keyboardType="number-pad"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="e.g. 178"
              placeholderTextColor={palette.subText}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: errors.height_cm ? theme.colors.danger : palette.border,
                  backgroundColor: palette.card,
                },
              ]}
            />
            {errors.height_cm && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.height_cm}
              </Text>
            )}

            {/* Weight */}
            <Text style={[styles.label, { color: palette.text }]}>Weight (kg)</Text>
            <TextInput
              keyboardType="decimal-pad"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="e.g. 82.5"
              placeholderTextColor={palette.subText}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: errors.weight_kg ? theme.colors.danger : palette.border,
                  backgroundColor: palette.card,
                },
              ]}
            />
            {errors.weight_kg && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.weight_kg}
              </Text>
            )}

            {/* Goal weight */}
            <Text style={[styles.label, { color: palette.text }]}>
              Goal weight (kg)
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              value={goalWeightKg}
              onChangeText={setGoalWeightKg}
              placeholder="e.g. 75"
              placeholderTextColor={palette.subText}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: errors.goal_weight_kg
                    ? theme.colors.danger
                    : palette.border,
                  backgroundColor: palette.card,
                },
              ]}
            />
            {errors.goal_weight_kg && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.goal_weight_kg}
              </Text>
            )}

            {/* Activity level */}
            <Text style={[styles.label, { color: palette.text }]}>Activity level</Text>
            <View style={styles.chipRow}>
              {ACTIVITY_OPTIONS.map(option => {
                const selected = activityLevel === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setActivityLevel(option)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? palette.primary : palette.border,
                        backgroundColor: selected ? palette.primary : palette.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? palette.onPrimary : palette.text,
                        fontWeight: selected ? '600' : '400',
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.activity_level && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.activity_level}
              </Text>
            )}

            {/* Allergies */}
            <Text style={[styles.label, { color: palette.text }]}>Allergies</Text>
            <View style={styles.chipRow}>
              {ALLERGY_OPTIONS.map(option => {
                const selected = allergies.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleAllergy(option)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? palette.primary : palette.border,
                        backgroundColor: selected ? palette.primary : palette.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? palette.onPrimary : palette.text,
                        fontWeight: selected ? '600' : '400',
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {errors.allergies && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {errors.allergies}
              </Text>
            )}


            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[
                styles.submitButton,
                {
                  backgroundColor: palette.primary,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <Text style={[styles.submitText, { color: palette.onPrimary }]}>
                  Continue
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SurveyScreen;
