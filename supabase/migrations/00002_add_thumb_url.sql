-- Migration: 00002_add_thumb_url.sql
-- Add thumb_url column for calendar/week view optimization
-- Thumbnails are smaller images for grid views, originals only for day view

-- Add thumb_url column to day_cards
ALTER TABLE day_cards ADD COLUMN IF NOT EXISTS thumb_url TEXT;

-- Index is not needed since we already have idx_day_cards_user_date
-- which covers the main query pattern (user_id, card_date)

COMMENT ON COLUMN day_cards.thumb_url IS 'Thumbnail URL for calendar grid views (smaller, optimized image)';
COMMENT ON COLUMN day_cards.photo_url IS 'Original full-size photo URL (only load in day view)';
