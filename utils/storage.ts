import { supabase } from './supabase';

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

const DEFAULT_SETTINGS: UserSettings = {
  name: 'Athlete',
  targets: { calories: 2500, protein: 180, carbs: 250, fat: 80 },
};

const EMPTY_MEALS = (): Record<MealKey, FoodItem[]> => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: [],
});

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('user_settings')
      .select('name, targets')
      .eq('user_id', userId)
      .single();

    if (error || !data) return DEFAULT_SETTINGS;
    return { name: data.name, targets: data.targets };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const userId = await getUserId();
  await supabase
    .from('user_settings')
    .upsert({ user_id: userId, name: settings.name, targets: settings.targets })
    .eq('user_id', userId);
}

// ─── Day Logs ─────────────────────────────────────────────────────────────────

export async function getDayLog(date: string): Promise<DayLog> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('day_logs')
      .select('meals')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) return { date, meals: EMPTY_MEALS() };
    return { date, meals: data.meals };
  } catch {
    return { date, meals: EMPTY_MEALS() };
  }
}

export async function saveDayLog(log: DayLog): Promise<void> {
  const userId = await getUserId();
  await supabase
    .from('day_logs')
    .upsert({ user_id: userId, date: log.date, meals: log.meals });
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
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('day_logs')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map((r: { date: string }) => r.date);
  } catch {
    return [];
  }
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
