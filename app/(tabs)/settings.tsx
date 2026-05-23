import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserSettings, getSettings, saveSettings } from '../../utils/storage';

function TargetField({
  label,
  value,
  onChangeText,
  color,
  unit = 'g',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  color?: string;
  unit?: string;
}) {
  return (
    <View style={tf.container}>
      <Text style={[tf.label, color ? { color } : {}]}>{label}</Text>
      <View style={tf.inputRow}>
        <TextInput
          style={tf.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor="#4B5563"
          selectTextOnFocus
        />
        <Text style={tf.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const tf = StyleSheet.create({
  container: { flex: 1 },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 10,
  },
  unit: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const s = await getSettings();
    setName(s.name);
    setCalories(String(s.targets.calories));
    setProtein(String(s.targets.protein));
    setCarbs(String(s.targets.carbs));
    setFat(String(s.targets.fat));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    const updatedSettings: UserSettings = {
      name: name.trim() || 'Athlete',
      targets: {
        calories: parseInt(calories) || 2500,
        protein: parseInt(protein) || 180,
        carbs: parseInt(carbs) || 250,
        fat: parseInt(fat) || 80,
      },
    };
    await saveSettings(updatedSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all targets to default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setCalories('2500');
            setProtein('180');
            setCarbs('250');
            setFat('80');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>GainTrack · Track your gains. Fuel your grind.</Text>
          </View>

          {/* Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Your Name</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex"
                placeholderTextColor="#4B5563"
                autoCapitalize="words"
              />
              <Text style={styles.fieldHint}>
                Used for personalized greeting on your dashboard
              </Text>
            </View>
          </View>

          {/* Daily Targets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Targets</Text>
            <View style={styles.card}>
              {/* Calories full width */}
              <View style={styles.caloriesField}>
                <Text style={styles.fieldLabel}>Calories</Text>
                <View style={tf.inputRow}>
                  <TextInput
                    style={[tf.input, { fontSize: 22 }]}
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                    placeholderTextColor="#4B5563"
                    selectTextOnFocus
                  />
                  <Text style={tf.unit}>kcal</Text>
                </View>
              </View>

              <View style={styles.macroRow}>
                <TargetField
                  label="Protein"
                  value={protein}
                  onChangeText={setProtein}
                  color="#F97316"
                />
                <TargetField
                  label="Carbs"
                  value={carbs}
                  onChangeText={setCarbs}
                  color="#EAB308"
                />
              </View>

              <View style={[styles.macroRow, { marginTop: 12 }]}>
                <TargetField
                  label="Fat"
                  value={fat}
                  onChangeText={setFat}
                  color="#EF4444"
                />
                {/* Estimated macro split info */}
                <View style={styles.splitInfo}>
                  <Text style={styles.splitLabel}>Est. Split</Text>
                  <Text style={styles.splitVal}>
                    {Math.round(((parseFloat(protein) || 0) * 4 / (parseFloat(calories) || 2500)) * 100)}P /
                    {' '}{Math.round(((parseFloat(carbs) || 0) * 4 / (parseFloat(calories) || 2500)) * 100)}C /
                    {' '}{Math.round(((parseFloat(fat) || 0) * 9 / (parseFloat(calories) || 2500)) * 100)}F
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>App</Text>
                <Text style={styles.aboutVal}>GainTrack v1.0</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>Scanner</Text>
                <Text style={styles.aboutVal}>GPT-4o Vision</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>Storage</Text>
                <Text style={styles.aboutVal}>Local (AsyncStorage)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>Data</Text>
                <Text style={styles.aboutVal}>Stays on device</Text>
              </View>
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 0,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: 16,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 6,
  },
  nameInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  caloriesField: {
    gap: 0,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 10,
    gap: 4,
  },
  splitLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D1D5DB',
  },
  resetBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  aboutKey: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  aboutVal: {
    fontSize: 14,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1F1F1F',
  },
  saveBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
