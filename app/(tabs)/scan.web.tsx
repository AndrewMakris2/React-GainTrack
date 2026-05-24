// Web version — camera not available, show manual entry only
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FoodItem, MealKey, addFoodToMeal, todayString } from '../../utils/storage';

const MEAL_OPTIONS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

export default function ScanScreenWeb() {
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saved, setSaved] = useState(false);

  function reset() {
    setFoodName('');
    setServingSize('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  }

  async function save() {
    if (!foodName.trim()) {
      Alert.alert('Missing Name', 'Please enter a food name.');
      return;
    }
    const item: FoodItem = {
      id: Date.now().toString(),
      name: foodName.trim(),
      servingSize: servingSize.trim() || '1 serving',
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    };
    await addFoodToMeal(todayString(), selectedMeal, item);
    setSaved(true);
    setTimeout(() => { setSaved(false); reset(); }, 1600);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Food</Text>
        <Text style={styles.subtitle}>
          📷 Camera scanning is available on the mobile app
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {saved && (
            <View style={styles.savedBanner}>
              <Text style={styles.savedText}>✓ Food logged!</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>Log to Meal</Text>
          <View style={styles.mealPicker}>
            {MEAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, selectedMeal === opt.key && styles.chipActive]}
                onPress={() => setSelectedMeal(opt.key)}
              >
                <Text style={[styles.chipText, selectedMeal === opt.key && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Food Name</Text>
          <TextInput
            style={styles.input}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="e.g. Chicken Breast"
            placeholderTextColor="#4B5563"
          />

          <Text style={styles.sectionLabel}>Serving Size</Text>
          <TextInput
            style={styles.input}
            value={servingSize}
            onChangeText={setServingSize}
            placeholder="e.g. 100g, 1 cup"
            placeholderTextColor="#4B5563"
          />

          <Text style={styles.sectionLabel}>Macros</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.macroLabel}>Calories</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.macroInput} value={calories} onChangeText={setCalories} keyboardType="decimal-pad" placeholderTextColor="#4B5563" placeholder="0" />
                <Text style={styles.unit}>kcal</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.macroLabel, { color: '#F97316' }]}>Protein</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.macroInput} value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholderTextColor="#4B5563" placeholder="0" />
                <Text style={styles.unit}>g</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.macroLabel, { color: '#EAB308' }]}>Carbs</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.macroInput} value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholderTextColor="#4B5563" placeholder="0" />
                <Text style={styles.unit}>g</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.macroLabel, { color: '#EF4444' }]}>Fat</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.macroInput} value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholderTextColor="#4B5563" placeholder="0" />
                <Text style={styles.unit}>g</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Log Food</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    gap: 4,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#F3F4F6' },
  subtitle: { fontSize: 13, color: '#6B7280' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  savedBanner: {
    backgroundColor: '#14532D',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  savedText: { color: '#4ADE80', fontWeight: '700', fontSize: 14 },
  sectionLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  mealPicker: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  chipActive: { backgroundColor: '#431407', borderColor: '#F97316' },
  chipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#F97316' },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%' },
  macroLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 10,
  },
  macroInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 9,
  },
  unit: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
