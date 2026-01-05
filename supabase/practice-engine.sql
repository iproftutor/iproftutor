-- ============================================================================
-- Practice Engine Database Schema for iProf Tutor
-- ============================================================================
-- This script sets up the Practice Engine with:
-- - AI-generated questions from study materials
-- - Admin-created questions (40 per topic)
-- - Auto-grading system
-- - Usage limits (Free: 20/month, Paid: 50/day)
-- - Support for multiple question types
--
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Create practice question type enum
-- ============================================================================
CREATE TYPE public.practice_question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer'
);

-- ============================================================================
-- Step 2: Create difficulty level enum
-- ============================================================================
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- ============================================================================
-- Step 3: Create topics/subjects table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.practice_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#0794d4',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default topics
INSERT INTO public.practice_topics (name, description, icon, color) VALUES
  ('Mathematics', 'Algebra, Geometry, Calculus, Statistics', '📐', '#3B82F6'),
  ('Physics', 'Mechanics, Thermodynamics, Electromagnetism, Optics', '⚡', '#EF4444'),
  ('Chemistry', 'Organic, Inorganic, Physical Chemistry', '🧪', '#10B981'),
  ('Biology', 'Cell Biology, Genetics, Ecology, Anatomy', '🧬', '#8B5CF6'),
  ('English', 'Grammar, Vocabulary, Reading, Writing', '📖', '#F59E0B'),
  ('History', 'World History, Civilizations, Modern History', '🏛️', '#6366F1'),
  ('Geography', 'Physical Geography, Human Geography, Maps', '🌍', '#14B8A6'),
  ('Computer Science', 'Programming, Algorithms, Data Structures', '💻', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Step 4: Create practice questions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.practice_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.practice_topics(id) ON DELETE CASCADE,
  question_type public.practice_question_type NOT NULL,
  difficulty public.difficulty_level DEFAULT 'medium',
  question TEXT NOT NULL,
  answer TEXT NOT NULL, -- For short_answer, fill_blank
  options JSONB, -- For multiple_choice: [{label: 'A', text: '...'}, ...]
  correct_option TEXT, -- For multiple_choice: 'A', 'B', 'C', 'D' or for true_false: 'true'/'false'
  explanation TEXT, -- Explanation for the answer
  source_content_id UUID REFERENCES public.content(id) ON DELETE SET NULL, -- Reference to study material
  is_ai_generated BOOLEAN DEFAULT false,
  is_admin_created BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_practice_questions_topic ON public.practice_questions(topic_id);
CREATE INDEX idx_practice_questions_type ON public.practice_questions(question_type);
CREATE INDEX idx_practice_questions_difficulty ON public.practice_questions(difficulty);
CREATE INDEX idx_practice_questions_source ON public.practice_questions(source_content_id);
CREATE INDEX idx_practice_questions_admin ON public.practice_questions(is_admin_created);

-- ============================================================================
-- Step 5: Create practice sessions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_content_id UUID REFERENCES public.content(id) ON DELETE SET NULL, -- Links to study guide
  topic_id UUID REFERENCES public.practice_topics(id) ON DELETE SET NULL, -- Optional legacy support
  difficulty TEXT DEFAULT 'mixed',
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score DECIMAL(5,2) DEFAULT 0, -- Percentage score
  time_spent_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_practice_sessions_user ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_content ON public.practice_sessions(source_content_id);
CREATE INDEX idx_practice_sessions_topic ON public.practice_sessions(topic_id);
CREATE INDEX idx_practice_sessions_completed ON public.practice_sessions(is_completed);

-- ============================================================================
-- Step 6: Create practice answers table (tracks each answer in a session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.practice_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.practice_questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_practice_answers_session ON public.practice_answers(session_id);
CREATE INDEX idx_practice_answers_question ON public.practice_answers(question_id);

-- ============================================================================
-- Step 7: Create user practice usage tracking table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_practice_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  questions_used_today INTEGER DEFAULT 0,
  questions_used_this_month INTEGER DEFAULT 0,
  last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
  last_monthly_reset TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_practice_usage_user ON public.user_practice_usage(user_id);

-- ============================================================================
-- Step 8: Create function to reset daily/monthly usage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_practice_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset daily usage if last reset was not today
  IF NEW.last_daily_reset::date < CURRENT_DATE THEN
    NEW.questions_used_today := 0;
    NEW.last_daily_reset := NOW();
  END IF;
  
  -- Reset monthly usage if last reset was not this month
  IF DATE_TRUNC('month', NEW.last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE) THEN
    NEW.questions_used_this_month := 0;
    NEW.last_monthly_reset := NOW();
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for usage reset
CREATE TRIGGER reset_usage_on_update
BEFORE UPDATE ON public.user_practice_usage
FOR EACH ROW
EXECUTE FUNCTION public.reset_practice_usage();

-- ============================================================================
-- Step 9: Enable Row Level Security
-- ============================================================================
ALTER TABLE public.practice_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_practice_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 10: RLS Policies for practice_topics
-- ============================================================================
-- Everyone can view active topics
CREATE POLICY "Anyone can view active topics"
ON public.practice_topics FOR SELECT
USING (is_active = true AND auth.role() = 'authenticated');

-- Only admins can manage topics
CREATE POLICY "Admins can manage topics"
ON public.practice_topics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- Step 11: RLS Policies for practice_questions
-- ============================================================================
-- Authenticated users can view all questions
CREATE POLICY "Authenticated users can view questions"
ON public.practice_questions FOR SELECT
USING (auth.role() = 'authenticated');

-- Admins and teachers can create questions
CREATE POLICY "Admins and teachers can create questions"
ON public.practice_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Admins can update/delete questions
CREATE POLICY "Admins can update questions"
ON public.practice_questions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete questions"
ON public.practice_questions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- Step 12: RLS Policies for practice_sessions
-- ============================================================================
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.practice_sessions FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions"
ON public.practice_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.practice_sessions FOR UPDATE
USING (user_id = auth.uid());

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.practice_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- Step 13: RLS Policies for practice_answers
-- ============================================================================
-- Users can view their own answers (through session ownership)
CREATE POLICY "Users can view own answers"
ON public.practice_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions
    WHERE practice_sessions.id = session_id
    AND practice_sessions.user_id = auth.uid()
  )
);

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers"
ON public.practice_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practice_sessions
    WHERE practice_sessions.id = session_id
    AND practice_sessions.user_id = auth.uid()
  )
);

