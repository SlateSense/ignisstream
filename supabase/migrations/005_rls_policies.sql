-- Row Level Security (RLS) policies for IgnisStream tables
-- This migration sets up comprehensive security policies for all tables

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_editing_projects ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Public teams are viewable by everyone" ON teams
FOR SELECT USING (is_public = true);

CREATE POLICY "Private teams are viewable by members" ON teams
FOR SELECT USING (
  is_public = false AND 
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create teams" ON teams
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team owners can update their teams" ON teams
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'owner'
  )
);

CREATE POLICY "Team owners can delete their teams" ON teams
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'owner'
  )
);

-- Team members policies
CREATE POLICY "Team members are viewable by team members" ON team_members
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team owners and captains can manage members" ON team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'captain')
  )
);

CREATE POLICY "Users can leave teams themselves" ON team_members
FOR DELETE USING (user_id = auth.uid());

-- Team applications policies
CREATE POLICY "Team applications are viewable by applicant and team leaders" ON team_applications
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_applications.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'captain')
  )
);

CREATE POLICY "Authenticated users can apply to teams" ON team_applications
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Team leaders can update applications" ON team_applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_applications.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'captain')
  )
);

CREATE POLICY "Applicants can withdraw their applications" ON team_applications
FOR DELETE USING (user_id = auth.uid());

-- Team events policies
CREATE POLICY "Team events are viewable by team members" ON team_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_events.team_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team leaders can create events" ON team_events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_events.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'captain')
  )
);

CREATE POLICY "Event organizers can update their events" ON team_events
FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Team leaders can delete events" ON team_events
FOR DELETE USING (
  organizer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_events.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'owner'
  )
);

-- Leaderboards policies
CREATE POLICY "Leaderboards are publicly viewable" ON leaderboards
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage leaderboards" ON leaderboards
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Leaderboard entries policies
CREATE POLICY "Leaderboard entries are publicly viewable" ON leaderboard_entries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM leaderboards l 
    WHERE l.id = leaderboard_entries.leaderboard_id AND l.is_active = true
  )
);

CREATE POLICY "System can manage leaderboard entries" ON leaderboard_entries
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'system')
  )
);

-- Tournaments policies
CREATE POLICY "Active tournaments are publicly viewable" ON tournaments
FOR SELECT USING (status != 'cancelled');

CREATE POLICY "Authenticated users can create tournaments" ON tournaments
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Tournament creators can update their tournaments" ON tournaments
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Tournament creators can delete their tournaments" ON tournaments
FOR DELETE USING (created_by = auth.uid());

-- Tournament participants policies
CREATE POLICY "Tournament participants are publicly viewable" ON tournament_participants
FOR SELECT USING (true);

CREATE POLICY "Users can register for tournaments" ON tournament_participants
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (user_id = auth.uid() OR 
   EXISTS (
     SELECT 1 FROM team_members tm 
     WHERE tm.team_id = tournament_participants.team_id 
     AND tm.user_id = auth.uid() 
     AND tm.role IN ('owner', 'captain')
   ))
);

CREATE POLICY "Participants can withdraw from tournaments" ON tournament_participants
FOR DELETE USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = tournament_participants.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'captain')
  )
);

-- User achievements policies
CREATE POLICY "User achievements are viewable by owner and friends" ON user_achievements
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_achievements.user_id 
    AND (p.privacy_achievements = 'public' OR 
         (p.privacy_achievements = 'friends' AND 
          EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = p.id AND status = 'accepted')))
  )
);

CREATE POLICY "System can manage user achievements" ON user_achievements
FOR ALL USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'system')
  )
);

-- User badges policies
CREATE POLICY "User badges are viewable by owner and friends" ON user_badges
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_badges.user_id 
    AND (p.privacy_badges = 'public' OR 
         (p.privacy_badges = 'friends' AND 
          EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = p.id AND status = 'accepted')))
  )
);

CREATE POLICY "System can manage user badges" ON user_badges
FOR ALL USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'system')
  )
);

-- User streaks policies
CREATE POLICY "Users can view their own streaks" ON user_streaks
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage user streaks" ON user_streaks
FOR ALL USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'system')
  )
);

-- Game sessions policies
CREATE POLICY "Users can view their own game sessions" ON game_sessions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own game sessions" ON game_sessions
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own game sessions" ON game_sessions
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own game sessions" ON game_sessions
FOR DELETE USING (user_id = auth.uid());

-- Video clips policies
CREATE POLICY "Public clips are viewable by everyone" ON video_clips
FOR SELECT USING (visibility = 'public');

CREATE POLICY "Friends-only clips are viewable by friends" ON video_clips
FOR SELECT USING (
  visibility = 'friends' AND 
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() 
    AND following_id = video_clips.user_id 
    AND status = 'accepted'
  )
);

CREATE POLICY "Private clips are viewable by owner only" ON video_clips
FOR SELECT USING (visibility = 'private' AND user_id = auth.uid());

CREATE POLICY "Users can create their own clips" ON video_clips
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own clips" ON video_clips
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own clips" ON video_clips
FOR DELETE USING (user_id = auth.uid());

-- Clip editing projects policies
CREATE POLICY "Users can view their own projects" ON clip_editing_projects
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own projects" ON clip_editing_projects
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON clip_editing_projects
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON clip_editing_projects
FOR DELETE USING (user_id = auth.uid());

-- Create functions for common operations
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_team_leader(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_uuid 
    AND user_id = user_uuid 
    AND role IN ('owner', 'captain')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_friends_with(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE ((follower_id = user1_uuid AND following_id = user2_uuid) OR
           (follower_id = user2_uuid AND following_id = user1_uuid))
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION is_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_leader(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_friends_with(UUID, UUID) TO authenticated;
