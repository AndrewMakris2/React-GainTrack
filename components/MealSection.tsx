import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FoodItem, MealKey } from '../utils/storage';
import { sumMacros } from '../utils/macros';
import FoodCard from './FoodCard';

const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const MEAL_ICONS: Record<MealKey, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '⚡',
};

interface Props {
  meal: MealKey;
  items: FoodItem[];
  onAddFood: (meal: MealKey) => void;
  onRemoveFood: (meal: MealKey, id: string) => void;
}

export default function MealSection({ meal, items, onAddFood, onRemoveFood }: Props) {
  const [expanded, setExpanded] = useState(true);
  const totals = sumMacros(items);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{MEAL_ICONS[meal]}</Text>
          <View>
            <Text style={styles.mealName}>{MEAL_LABELS[meal]}</Text>
            {items.length > 0 && (
              <Text style={styles.mealSummary}>
                {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddFood(meal)}
            hitSlop={8}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.items}>
          {items.length === 0 ? (
            <Text style={styles.empty}>No foods logged yet</Text>
          ) : (
            items.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onRemove={() => onRemoveFood(meal, item.id)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 20,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  mealSummary: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addBtn: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    color: '#6B7280',
    fontSize: 10,
  },
  items: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  empty: {
    color: '#4B5563',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
});
