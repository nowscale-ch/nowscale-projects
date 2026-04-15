ALTER TABLE np_meetings ADD COLUMN IF NOT EXISTS customer_checklist TEXT DEFAULT '[]';
