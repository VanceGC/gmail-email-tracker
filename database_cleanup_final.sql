-- VGCMail Database Cleanup Script
-- This script removes all tracked emails that were imported via "Sync Gmail"
-- and resets the tracking counter for all users

-- Step 1: Show current state
SELECT 
  'Current tracked emails count' as info,
  COUNT(*) as count
FROM tracked_emails;

SELECT 
  'Current user tracking stats' as info,
  id,
  email,
  emails_tracked_this_month,
  tracking_limit
FROM users;

-- Step 2: Delete all tracked emails (they were synced, not actually tracked)
-- This will cascade delete all related opens, links, and clicks
DELETE FROM tracked_emails;

-- Step 3: Reset the tracking counter for all users
UPDATE users 
SET emails_tracked_this_month = 0;

-- Step 4: Verify cleanup
SELECT 
  'After cleanup - tracked emails' as info,
  COUNT(*) as count
FROM tracked_emails;

SELECT 
  'After cleanup - email opens' as info,
  COUNT(*) as count
FROM email_opens;

SELECT 
  'After cleanup - tracked links' as info,
  COUNT(*) as count
FROM tracked_links;

SELECT 
  'After cleanup - link clicks' as info,
  COUNT(*) as count
FROM link_clicks;

SELECT 
  'After cleanup - user stats' as info,
  id,
  email,
  emails_tracked_this_month,
  tracking_limit
FROM users;

-- Cleanup complete!
-- Users can now start fresh by sending emails with tracking enabled via the Chrome extension
