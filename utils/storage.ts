import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FoodItem {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DayLog {
  date: string;
  meals: Record<MealKey, FoodItem[]>;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserSettings {
  name: string;
  targets: MacroTargets;
}

const SETTINGS_KEY = 'gaintrack_settings';
const DAY_LOG_PREFIX = 'gaintrack_day_';

export async function getSettings(): Promise<UserSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (raw) return JSON.parse(raw);
  return {
    name: 'Athlete',
    targets: { calories: 2500, protein: 180, carbs: 250, fat: 80 },
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function getDayLog(date: string): Promise<DayLog> {
  const raw = await AsyncStorage.getItem(DAY_LOG_PREFIX + date);
  if (raw) return JSON.parse(raw);
  return {
    date,
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  };
}

export async function saveDayLog(log: DayLog): Promise<void> {
  await AsyncStorage.setItem(DAY_LOG_PREFIX + log.date, JSON.stringify(log));
}

export async function addFoodToMeal(
  date: string,
  meal: MealKey,
  food: FoodItem
): Promise<void> {
  const log = await getDayLog(date);
  log.meals[meal] = [...log.meals[meal], food];
  await saveDayLog(log);
}

export async function removeFoodFromMeal(
  date: string,
  meal: MealKey,
  foodId: string
): Promise<void> {
  const log = await getDayLog(date);
  log.meals[meal] = log.meals[meal].filter((f) => f.id !== foodId);
  await saveDayLog(log);
}

export async function getAllDates(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys
    .filter((k) => k.startsWith(DAY_LOG_PREFIX))
    .map((k) => k.replace(DAY_LOG_PREFIX, ''))
    .sort()
    .reverse();
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
