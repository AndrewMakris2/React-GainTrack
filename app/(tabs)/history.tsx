import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../components/ProgressBar';
import { getDayTotals } from '../../utils/macros';
import {
  DayLog,
  MacroTargets,
  UserSettings,
  getAllDates,
  getDayLog,
  getSettings,
} from '../../utils/storage';

interface DaySummary {
  date: string;
  log: DayLog;
  totals: ReturnType<typeof getDayTotals>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function DayCard({
  summary,
  targets,
  expanded,
  onToggle,
}: {
  summary: DaySummary;
  targets: MacroTargets;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { totals, log } = summary;
  const calPct = targets.calories > 0
    ? Math.round((totals.calories / targets.calories) * 100)
    : 0;

  const totalItems = Object.values(log.meals).reduce((s, items) => s + items.length, 0);

  return (
    <TouchableOpacity
      style={styles.dayCard}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayDate}>{formatDate(summary.date)}</Text>
          <Text style={styles.dayMeta}>
            {totalItems} food{totalItems !== 1 ? 's' : ''} logged
          </Text>
        </View>
        <View style={styles.dayRight}>
          <Text style={styles.dayCalories}>{Math.round(totals.calories)}</Text>
          <Text style={styles.dayKcal}>kcal</Text>
          <View
            style={[
              styles.pctBadge,
              calPct >= 90 && calPct <= 110
                ? styles.pctGood
                : calPct > 110
                ? styles.pctOver
                : styles.pctLow,
            ]}
          >
            <Text style={styles.pctText}>{calPct}%</Text>
          </View>
        </View>
      </View>

      {expanded && (
        <View style={styles.dayExpanded}>
          <View style={styles.macroPills}>
            <View style={[styles.pill, { borderColor: '#F97316' }]}>
              <Text style={[styles.pillVal, { color: '#F97316' }]}>
                {Math.round(totals.protein)}g
              </Text>
              <Text style={styles.pillLabel}>P</Text>
            </View>
            <View style={[styles.pill, { borderColor: '#EAB308' }]}>
              <Text style={[styles.pillVal, { color: '#EAB308' }]}>
                {Math.round(totals.carbs)}g
              </Text>
              <Text style={styles.pillLabel}>C</Text>
            </View>
            <View style={[styles.pill, { borderColor: '#EF4444' }]}>
              <Text style={[styles.pillVal, { color: '#EF4444' }]}>
                {Math.round(totals.fat)}g
              </Text>
              <Text style={styles.pillLabel}>F</Text>
            </View>
          </View>

          <View style={styles.bars}>
            <ProgressBar
              label="Protein"
              current={totals.protein}
              target={targets.protein}
              color="#F97316"
            />
            <ProgressBar
              label="Carbs"
              current={totals.carbs}
              target={targets.carbs}
              color="#EAB308"
            />
            <ProgressBar
              label="Fat"
              current={totals.fat}
              target={targets.fat}
              color="#EF4444"
            />
          </View>

          {/* Meal breakdown */}
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => {
            const items = log.meals[meal];
            if (items.length === 0) return null;
            const mealCals = items.reduce((s, i) => s + i.calories, 0);
            return (
              <View key={meal} style={styles.mealRow}>
                <Text style={styles.mealName}>
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </Text>
                <Text style={styles.mealItems}>
                  {items.map((i) => i.name).join(', ')}
                </Text>
                <Text style={styles.mealCals}>{Math.round(mealCals)} kcal</Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [dates, s] = await Promise.all([getAllDates(), getSettings()]);
    setSettings(s);
    const results: DaySummary[] = await Promise.all(
      dates.map(async (date) => {
        const log = await getDayLog(date);
        return { date, log, totals: getDayTotals(log) };
      })
    );
    setSummaries(results);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const targets = settings?.targets ?? {
    calories: 2500,
    protein: 180,
    carbs: 250,
    fat: 80,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{summaries.length} days logged</Text>
      </View>

      {summaries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>
            Start logging meals on the Dashboard to see your history here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={summaries}
          keyExtractor={(s) => s.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DayCard
              summary={item}
              targets={targets}
              expanded={expandedDate === item.date}
              onToggle={() =>
                setExpandedDate((d) => (d === item.date ? null : item.date))
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#F3F4F6' },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  dayMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dayRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dayCalories: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F3F4F6',
  },
  dayKcal: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  pctGood: { backgroundColor: '#14532D' },
  pctOver: { backgroundColor: '#450A0A' },
  pctLow: { backgroundColor: '#1C1917' },
  pctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  dayExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    padding: 14,
    gap: 14,
  },
  macroPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  pillLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  bars: {
    gap: 10,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mealName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 70,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mealItems: {
    flex: 1,
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  mealCals: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
});
