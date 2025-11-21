export enum UserRole {
  PATIENT = 'PATIENT',
  ADMIN = 'ADMIN'
}

export type PatientStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
}

export interface MealLog {
  id: string;
  date: string; // ISO string - Photo capture time from EXIF or upload time
  uploadedAt?: string; // ISO string - When the photo was uploaded
  imageUrl: string;
  foodName: string;
  calories: number;
  analysis: string; // AI feedback
}

export interface Patient {
  id: string;
  deviceId?: string; // Unique ID stored on user's device
  status: PatientStatus;
  name: string;
  phoneNumber: string;
  birthdate?: string; // YYYY-MM-DD format for simple login verification
  joinedAt: string;
  age: number;
  targetWeight: number;
  currentWeight: number;
  startWeight: number;
  weightLogs: WeightLog[];
  mealLogs: MealLog[];
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  MEAL_UPLOAD = 'MEAL_UPLOAD',
  PATIENT_DETAIL = 'PATIENT_DETAIL'
}