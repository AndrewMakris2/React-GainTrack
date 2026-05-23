import { FoodItem, DayLog, MacroTargets } from './storage';

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumMacros(items: FoodItem[]): MacroTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function getDayTotals(log: DayLog): MacroTotals {
  const all = [
    ...log.meals.breakfast,
    ...log.meals.lunch,
    ...log.meals.dinner,
    ...log.meals.snacks,
  ];
  return sumMacros(all);
}

export function getProgress(totals: MacroTotals, targets: MacroTargets) {
  return {
    calories: targets.calories > 0 ? Math.min(totals.calories / targets.calories, 1) : 0,
    protein: targets.protein > 0 ? Math.min(totals.protein / targets.protein, 1) : 0,
    carbs: targets.carbs > 0 ? Math.min(totals.carbs / targets.carbs, 1) : 0,
    fat: targets.fat > 0 ? Math.min(totals.fat / targets.fat, 1) : 0,
  };
}

export function formatMacro(value: number, unit = 'g'): string {
  return `${Math.round(value)}${unit}`;
}
