-- Add birthdate field to patients table for simple login verification
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number);

-- Add comment
COMMENT ON COLUMN patients.birthdate IS '생년월일 (본인 확인용)';
