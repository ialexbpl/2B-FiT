import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Sex } from '@models/ProfileModel'; 
import { useAuth } from '@context/AuthContext';
import { fetchProfileSettings, upsertProfileSettings } from '@utils/profileSettingsApi';
import { loadProfileSettingsCache, saveProfileSettingsCache } from '@utils/profileSettingsCache';

export type ProfileData = {
  sex: Sex;                  // NEW
  age: string;
  height: string;
  weight: string;
  goalWeight: string;
  activityLevel: string | null;
  allergies: string[];
};

type ProfileContextValue = ProfileData & {
  setSex: (v: Sex) => void;  // NEW
  setAge: (v: string) => void;
  setHeight: (v: string) => void;
  setWeight: (v: string) => void;
  setGoalWeight: (v: string) => void;
  setActivityLevel: (v: string | null) => void;
  setAllergies: (v: string[]) => void;
};

const defaultValue: ProfileContextValue = {
  sex: 'Male',
  age: '25',
  height: '180',
  weight: '75',
  goalWeight: '70',
  activityLevel: 'Moderate',
  allergies: [],
  setSex: () => {},
  setAge: () => {},
  setHeight: () => {},
  setWeight: () => {},
  setGoalWeight: () => {},
  setActivityLevel: () => {},
  setAllergies: () => {},
};

const ProfileContext = createContext<ProfileContextValue>(defaultValue);

export const ProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [sex, setSex] = useState<Sex>(defaultValue.sex); // NEW
  const [age, setAge] = useState(defaultValue.age);
  const [height, setHeight] = useState(defaultValue.height);
  const [weight, setWeight] = useState(defaultValue.weight);
  const [goalWeight, setGoalWeight] = useState(defaultValue.goalWeight);
  const [activityLevel, setActivityLevel] = useState<string | null>(defaultValue.activityLevel);
  const [allergies, setAllergies] = useState<string[]>(defaultValue.allergies);
  const { session } = useAuth();

  // Load once on login:
  // 1) Try local cache (AsyncStorage) so we have values offline / before network
  // 2) Then fetch from Supabase; Supabase is the source of truth and overwrites cache
  useEffect(() => {
    const load = async () => {
      if (!session?.user) return;
      // Load cached values first (for offline / fast startup)
      const cached = await loadProfileSettingsCache();
      if (cached) {
        if (cached.sex) setSex(cached.sex as Sex);
        if (cached.age != null) setAge(String(cached.age));
        if (cached.height_cm != null) setHeight(String(cached.height_cm));
        if (cached.weight_kg != null) setWeight(String(cached.weight_kg));
        if (cached.goal_weight_kg != null) setGoalWeight(String(cached.goal_weight_kg));
        if (cached.activity_level) setActivityLevel(cached.activity_level);
      }

      // Then fetch from Supabase and override with server truth if present
      const row = await fetchProfileSettings(session.user.id);
      if (row) {
        if (row.sex) setSex(row.sex as Sex);
        if (row.age != null) setAge(String(row.age));
        if (row.height_cm != null) setHeight(String(row.height_cm));
        if (row.weight_kg != null) setWeight(String(row.weight_kg));
        if (row.goal_weight_kg != null) setGoalWeight(String(row.goal_weight_kg));
        if (row.activity_level) setActivityLevel(row.activity_level);
      }
    };
    load();
  }, [session?.user?.id]);

  // Save whenever settings change (debounced):
  // - Upsert to Supabase (per-user row in profile_settings)
  // - Cache locally so next app start has immediate values, even offline
  useEffect(() => {
    if (!session?.user) return;
    const timeout = setTimeout(() => {
      upsertProfileSettings(session.user.id, {
        sex,
        age: Number(age) || null,
        height_cm: Number(height) || null,
        weight_kg: Number(weight) || null,
        goal_weight_kg: Number(goalWeight) || null,
        activity_level: activityLevel as any,
      }).catch(err => console.error('Failed to save profile settings', err));
      // Also cache locally for offline/startup use
      saveProfileSettingsCache({
        sex,
        age: Number(age) || null,
        height_cm: Number(height) || null,
        weight_kg: Number(weight) || null,
        goal_weight_kg: Number(goalWeight) || null,
        activity_level: activityLevel as any,
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [session?.user?.id, sex, age, height, weight, goalWeight, activityLevel]);

  const value = useMemo<ProfileContextValue>(() => ({
    sex,
    age,
    height,
    weight,
    goalWeight,
    activityLevel,
    allergies,
    setSex,
    setAge,
    setHeight,
    setWeight,
    setGoalWeight,
    setActivityLevel,
    setAllergies,
  }), [sex, age, height, weight, goalWeight, activityLevel, allergies]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => useContext(ProfileContext);
