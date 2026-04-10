-- Insert default badges
INSERT INTO "Badge" (id, name, description, type, icon, color, rarity, "isActive", "createdAt", "updatedAt") VALUES
  ('badge_admin', 'Admin', 'Site Administrator', 'ADMIN', '', '#DC2626', 'legendary', true, NOW(), NOW()),
  ('badge_moderator', 'Moderator', 'Community Moderator', 'MODERATOR', '🛡️', '#7C3AED', 'epic', true, NOW(), NOW()),
  ('badge_verified', 'Verified', 'Verified Account', 'VERIFIED', '', '#059669', 'rare', true, NOW(), NOW()),
  ('badge_early_user', 'Early User', 'Beta Tester', 'EARLY_USER', '', '#2563EB', 'rare', true, NOW(), NOW()),
  ('badge_top_contributor', 'Top Contributor', 'Highly Active Community Member', 'TOP_CONTRIBUTOR', '', '#F59E0B', 'epic', true, NOW(), NOW()),
  ('badge_drone_expert', 'Drone Expert', 'Recognized Drone Building Expert', 'DRONE_EXPERT', '', '#10B981', 'epic', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
