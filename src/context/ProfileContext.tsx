import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Sex } from '@models/ProfileModel'; // or from @utils/nutrition if you prefer

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