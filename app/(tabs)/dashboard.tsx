import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const isWeb = Platform.OS === 'web';
import { SafeAreaView } from 'react-native-safe-area-context';
import MacroRing from '../../components/MacroRing';
import MealSection from '../../components/MealSection';
import ScannerModal from '../../components/ScannerModal';
import { getDayTotals } from '../../utils/macros';
import { getGreeting, getMotivationalText } from '../../utils/greetings';
import {
  DayLog,
  FoodItem,
  MealKey,
  addFoodToMeal,
  getDayLog,
  getSettings,
  MacroTargets,
  removeFoodFromMeal,
  todayString,
  UserSettings,
} from '../../utils/storage';

function dateLabel(dateStr: string): string {
  const today = todayString();
  const d = new Date(dateStr + 'T00:00:00');
  if (dateStr === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function DashboardScreen() {
  const [currentDate, setCurrentDate] = useState(todayString());
  const [log, setLog] = useState<DayLog | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabAnim] = useState(new Animated.Value(0));
  const [pendingMeal, setPendingMeal] = useState<MealKey | null>(null);

  const load = useCallback(async () => {
    const [l, s] = await Promise.all([getDayLog(currentDate), getSettings()]);
    setLog(l);
    setSettings(s);
  }, [currentDate]);

  useEffect(() => {
    load();
  }, [load]);

  const targets: MacroTargets = settings?.targets ?? {
    calories: 2500,
    protein: 180,
    carbs: 250,
    fat: 80,
  };
  const totals = log ? getDayTotals(log) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const name = settings?.name ?? 'Athlete';

  function toggleFab() {
    setFabOpen((open) => {
      Animated.timing(fabAnim, {
        toValue: open ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return !open;
    });
  }

  function openScanner(meal?: MealKey) {
    setPendingMeal(meal ?? null);
    setScannerVisible(true);
    if (fabOpen) toggleFab();
  }

  async function handleSaveFood(
    meal: MealKey,
    food: Omit<FoodItem, 'id'>
  ) {
    const item: FoodItem = {
      ...food,
      id: Date.now().toString(),
    };
    await addFoodToMeal(currentDate, meal, item);
    load();
  }

  async function handleRemoveFood(meal: MealKey, id: string) {
    await removeFoodFromMeal(currentDate, meal, id);
    load();
  }

  const fabScanY = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const fabManualY = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const fabOpacity = fabAnim;

  const isToday = currentDate === todayString();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => setCurrentDate((d) => shiftDate(d, -1))}
        >
          <Text style={styles.dateArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{dateLabel(currentDate)}</Text>
        <TouchableOpacity
          style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}
          onPress={() => !isToday && setCurrentDate((d) => shiftDate(d, 1))}
        >
          <Text style={[styles.dateArrowText, isToday && { opacity: 0.2 }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        {isToday && (
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>{getGreeting(name)}</Text>
            <Text style={styles.motivText}>
              {getMotivationalText(totals, targets)}
            </Text>
          </View>
        )}

        {/* Calories hero */}
        <View style={styles.caloriesCard}>
          <View style={styles.caloriesRow}>
            <View>
              <Text style={styles.caloriesValue}>{Math.round(totals.calories)}</Text>
              <Text style={styles.caloriesLabel}>of {targets.calories} kcal</Text>
            </View>
            <View style={styles.caloriesBar}>
              <View
                style={[
                  styles.caloriesBarFill,
                  {
                    width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.caloriesRemaining}>
            {Math.max(0, Math.round(targets.calories - totals.calories))} kcal remaining
          </Text>
        </View>

        {/* Macro rings */}
        <View style={styles.ringsRow}>
          <MacroRing
            label="Protein"
            current={totals.protein}
            target={targets.protein}
            color="#F97316"
            size={80}
          />
          <MacroRing
            label="Carbs"
            current={totals.carbs}
            target={targets.carbs}
            color="#EAB308"
            size={80}
          />
          <MacroRing
            label="Fat"
            current={totals.fat}
            target={targets.fat}
            color="#EF4444"
            size={80}
          />
        </View>

        {/* Target row */}
        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={[styles.targetVal, { color: '#F97316' }]}>
              {targets.protein}g
            </Text>
            <Text style={styles.targetKey}>Protein</Text>
          </View>
          <View style={styles.targetDivider} />
          <View style={styles.targetItem}>
            <Text style={[styles.targetVal, { color: '#EAB308' }]}>
              {targets.carbs}g
            </Text>
            <Text style={styles.targetKey}>Carbs</Text>
          </View>
          <View style={styles.targetDivider} />
          <View style={styles.targetItem}>
            <Text style={[styles.targetVal, { color: '#EF4444' }]}>
              {targets.fat}g
            </Text>
            <Text style={styles.targetKey}>Fat</Text>
          </View>
        </View>

        {/* Meal sections */}
        <Text style={styles.sectionTitle}>Meals</Text>
        <View style={styles.meals}>
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map((meal) => (
            <MealSection
              key={meal}
              meal={meal}
              items={log?.meals[meal] ?? []}
              onAddFood={() => openScanner(meal)}
              onRemoveFood={handleRemoveFood}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — hidden on web (use Scan tab or + Add buttons instead) */}
      {isToday && !isWeb && (
        <View style={styles.fabContainer} pointerEvents="box-none">
          {/* Scan option */}
          <Animated.View
            style={[
              styles.fabOption,
              { transform: [{ translateY: fabScanY }], opacity: fabOpacity },
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <TouchableOpacity style={styles.fabOptionBtn} onPress={() => openScanner()}>
              <Text style={styles.fabOptionIcon}>📷</Text>
              <Text style={styles.fabOptionLabel}>Scan Label</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Manual option */}
          <Animated.View
            style={[
              styles.fabOption,
              { transform: [{ translateY: fabManualY }], opacity: fabOpacity },
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.fabOptionBtn}
              onPress={() => {
                setPendingMeal(null);
                setScannerVisible(true);
                if (fabOpen) toggleFab();
              }}
            >
              <Text style={styles.fabOptionIcon}>✏️</Text>
              <Text style={styles.fabOptionLabel}>Manual Entry</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
            <Animated.Text
              style={[
                styles.fabIcon,
                {
                  transform: [
                    {
                      rotate: fabAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '45deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              +
            </Animated.Text>
          </TouchableOpacity>
        </View>
      )}

      <ScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onSave={handleSaveFood}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateArrow: {
    padding: 8,
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  dateArrowText: {
    color: '#F97316',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  dateLabel: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  greeting: {
    paddingTop: 4,
    gap: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  motivText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  caloriesCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    gap: 10,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F3F4F6',
    lineHeight: 38,
  },
  caloriesLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  caloriesBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  caloriesBarFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 4,
  },
  caloriesRemaining: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  targetItem: {
    alignItems: 'center',
    gap: 2,
  },
  targetVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  targetKey: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetDivider: {
    width: 1,
    backgroundColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6',
    marginBottom: -8,
  },
  meals: {
    gap: 10,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  fabOption: {
    position: 'absolute',
    right: 0,
  },
  fabOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabOptionIcon: {
    fontSize: 16,
  },
  fabOptionLabel: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700',
    width: 90,
  },
});
