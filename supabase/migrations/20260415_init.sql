-- Kunden/Projekte
CREATE TABLE IF NOT EXISTS np_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT DEFAULT '',
  drive_link TEXT DEFAULT '',
  color TEXT DEFAULT '#0EA5E9',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- To-Dos
CREATE TABLE IF NOT EXISTS np_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES np_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  labels JSONB DEFAULT '[]',
  deadline DATE,
  checklist JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Meetings
CREATE TABLE IF NOT EXISTS np_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES np_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMPTZ,
  participants TEXT DEFAULT '',
  agenda TEXT DEFAULT '',
  preparation_notes TEXT DEFAULT '',
  protocol TEXT DEFAULT '',
  decisions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Meeting-Aufgaben
CREATE TABLE IF NOT EXISTS np_meeting_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES np_meetings(id) ON DELETE CASCADE,
  todo_id UUID NOT NULL REFERENCES np_todos(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projekt-Zugriff
CREATE TABLE IF NOT EXISTS np_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES np_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer',
  UNIQUE(project_id, user_id)
);

-- RLS
ALTER TABLE np_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_meeting_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_project_access ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Auth full access" ON np_projects FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Auth full access" ON np_todos FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Auth full access" ON np_meetings FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Auth full access" ON np_meeting_todos FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Auth full access" ON np_project_access FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_np_todos_project ON np_todos(project_id);
CREATE INDEX IF NOT EXISTS idx_np_todos_status ON np_todos(status);
CREATE INDEX IF NOT EXISTS idx_np_meetings_project ON np_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_np_project_access_user ON np_project_access(user_id);
