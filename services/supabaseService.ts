import { supabase } from '../lib/supabase';
import { Patient, MealLog, WeightLog } from '../types';

// Debug environment variables
console.log('Environment check:', {
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  urlPrefix: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30),
  mode: import.meta.env.MODE,
});

// Device ID management
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('dietcare_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random()}`;
    localStorage.setItem('dietcare_device_id', deviceId);
  }
  return deviceId;
};

// Patient operations
export const createPatient = async (patientData: Omit<Patient, 'id' | 'weightLogs' | 'mealLogs'> & { kakaoId?: string }): Promise<Patient | null> => {
  try {
    console.log('Creating patient with data:', patientData);

    const insertData: any = {
      device_id: patientData.deviceId,
      status: patientData.status,
      name: patientData.name,
      phone_number: patientData.phoneNumber,
      joined_at: patientData.joinedAt,
      age: patientData.age,
      target_weight: patientData.targetWeight,
      current_weight: patientData.currentWeight,
      start_weight: patientData.startWeight,
    };

    // Add optional fields if provided
    if (patientData.kakaoId) {
      insertData.kakao_id = patientData.kakaoId;
    }
    if (patientData.birthdate) {
      insertData.birthdate = patientData.birthdate;
    }

    const { data, error } = await supabase
      .from('patients')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    return {
      id: data.id,
      deviceId: data.device_id,
      status: data.status,
      name: data.name,
      phoneNumber: data.phone_number,
      birthdate: data.birthdate,
      joinedAt: data.joined_at,
      age: data.age,
      targetWeight: data.target_weight,
      currentWeight: data.current_weight,
      startWeight: data.start_weight,
      weightLogs: [],
      mealLogs: [],
    };
  } catch (error) {
    console.error('Error creating patient:', error);
    return null;
  }
};

