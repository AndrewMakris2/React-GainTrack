import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParsedLabel, parseLabelFromImage } from '../../utils/parseLabel';
import {
  FoodItem,
  MealKey,
  addFoodToMeal,
  todayString,
} from '../../utils/storage';

type Stage = 'camera' | 'scanning' | 'confirm' | 'manual';

const MEAL_OPTIONS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

function Field({
  label,
  value,
  onChangeText,
  color,
  unit = 'g',
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  color?: string;
  unit?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, color ? { color } : {}]}>{label}</Text>
      <View style={[fieldStyles.row, multiline && { height: 44 }]}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={unit === 'text' ? 'default' : 'decimal-pad'}
          placeholderTextColor="#4B5563"
          placeholder={placeholder}
        />
        {unit !== 'text' && unit !== 'kcal' && <Text style={fieldStyles.unit}>{unit}</Text>}
        {unit === 'kcal' && <Text style={fieldStyles.unit}>kcal</Text>}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { flex: 1 },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 9,
  },
  unit: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>('camera');
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');
  const [savedNotice, setSavedNotice] = useState(false);

  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  function reset() {
    setFoodName('');
    setServingSize('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setStage('camera');
  }

  function populate(label: ParsedLabel) {
    setFoodName('Scanned Food');
    setServingSize(label.servingSize || '1 serving');
    setCalories(String(label.calories || 0));
    setProtein(String(label.protein || 0));
    setCarbs(String(label.carbs || 0));
    setFat(String(label.fat || 0));
  }

  async function capture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo) return;
      setStage('scanning');
      const label = await parseLabelFromImage(photo.uri);
      populate(label);
      setStage('confirm');
    } catch (err: any) {
      Alert.alert(
        'Scan Failed',
        err.message || 'Could not read label.',
        [
          { text: 'Manual Entry', onPress: () => { reset(); setStage('manual'); } },
          { text: 'Try Again', onPress: () => setStage('camera') },
        ]
      );
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setStage('scanning');
    try {
      const label = await parseLabelFromImage(result.assets[0].uri);
      populate(label);
      setStage('confirm');
    } catch (err: any) {
      Alert.alert(
        'Scan Failed',
        err.message || 'Could not read label.',
        [
          { text: 'Manual Entry', onPress: () => { reset(); setStage('manual'); } },
          { text: 'Try Again', onPress: () => setStage('camera') },
        ]
      );
    }
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
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      reset();
    }, 1600);
  }

  // Permission screen
  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.permTitle}>Camera Permission</Text>
          <Text style={styles.permSub}>
            GainTrack needs camera access to scan nutrition labels.
          </Text>
          <TouchableOpacity style={styles.orangeBtn} onPress={requestPermission}>
            <Text style={styles.orangeBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => setStage('manual')}>
            <Text style={styles.ghostBtnText}>Manual Entry Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Scanning stage
  if (stage === 'scanning') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.scanTitle}>Analyzing Label...</Text>
          <Text style={styles.scanSub}>GainTrack AI is reading your nutrition facts</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Camera stage
  if (stage === 'camera') {
    return (
      <View style={styles.cameraBg}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <View style={styles.camHeader}>
              <Text style={styles.camTitle}>GainTrack</Text>
              <Text style={styles.camSubtitle}>Scan a Nutrition Facts label</Text>
            </View>
          </SafeAreaView>
          <View style={styles.viewfinderWrap}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.scanHint}>Align label inside the frame</Text>
          </View>
        </CameraView>

        <View style={styles.camControls}>
          <TouchableOpacity style={styles.sideBtn} onPress={pickFromLibrary}>
            <Text style={styles.sideBtnIcon}>🖼</Text>
            <Text style={styles.sideBtnLabel}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shutterOuter} onPress={capture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => setStage('manual')}>
            <Text style={styles.sideBtnIcon}>✏️</Text>
            <Text style={styles.sideBtnLabel}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Confirm / Manual form
  const isConfirm = stage === 'confirm';
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.formTopBar}>
        <TouchableOpacity onPress={reset} hitSlop={12}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTopTitle}>
          {isConfirm ? 'Confirm & Log' : 'Manual Entry'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {savedNotice && (
        <View style={styles.savedBanner}>
          <Text style={styles.savedBannerText}>✓ Food logged successfully!</Text>
        </View>
      )}

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isConfirm ? '⚡ GainTrack Scan Result' : '✏️ Manual Entry'}
          </Text>
        </View>

        <Text style={styles.fieldGroupTitle}>Log to Meal</Text>
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

        <Text style={styles.fieldGroupTitle}>Food Details</Text>
        <TextInput
          style={styles.nameInput}
          value={foodName}
          onChangeText={setFoodName}
          placeholder="Food name (e.g. Chicken Breast)"
          placeholderTextColor="#4B5563"
        />
        <View style={{ height: 10 }} />
        <TextInput
          style={styles.nameInput}
          value={servingSize}
          onChangeText={setServingSize}
          placeholder="Serving size (e.g. 100g, 1 cup)"
          placeholderTextColor="#4B5563"
        />

        <Text style={styles.fieldGroupTitle}>Macros</Text>
        <View style={styles.macroGrid}>
          <Field label="Calories" value={calories} onChangeText={setCalories} unit="kcal" />
          <Field label="Protein" value={protein} onChangeText={setProtein} color="#F97316" />
        </View>
        <View style={[styles.macroGrid, { marginTop: 10 }]}>
          <Field label="Carbs" value={carbs} onChangeText={setCarbs} color="#EAB308" />
          <Field label="Fat" value={fat} onChangeText={setFat} color="#EF4444" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Log Food</Text>
        </TouchableOpacity>

        {isConfirm && (
          <TouchableOpacity style={styles.rescanBtn} onPress={reset}>
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER = 22;
const THICK = 3;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 36,
  },
  permTitle: { fontSize: 20, fontWeight: '800', color: '#F3F4F6' },
  permSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  orangeBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  orangeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  ghostBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  ghostBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  scanTitle: { fontSize: 20, fontWeight: '800', color: '#F3F4F6' },
  scanSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  // Camera
  cameraBg: { flex: 1, backgroundColor: '#000' },
  camHeader: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 4,
  },
  camTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F97316',
    letterSpacing: 1,
  },
  camSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  viewfinderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  viewfinder: {
    width: 280,
    height: 190,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  tl: {
    top: 0, left: 0,
    borderTopWidth: THICK, borderLeftWidth: THICK,
    borderTopLeftRadius: 4, borderColor: '#F97316',
  },
  tr: {
    top: 0, right: 0,
    borderTopWidth: THICK, borderRightWidth: THICK,
    borderTopRightRadius: 4, borderColor: '#F97316',
  },
  bl: {
    bottom: 0, left: 0,
    borderBottomWidth: THICK, borderLeftWidth: THICK,
    borderBottomLeftRadius: 4, borderColor: '#F97316',
  },
  br: {
    bottom: 0, right: 0,
    borderBottomWidth: THICK, borderRightWidth: THICK,
    borderBottomRightRadius: 4, borderColor: '#F97316',
  },
  scanHint: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  camControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F97316',
  },
  sideBtn: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  sideBtnIcon: { fontSize: 24 },
  sideBtnLabel: { color: '#D1D5DB', fontSize: 11, fontWeight: '600' },

  // Form
  formTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '700',
    width: 60,
  },
  formTopTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  savedBanner: {
    backgroundColor: '#14532D',
    margin: 16,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  savedBannerText: {
    color: '#4ADE80',
    fontWeight: '700',
    fontSize: 14,
  },
  formScroll: { flex: 1 },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginVertical: 12,
  },
  badgeText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldGroupTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  mealPicker: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  chipActive: {
    backgroundColor: '#431407',
    borderColor: '#F97316',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F97316',
  },
  nameInput: {
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
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rescanBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  rescanText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
