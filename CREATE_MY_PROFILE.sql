-- Check if your profile exists
SELECT * FROM profiles WHERE id = auth.uid();

-- If nothing shows up, create your profile:
INSERT INTO profiles (id, username, display_name, avatar_url, bio)
VALUES (
  auth.uid(),
  'your_username',  -- Change this to your desired username
  'Your Name',      -- Change this to your display name
  '',               -- Your avatar URL (leave empty for now)
  ''                -- Your bio (leave empty for now)
)
ON CONFLICT (id) DO UPDATE 
SET 
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name;
