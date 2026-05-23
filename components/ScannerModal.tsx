import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ParsedLabel, parseLabelFromImage } from '../utils/parseLabel';
import { MealKey } from '../utils/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: MealKey, food: {
    name: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

type Stage = 'camera' | 'scanning' | 'confirm' | 'manual';

const MEAL_OPTIONS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

function NumericField({
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
    <View style={fieldStyles.container}>
      <Text style={[fieldStyles.label, color ? { color } : {}]}>{label}</Text>
      <View style={fieldStyles.row}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholderTextColor="#4B5563"
        />
        <Text style={fieldStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { flex: 1 },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 8,
  },
  unit: {
    color: '#6B7280',
    fontSize: 12,
  },
});

export default function ScannerModal({ visible, onClose, onSave }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>('camera');
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');

  // Editable fields
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  function resetFields() {
    setFoodName('');
    setServingSize('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  }

  function populateFromLabel(label: ParsedLabel, name = '') {
    setFoodName(name || 'Scanned Food');
    setServingSize(label.servingSize || '1 serving');
    setCalories(String(label.calories || 0));
    setProtein(String(label.protein || 0));
    setCarbs(String(label.carbs || 0));
    setFat(String(label.fat || 0));
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo) return;
      setStage('scanning');
      const label = await parseLabelFromImage(photo.uri);
      populateFromLabel(label);
      setStage('confirm');
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Could not read label. Try manual entry.', [
        { text: 'Manual Entry', onPress: () => { resetFields(); setStage('manual'); } },
        { text: 'Try Again', onPress: () => setStage('camera') },
      ]);
    }
  }

  async function handlePickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    setStage('scanning');
    try {
      const label = await parseLabelFromImage(uri);
      populateFromLabel(label);
      setStage('confirm');
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Could not read label. Try manual entry.', [
        { text: 'Manual Entry', onPress: () => { resetFields(); setStage('manual'); } },
        { text: 'Try Again', onPress: () => setStage('camera') },
      ]);
    }
  }

  function handleSave() {
    if (!foodName.trim()) {
      Alert.alert('Missing Name', 'Please enter a food name.');
      return;
    }
    onSave(selectedMeal, {
      name: foodName.trim(),
      servingSize: servingSize.trim() || '1 serving',
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    });
    resetFields();
    setStage('camera');
    onClose();
  }

  function handleClose() {
    resetFields();
    setStage('camera');
    onClose();
  }

  const renderCamera = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            GainTrack needs camera access to scan nutrition labels.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => setStage('manual')}>
            <Text style={styles.ghostBtnText}>Manual Entry Instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* Viewfinder overlay */}
          <View style={styles.overlay}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanHint}>Point at the Nutrition Facts label</Text>
          </View>
        </CameraView>

        <View style={styles.cameraActions}>
          <TouchableOpacity style={styles.libBtn} onPress={handlePickFromLibrary}>
            <Text style={styles.libBtnText}>📷 Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.libBtn} onPress={() => setStage('manual')}>
            <Text style={styles.libBtnText}>✏️ Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderScanning = () => (
    <View style={styles.scanningBox}>
      <ActivityIndicator size="large" color="#F97316" />
      <Text style={styles.scanningTitle}>Analyzing Label...</Text>
      <Text style={styles.scanningSubtitle}>GainTrack AI is reading your nutrition facts</Text>
    </View>
  );

  const renderForm = (title: string) => (
    <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeader}>
        <Text style={styles.formBadge}>GainTrack {title}</Text>
      </View>

      {/* Meal picker */}
      <Text style={styles.sectionLabel}>Log to meal</Text>
      <View style={styles.mealPicker}>
        {MEAL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.mealChip, selectedMeal === opt.key && styles.mealChipActive]}
            onPress={() => setSelectedMeal(opt.key)}
          >
            <Text style={[styles.mealChipText, selectedMeal === opt.key && styles.mealChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Food name */}
      <Text style={styles.sectionLabel}>Food name</Text>
      <TextInput
        style={styles.nameInput}
        value={foodName}
        onChangeText={setFoodName}
        placeholder="e.g. Chicken Breast"
        placeholderTextColor="#4B5563"
      />

      {/* Serving size */}
      <Text style={styles.sectionLabel}>Serving size</Text>
      <TextInput
        style={styles.nameInput}
        value={servingSize}
        onChangeText={setServingSize}
        placeholder="e.g. 100g, 1 cup"
        placeholderTextColor="#4B5563"
      />

      {/* Macros grid */}
      <Text style={styles.sectionLabel}>Macros</Text>
      <View style={styles.macroRow}>
        <NumericField label="Calories" value={calories} onChangeText={setCalories} unit="kcal" />
        <NumericField label="Protein" value={protein} onChangeText={setProtein} color="#F97316" />
      </View>
      <View style={[styles.macroRow, { marginTop: 10 }]}>
        <NumericField label="Carbs" value={carbs} onChangeText={setCarbs} color="#EAB308" />
        <NumericField label="Fat" value={fat} onChangeText={setFat} color="#EF4444" />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Log Food</Text>
      </TouchableOpacity>

      {title === 'Scan Result' && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setStage('camera')}>
          <Text style={styles.rescanText}>Scan Again</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>
            {stage === 'camera' && 'Scan Label'}
            {stage === 'scanning' && 'Scanning...'}
            {stage === 'confirm' && 'Confirm & Log'}
            {stage === 'manual' && 'Manual Entry'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {stage === 'camera' && renderCamera()}
        {stage === 'scanning' && renderScanning()}
        {stage === 'confirm' && renderForm('Scan Result')}
        {stage === 'manual' && renderForm('Manual Entry')}
      </View>
    </Modal>
  );
}

const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3F3F3F',
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F3F4F6',
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '700',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  viewfinder: {
    width: 260,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
    borderColor: '#F97316',
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
    borderColor: '#F97316',
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
    borderColor: '#F97316',
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
    borderColor: '#F97316',
  },
  scanHint: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#0F0F0F',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F97316',
  },
  libBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  libBtnText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
  },

  // Scanning
  scanningBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  scanningTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  scanningSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Permission
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  permissionSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  ghostBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ghostBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  // Form
  formScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  formBadge: {
    backgroundColor: '#1C1917',
    color: '#F97316',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F97316',
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
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
  mealPicker: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mealChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  mealChipActive: {
    backgroundColor: '#431407',
    borderColor: '#F97316',
  },
  mealChipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  mealChipTextActive: {
    color: '#F97316',
  },
  macroRow: {
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
