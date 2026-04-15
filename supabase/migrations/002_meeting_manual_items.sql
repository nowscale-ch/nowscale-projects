ALTER TABLE np_meetings ADD COLUMN IF NOT EXISTS manual_completed_items TEXT DEFAULT '[]';