export const getPatientByKakaoId = async (kakaoId: string): Promise<Patient | null> => {
  try {
    console.log('Fetching patient by Kakao ID:', kakaoId);

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('kakao_id', kakaoId)
      .single();

    if (patientError) {
      console.error('Supabase fetch error details:', {
        message: patientError.message,
        details: patientError.details,
        hint: patientError.hint,
        code: patientError.code,
        fullError: JSON.stringify(patientError, null, 2)
      });
      // If no rows found, return null instead of throwing
      if (patientError.code === 'PGRST116') {
        console.log('No patient found for Kakao ID, returning null');
        return null;
      }
      throw patientError;
    }

    // Fetch weight logs
    const { data: weightLogs, error: weightError } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('date', { ascending: true });

    if (weightError) throw weightError;

    // Fetch meal logs
    const { data: mealLogs, error: mealError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('date', { ascending: false });

    if (mealError) throw mealError;

    return {
      id: patientData.id,
      deviceId: patientData.device_id,
      status: patientData.status,
      name: patientData.name,
      phoneNumber: patientData.phone_number,
      birthdate: patientData.birthdate,
      joinedAt: patientData.joined_at,
      age: patientData.age,
      targetWeight: patientData.target_weight,
      currentWeight: patientData.current_weight,
      startWeight: patientData.start_weight,
      weightLogs: weightLogs.map((log) => ({
        id: log.id,
        date: log.date,
        weight: parseFloat(log.weight),
      })),
      mealLogs: mealLogs.map((log) => ({
        id: log.id,
        date: log.date,
        uploadedAt: log.uploaded_at,
        imageUrl: log.image_url,
        foodName: log.food_name,
        calories: log.calories,
        analysis: log.analysis,
      })),
    };
  } catch (error) {
    console.error('Error fetching patient by Kakao ID:', error);
    return null;
  }
};

export const getPatientByPhoneAndBirthdate = async (
  phoneNumber: string,
  name: string,
  birthdate: string
): Promise<Patient | null> => {
  try {
    console.log('Fetching patient by phone, name, and birthdate:', { phoneNumber, name, birthdate });

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('name', name)
      .eq('birthdate', birthdate)
      .single();

    if (patientError) {
      console.error('Supabase fetch error details:', {
        message: patientError.message,
        details: patientError.details,
        hint: patientError.hint,
        code: patientError.code,
        fullError: JSON.stringify(patientError, null, 2)
      });
      // If no rows found, return null instead of throwing
      if (patientError.code === 'PGRST116') {
        console.log('No patient found for given credentials, returning null');
        return null;
      }
      throw patientError;
    }

    // Fetch weight logs
    const { data: weightLogs, error: weightError } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('date', { ascending: true });

    if (weightError) throw weightError;

    // Fetch meal logs
    const { data: mealLogs, error: mealError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('date', { ascending: false });

    if (mealError) throw mealError;

    return {
      id: patientData.id,
      deviceId: patientData.device_id,
      status: patientData.status,
      name: patientData.name,
      phoneNumber: patientData.phone_number,
      birthdate: patientData.birthdate,
      joinedAt: patientData.joined_at,
      age: patientData.age,
      targetWeight: patientData.target_weight,
      currentWeight: patientData.current_weight,
      startWeight: patientData.start_weight,
      weightLogs: weightLogs.map((log) => ({
        id: log.id,
        date: log.date,
        weight: parseFloat(log.weight),
      })),
      mealLogs: mealLogs.map((log) => ({
        id: log.id,
        date: log.date,
        uploadedAt: log.uploaded_at,
        imageUrl: log.image_url,
        foodName: log.food_name,
        calories: log.calories,
        analysis: log.analysis,
      })),
    };
  } catch (error) {
    console.error('Error fetching patient by credentials:', error);
    return null;
  }
};

export const getPatientByDeviceId = async (deviceId: string): Promise<Patient | null> => {
  try {
    console.log('Fetching patient by device ID:', deviceId);

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (patientError) {
      console.error('Supabase fetch error details:', {
        message: patientError.message,
        details: patientError.details,
        hint: patientError.hint,
        code: patientError.code,
        fullError: JSON.stringify(patientError, null, 2)
      });
      // If no rows found, return null instead of throwing
      if (patientError.code === 'PGRST116') {
        console.log('No patient found for device ID, returning null');
        return null;
      }
      throw patientError;
    }

    // Fetch weight logs
    const { data: weightLogs, error: weightError } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('date', { ascending: true });

    if (weightError) throw weightError;

    // Fetch meal logs
    const { data: mealLogs, error: mealError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('date', { ascending: false });

    if (mealError) throw mealError;

    return {
      id: patientData.id,
      deviceId: patientData.device_id,
      status: patientData.status,
      name: patientData.name,
      phoneNumber: patientData.phone_number,
      birthdate: patientData.birthdate,
      joinedAt: patientData.joined_at,
      age: patientData.age,
      targetWeight: patientData.target_weight,
      currentWeight: patientData.current_weight,
      startWeight: patientData.start_weight,
      weightLogs: weightLogs.map((log) => ({
        id: log.id,
        date: log.date,
        weight: parseFloat(log.weight),
      })),
      mealLogs: mealLogs.map((log) => ({
        id: log.id,
        date: log.date,
        uploadedAt: log.uploaded_at,
        imageUrl: log.image_url,
        foodName: log.food_name,
        calories: log.calories,
        analysis: log.analysis,
      })),
    };
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
};

export const getAllPatients = async (): Promise<Patient[]> => {
  try {
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('joined_at', { ascending: false });

    if (patientsError) throw patientsError;

    // Fetch all weight logs and meal logs for all patients
    const patientIds = patientsData.map((p) => p.id);

    const { data: allWeightLogs } = await supabase
      .from('weight_logs')
      .select('*')
      .in('patient_id', patientIds)
      .order('date', { ascending: true });

    const { data: allMealLogs } = await supabase
      .from('meal_logs')
      .select('*')
      .in('patient_id', patientIds)
      .order('date', { ascending: false });

    return patientsData.map((patient) => ({
      id: patient.id,
      deviceId: patient.device_id,
      status: patient.status,
      name: patient.name,
      phoneNumber: patient.phone_number,
      birthdate: patient.birthdate,
      joinedAt: patient.joined_at,
      age: patient.age,
      targetWeight: patient.target_weight,
      currentWeight: patient.current_weight,
      startWeight: patient.start_weight,
      weightLogs: (allWeightLogs || [])
        .filter((log) => log.patient_id === patient.id)
        .map((log) => ({
          id: log.id,
          date: log.date,
          weight: parseFloat(log.weight),
        })),
      mealLogs: (allMealLogs || [])
        .filter((log) => log.patient_id === patient.id)
        .map((log) => ({
          id: log.id,
          date: log.date,
          uploadedAt: log.uploaded_at,
          imageUrl: log.image_url,
          foodName: log.food_name,
          calories: log.calories,
          analysis: log.analysis,
        })),
    }));
  } catch (error) {
    console.error('Error fetching all patients:', error);
    return [];
  }
};

export const updatePatient = async (patientId: string, updates: Partial<Patient>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('patients')
      .update({
        status: updates.status,
        current_weight: updates.currentWeight,
        target_weight: updates.targetWeight,
      })
      .eq('id', patientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating patient:', error);
    return false;
  }
};

// Weight log operations
export const addWeightLog = async (patientId: string, weightLog: Omit<WeightLog, 'id'>): Promise<WeightLog | null> => {
  try {
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({
        patient_id: patientId,
        date: weightLog.date,
        weight: weightLog.weight,
      })
      .select()
      .single();

    if (error) throw error;

    // Also update patient's current weight
    await supabase
      .from('patients')
      .update({ current_weight: weightLog.weight })
      .eq('id', patientId);

    return {
      id: data.id,
      date: data.date,
      weight: parseFloat(data.weight),
    };
  } catch (error) {
    console.error('Error adding weight log:', error);
    return null;
  }
};

// Meal log operations
export const addMealLog = async (patientId: string, mealLog: Omit<MealLog, 'id'>): Promise<MealLog | null> => {
  try {
    const insertData: any = {
      patient_id: patientId,
      date: mealLog.date,
      image_url: mealLog.imageUrl,
      food_name: mealLog.foodName,
      calories: mealLog.calories,
      analysis: mealLog.analysis,
    };

    // Add uploaded_at if provided
    if (mealLog.uploadedAt) {
      insertData.uploaded_at = mealLog.uploadedAt;
    }

    const { data, error } = await supabase
      .from('meal_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      uploadedAt: data.uploaded_at,
      imageUrl: data.image_url,
      foodName: data.food_name,
      calories: data.calories,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('Error adding meal log:', error);
    return null;
  }
};

// Update meal log
export const updateMealLog = async (mealId: string, updates: Partial<MealLog>): Promise<MealLog | null> => {
  try {
    const updateData: any = {};

    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.foodName !== undefined) updateData.food_name = updates.foodName;
    if (updates.calories !== undefined) updateData.calories = updates.calories;
    if (updates.analysis !== undefined) updateData.analysis = updates.analysis;

    const { data, error } = await supabase
      .from('meal_logs')
      .update(updateData)
      .eq('id', mealId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      uploadedAt: data.uploaded_at,
      imageUrl: data.image_url,
      foodName: data.food_name,
      calories: data.calories,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('Error updating meal log:', error);
    return null;
  }
};

// Delete meal log
export const deleteMealLog = async (mealId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting meal log:', error);
    return false;
  }
};

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; i++) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// Image upload to Supabase Storage (accepts compressed base64 or File)
export const uploadMealImage = async (imageData: File | string, patientId: string): Promise<string | null> => {
  try {
    let uploadBlob: Blob;
    let fileName: string;

    if (typeof imageData === 'string') {
      // Compressed base64 image
      uploadBlob = base64ToBlob(imageData);
      fileName = `${patientId}/${Date.now()}.jpg`;
    } else {
      // Original file (fallback)
      uploadBlob = imageData;
      const fileExt = imageData.name.split('.').pop();
      fileName = `${patientId}/${Date.now()}.${fileExt}`;
    }

    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, uploadBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('meal-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Delete patient and all related data
export const deletePatient = async (patientId: string): Promise<boolean> => {
  try {
    // Delete weight logs
    await supabase
      .from('weight_logs')
      .delete()
      .eq('patient_id', patientId);

    // Delete meal logs
    await supabase
      .from('meal_logs')
      .delete()
      .eq('patient_id', patientId);

    // Delete patient
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    return false;
  }
};

// Admin authentication (simple version - for production use proper auth)
export const adminLogin = async (password: string): Promise<boolean> => {
  // For demo purposes - in production, use Supabase Auth
  const ADMIN_PASSWORD = 'admin1234';
  return password === ADMIN_PASSWORD;
};

// Real-time subscription for admin dashboard
export const subscribeToPatientUpdates = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('patients-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_logs' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_logs' }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
