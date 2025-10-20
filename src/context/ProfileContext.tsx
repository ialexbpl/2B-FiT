import React, { createContext, useContext, useMemo, useState } from 'react';

export type ProfileData = {
  age: string;
  height: string;
  weight: string;
  goalWeight: string;
  activityLevel: string | null;
  allergies: string[];
};

type ProfileContextValue = ProfileData & {
  setAge: (v: string) => void;
  setHeight: (v: string) => void;
  setWeight: (v: string) => void;
  setGoalWeight: (v: string) => void;
  setActivityLevel: (v: string | null) => void;
  setAllergies: (v: string[]) => void;
};

const defaultValue: ProfileContextValue = {
  age: '25',
  height: '180',
  weight: '75',
  goalWeight: '70',
  activityLevel: 'Moderate',
  allergies: [],
  setAge: () => {},
  setHeight: () => {},
  setWeight: () => {},
  setGoalWeight: () => {},
  setActivityLevel: () => {},
  setAllergies: () => {},
};

const ProfileContext = createContext<ProfileContextValue>(defaultValue);

export const ProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [age, setAge] = useState(defaultValue.age);
  const [height, setHeight] = useState(defaultValue.height);
  const [weight, setWeight] = useState(defaultValue.weight);
  const [goalWeight, setGoalWeight] = useState(defaultValue.goalWeight);
  const [activityLevel, setActivityLevel] = useState<string | null>(defaultValue.activityLevel);
  const [allergies, setAllergies] = useState<string[]>(defaultValue.allergies);

  const value = useMemo<ProfileContextValue>(() => ({
    age,
    height,
    weight,
    goalWeight,
    activityLevel,
    allergies,
    setAge,
    setHeight,
    setWeight,
    setGoalWeight,
    setActivityLevel,
    setAllergies,
  }), [age, height, weight, goalWeight, activityLevel, allergies]);

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);

