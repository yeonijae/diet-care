-- Add uploaded_at field to meal_logs table to track when photo was uploaded
-- The 'date' field will store the photo capture time from EXIF data
ALTER TABLE meal_logs
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment
COMMENT ON COLUMN meal_logs.date IS '사진 촬영 시간 (EXIF에서 추출) 또는 업로드 시간';
COMMENT ON COLUMN meal_logs.uploaded_at IS '사진 업로드 시간';

-- Update existing rows to have uploaded_at = date for backward compatibility
UPDATE meal_logs
SET uploaded_at = date
WHERE uploaded_at IS NULL;
