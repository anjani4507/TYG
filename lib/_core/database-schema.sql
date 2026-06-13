-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group members table (junction table)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  subject VARCHAR(255),
  duration INTEGER NOT NULL, -- in seconds
  intensity_score INTEGER CHECK (intensity_score >= 1 AND intensity_score <= 10),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Presence events table (for real-time tracking)
CREATE TABLE IF NOT EXISTS public.presence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'idle', 'offline')),
  intensity INTEGER CHECK (intensity IS NULL OR (intensity >= 1 AND intensity <= 10)),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON public.sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_presence_events_group_id ON public.presence_events(group_id);
CREATE INDEX IF NOT EXISTS idx_presence_events_user_id ON public.presence_events(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_events_timestamp ON public.presence_events(timestamp);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_events ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: Users can only see their own profile and profiles of group members
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view group members' profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM public.group_members
      WHERE group_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Groups RLS: Users can view groups they're members of
CREATE POLICY "Users can view joined groups"
  ON public.groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON public.groups FOR UPDATE
  USING (creator_id = auth.uid());

-- Group members RLS
CREATE POLICY "Users can view group members"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

-- Sessions RLS: Users can only see their own sessions and group sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view group session history"
  ON public.sessions FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Presence events RLS: Users can see presence in their groups
CREATE POLICY "Users can view group presence events"
  ON public.presence_events FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create presence events"
  ON public.presence_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
