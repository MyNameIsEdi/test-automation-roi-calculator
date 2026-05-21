-- CREATE THE SCENARIOS TABLE
CREATE TABLE scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  manual_mins FLOAT DEFAULT 0,
  frequency FLOAT DEFAULT 0,
  dev_hours FLOAT DEFAULT 0,
  maint_hours FLOAT DEFAULT 0,
  is_flaky BOOLEAN DEFAULT false,
  is_visual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view their own scenarios" 
ON scenarios FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios" 
ON scenarios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" 
ON scenarios FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios" 
ON scenarios FOR DELETE 
USING (auth.uid() = user_id);