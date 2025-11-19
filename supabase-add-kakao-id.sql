-- Add kakao_id column to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS kakao_id TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_patients_kakao_id ON patients(kakao_id);

-- Update the RLS policies to also check for kakao_id
-- Note: If you're using simplified "allow all for anon" policies, this is not needed
-- But if you want to add kakao_id checking to the existing policies:

-- Drop and recreate the "Patients can read own data" policy with kakao_id support
DROP POLICY IF EXISTS "Patients can read own data" ON patients;
CREATE POLICY "Patients can read own data" ON patients
  FOR SELECT
  TO anon
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
    OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
  );

-- Drop and recreate the "Patients can update own data" policy with kakao_id support
DROP POLICY IF EXISTS "Patients can update own data" ON patients;
CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE
  TO anon
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
    OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
  )
  WITH CHECK (
    device_id = current_setting('request.headers')::json->>'x-device-id'
    OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
  );

-- Update weight logs policies to include kakao_id
DROP POLICY IF EXISTS "Patients can insert own weight logs" ON weight_logs;
CREATE POLICY "Patients can insert own weight logs" ON weight_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND (
        device_id = current_setting('request.headers')::json->>'x-device-id'
        OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
      )
    )
  );

DROP POLICY IF EXISTS "Patients can read own weight logs" ON weight_logs;
CREATE POLICY "Patients can read own weight logs" ON weight_logs
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND (
        device_id = current_setting('request.headers')::json->>'x-device-id'
        OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
      )
    )
  );

-- Update meal logs policies to include kakao_id
DROP POLICY IF EXISTS "Patients can insert own meal logs" ON meal_logs;
CREATE POLICY "Patients can insert own meal logs" ON meal_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND (
        device_id = current_setting('request.headers')::json->>'x-device-id'
        OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
      )
    )
  );

DROP POLICY IF EXISTS "Patients can read own meal logs" ON meal_logs;
CREATE POLICY "Patients can read own meal logs" ON meal_logs
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = patient_id
      AND (
        device_id = current_setting('request.headers')::json->>'x-device-id'
        OR kakao_id = current_setting('request.headers')::json->>'x-kakao-id'
      )
    )
  );
