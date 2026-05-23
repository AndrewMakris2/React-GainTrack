import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FoodItem } from '../utils/storage';

interface Props {
  item: FoodItem;
  onRemove?: () => void;
}

const COLORS = {
  protein: '#F97316',
  carbs: '#EAB308',
  fat: '#EF4444',
};

export default function FoodCard({ item, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.serving}>{item.servingSize}</Text>
        <View style={styles.macros}>
          <Text style={[styles.macro, { color: COLORS.protein }]}>
            {Math.round(item.protein)}g P
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.macro, { color: COLORS.carbs }]}>
            {Math.round(item.carbs)}g C
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.macro, { color: COLORS.fat }]}>
            {Math.round(item.fat)}g F
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.calories}>{Math.round(item.calories)}</Text>
        <Text style={styles.kcal}>kcal</Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.remove} hitSlop={8}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  left: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  serving: {
    fontSize: 12,
    color: '#6B7280',
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  macro: {
    fontSize: 12,
    fontWeight: '700',
  },
  dot: {
    color: '#4B5563',
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 12,
  },
  calories: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  kcal: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  remove: {
    marginTop: 6,
  },
  removeText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
