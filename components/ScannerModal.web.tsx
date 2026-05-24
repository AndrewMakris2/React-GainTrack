// Web stub — camera modal replaced by inline manual entry on web
import React from 'react';
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

// On web, the ScannerModal is a no-op — food entry goes through the Scan tab instead
export default function ScannerModal(_props: Props) {
  return null;
}
