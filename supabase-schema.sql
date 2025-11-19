-- DietCare Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED')),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  age INTEGER NOT NULL,
  target_weight DECIMAL(5,2) NOT NULL,
  current_weight DECIMAL(5,2) NOT NULL,
  start_weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create weight_logs table
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, date)
);

-- Create meal_logs table
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url TEXT NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_device_id ON patients(device_id);
CREATE INDEX idx_weight_logs_patient_id ON weight_logs(patient_id);
CREATE INDEX idx_weight_logs_date ON weight_logs(date);
CREATE INDEX idx_meal_logs_patient_id ON meal_logs(patient_id);
CREATE INDEX idx_meal_logs_date ON meal_logs(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to patients table
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Patients table policies
-- Allow anonymous users to insert new patient registrations
CREATE POLICY "Allow anonymous patient registration" ON patients
  FOR INSERT
  TO anon
  WITH CHECK (status = 'PENDING');

-- Allow patients to read their own data by device_id
CREATE POLICY "Patients can read own data" ON patients
  FOR SELECT
  TO anon
  USING (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Allow patients to update their own data
CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE
  TO anon
  USING (device_id = current_setting('request.headers')::json->>'x-device-id')
  WITH CHECK (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Admin can read all patients (authenticated users)
CREATE POLICY "Admins can read all patients" ON patients
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can update any patient
CREATE POLICY "Admins can update patients" ON patients
  FOR UPDATE
  TO authenticated
  USING (true);

-- Weight logs policies
CREATE POLICY "Patients can insert own weight logs" ON weight_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND device_id = current_setting('request.headers')::json->>'x-device-id'
    )
  );

CREATE POLICY "Patients can read own weight logs" ON weight_logs
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND device_id = current_setting('request.headers')::json->>'x-device-id'
    )
  );

CREATE POLICY "Admins can read all weight logs" ON weight_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Meal logs policies
CREATE POLICY "Patients can insert own meal logs" ON meal_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND device_id = current_setting('request.headers')::json->>'x-device-id'
    )
  );

CREATE POLICY "Patients can read own meal logs" ON meal_logs
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND device_id = current_setting('request.headers')::json->>'x-device-id'
    )
  );

CREATE POLICY "Admins can read all meal logs" ON meal_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meal images
CREATE POLICY "Anyone can upload meal images" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'meal-images');

CREATE POLICY "Anyone can read meal images" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'meal-images');

CREATE POLICY "Authenticated users can manage meal images" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'meal-images');
