CREATE TABLE IF NOT EXISTS np_planning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES np_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE,
  color TEXT DEFAULT '#0EA5E9',
  category TEXT DEFAULT 'kampagne',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE np_planning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access" ON np_planning_events FOR ALL USING (auth.role() = 'authenticated');
CREATE INDEX idx_np_planning_project ON np_planning_events(project_id);
CREATE INDEX idx_np_planning_dates ON np_planning_events(start_date);
