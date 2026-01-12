-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  home_city TEXT,
  phi DECIMAL(4,1) DEFAULT 20.0,
  total_rounds INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create groups table (policies added later after group_members exists)
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create group_members junction table FIRST
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  gsi DECIMAL(4,1),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- NOW add groups policies (group_members exists)
CREATE POLICY "Group members can view groups" 
ON public.groups FOR SELECT 
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create groups" 
ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update groups" 
ON public.groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete groups" 
ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Group members can view members" 
ON public.group_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group owners can manage members" 
ON public.group_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_id 
    AND groups.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can leave or owners can remove" 
ON public.group_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_id 
    AND groups.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests" 
ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of" 
ON public.friendships FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their friendships" 
ON public.friendships FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  course_rating DECIMAL(4,1) NOT NULL,
  slope_rating INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 72,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses" 
ON public.courses FOR SELECT USING (true);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses ON DELETE RESTRICT,
  format TEXT NOT NULL CHECK (format IN ('2v2_scramble', 'stroke_play', 'match_play', 'best_ball', 'shamble')),
  match_date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  holes_played INTEGER DEFAULT 18,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view matches" 
ON public.matches FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = matches.group_id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create matches" 
ON public.matches FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can update matches" 
ON public.matches FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = matches.group_id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can delete matches" 
ON public.matches FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = matches.group_id 
    AND group_members.user_id = auth.uid()
  )
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches ON DELETE CASCADE,
  team_number INTEGER NOT NULL,
  handicap_strokes INTEGER DEFAULT 0,
  handicap_override BOOLEAN DEFAULT FALSE,
  score INTEGER,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view teams" 
ON public.teams FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = teams.match_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can manage teams" 
ON public.teams FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = teams.match_id 
    AND gm.user_id = auth.uid()
  )
);

-- Create team_players junction table
CREATE TABLE public.team_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  handicap_used DECIMAL(4,1),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view team players" 
ON public.team_players FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.matches m ON m.id = t.match_id
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE t.id = team_players.team_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can manage team players" 
ON public.team_players FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.matches m ON m.id = t.match_id
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE t.id = team_players.team_id 
    AND gm.user_id = auth.uid()
  )
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'group_invite', 'match_added', 'match_edited')),
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications" 
ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Create group_invites table
CREATE TABLE public.group_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, invitee_id)
);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invites" 
ON public.group_invites FOR SELECT 
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Group members can send invites" 
ON public.group_invites FOR INSERT 
WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Invitees can update their invites" 
ON public.group_invites FOR UPDATE USING (auth.uid() = invitee_id);

CREATE POLICY "Invitees or inviters can delete invites" 
ON public.group_invites FOR DELETE 
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', new.email));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses
INSERT INTO public.courses (name, city, state, course_rating, slope_rating, par) VALUES
('Pebble Beach Golf Links', 'Pebble Beach', 'CA', 75.5, 145, 72),
('Augusta National Golf Club', 'Augusta', 'GA', 76.2, 148, 72),
('Pinehurst No. 2', 'Pinehurst', 'NC', 75.3, 135, 72),
('TPC Sawgrass', 'Ponte Vedra Beach', 'FL', 76.8, 155, 72),
('Torrey Pines South', 'La Jolla', 'CA', 76.4, 143, 72),
('Bethpage Black', 'Farmingdale', 'NY', 77.5, 152, 71),
('Whistling Straits', 'Kohler', 'WI', 76.7, 151, 72),
('Kiawah Island Ocean Course', 'Kiawah Island', 'SC', 77.2, 155, 72),
('Bandon Dunes', 'Bandon', 'OR', 74.5, 138, 72),
('Chambers Bay', 'University Place', 'WA', 77.4, 149, 72);