-- ============================================================================
-- Step 14: RLS Policies for user_practice_usage
-- ============================================================================
-- Users can view their own usage
CREATE POLICY "Users can view own usage"
ON public.user_practice_usage FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own usage record
CREATE POLICY "Users can insert own usage"
ON public.user_practice_usage FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own usage
CREATE POLICY "Users can update own usage"
ON public.user_practice_usage FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- Step 15: Function to create or update user usage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_practice_usage(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_practice_usage (user_id, questions_used_today, questions_used_this_month)
  VALUES (p_user_id, p_count, p_count)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    questions_used_today = 
      CASE 
        WHEN user_practice_usage.last_daily_reset::date < CURRENT_DATE 
        THEN p_count
        ELSE user_practice_usage.questions_used_today + p_count
      END,
    questions_used_this_month = 
      CASE 
        WHEN DATE_TRUNC('month', user_practice_usage.last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE)
        THEN p_count
        ELSE user_practice_usage.questions_used_this_month + p_count
      END,
    last_daily_reset = 
      CASE 
        WHEN user_practice_usage.last_daily_reset::date < CURRENT_DATE 
        THEN NOW()
        ELSE user_practice_usage.last_daily_reset
      END,
    last_monthly_reset = 
      CASE 
        WHEN DATE_TRUNC('month', user_practice_usage.last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE)
        THEN NOW()
        ELSE user_practice_usage.last_monthly_reset
      END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 16: Function to check user practice limits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_practice_limits(p_user_id UUID)
RETURNS TABLE (
  can_practice BOOLEAN,
  questions_remaining_today INTEGER,
  questions_remaining_month INTEGER,
  is_paid_user BOOLEAN,
  daily_limit INTEGER,
  monthly_limit INTEGER
) AS $$
DECLARE
  v_is_paid BOOLEAN;
  v_daily_limit INTEGER;
  v_monthly_limit INTEGER;
  v_used_today INTEGER;
  v_used_month INTEGER;
BEGIN
  -- Check if user is paid (you can customize this logic based on your subscription system)
  -- For now, we'll check if they have 'paid' in their metadata or role is teacher/admin
  SELECT 
    COALESCE(
      (metadata->>'is_paid')::boolean,
      role IN ('teacher', 'admin')
    )
  INTO v_is_paid
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Set limits based on plan
  IF v_is_paid THEN
    v_daily_limit := 50;
    v_monthly_limit := 1500; -- 50 * 30 days
  ELSE
    v_daily_limit := 20; -- Free users get 20 per month (we'll use monthly limit)
    v_monthly_limit := 20;
  END IF;
  
  -- Get current usage
  SELECT 
    COALESCE(
      CASE 
        WHEN last_daily_reset::date < CURRENT_DATE THEN 0
        ELSE questions_used_today
      END, 0
    ),
    COALESCE(
      CASE 
        WHEN DATE_TRUNC('month', last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE) THEN 0
        ELSE questions_used_this_month
      END, 0
    )
  INTO v_used_today, v_used_month
  FROM public.user_practice_usage
  WHERE user_id = p_user_id;
  
  -- Default to 0 if no usage record exists
  v_used_today := COALESCE(v_used_today, 0);
  v_used_month := COALESCE(v_used_month, 0);
  
  RETURN QUERY SELECT
    (v_is_paid AND v_used_today < v_daily_limit) OR (NOT v_is_paid AND v_used_month < v_monthly_limit),
    GREATEST(0, v_daily_limit - v_used_today),
    GREATEST(0, v_monthly_limit - v_used_month),
    v_is_paid,
    v_daily_limit,
    v_monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 17: Updated at trigger for tables
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practice_topics_updated_at
BEFORE UPDATE ON public.practice_topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practice_questions_updated_at
BEFORE UPDATE ON public.practice_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- ============================================================================
-- Notes:
-- ============================================================================
-- 
-- Usage Limits:
-- - Free Plan: 20 total questions per month across all subjects
-- - Paid Plan: 50 AI-generated questions per day
-- 
-- Question Types:
-- - multiple_choice: A, B, C, D options with one correct answer
-- - true_false: True or False question
-- - fill_blank: Fill in the blank question
-- - short_answer: Free-form short answer
--
-- Admin Questions:
-- - Admins can create up to 40 questions per topic manually
-- - These are marked with is_admin_created = true
--
-- AI-Generated Questions:
-- - Generated from study materials (PDFs in content table)
-- - Marked with is_ai_generated = true
-- - Linked to source content via source_content_id
--
-- ============================================================================
