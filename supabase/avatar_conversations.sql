-- Avatar Conversations Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS avatar_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE avatar_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own avatar conversations
CREATE POLICY "Users can view own avatar conversations" ON avatar_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar conversations" ON avatar_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar conversations" ON avatar_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_avatar_conversations_user_id ON avatar_conversations(user_id);
CREATE INDEX idx_avatar_conversations_session_id ON avatar_conversations(session_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_avatar_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER avatar_conversations_updated_at
  BEFORE UPDATE ON avatar_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_conversations_updated_at();
