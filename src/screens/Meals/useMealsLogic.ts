import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@context/AuthContext";
import {
  fetchDailyLog,
  deleteLogEntry,
  calculateSummary,
} from "@utils/mealsApi";
import type { LogEntry, MealType } from "@models/MealModel";

export const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

export function useMealsLogic() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const today = new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"diary" | "foods">("diary");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const fetchedLogs = await fetchDailyLog(userId, today);
      setLogs(fetchedLogs);
    } catch (e) {
      Alert.alert("Error", "Failed to load diary.");
    } finally {
      setLoading(false);
    }
  }, [today, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteLogEntry(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      Alert.alert("Error", "Failed to delete entry.");
    }
  };

  const diarySummary = useMemo(() => calculateSummary(logs), [logs]);

  return {
    state: {
      activeTab,
      loading,
      logs,
      diarySummary,
    },
    actions: {
      setActiveTab,
      handleDeleteLog,
      refreshLogs: loadData,
    },
  };
}
