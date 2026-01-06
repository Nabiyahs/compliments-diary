-- Praise Calendar Polaroid - Database Schema
-- Migration: 00001_create_tables.sql

-- ============================================
-- 1. PRAISES TABLE (unlimited per day)
-- ============================================
CREATE TABLE praises (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    praise_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by user and date
CREATE INDEX idx_praises_user_date ON praises(user_id, praise_date);

-- ============================================
-- 2. DAY_CARDS TABLE (ONE per date per user)
-- ============================================
CREATE TABLE day_cards (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_date DATE NOT NULL,
    photo_url TEXT,
    caption TEXT,
    sticker_state JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, card_date)
);

-- Index for efficient querying
CREATE INDEX idx_day_cards_user_date ON day_cards(user_id, card_date);

-- ============================================
-- 3. STAMP_ASSETS TABLE (catalog)
-- ============================================
CREATE TABLE stamp_assets (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    asset_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default stamp assets
INSERT INTO stamp_assets (key, label, asset_url) VALUES
    ('cham-jal', '참 잘했어요', NULL),
    ('great-job', '최고예요', NULL),
    ('wonderful', '훌륭해요', NULL),
    ('excellent', '멋져요', NULL),
    ('proud', '자랑스러워요', NULL);

-- ============================================
-- 4. DAY_STAMPS TABLE (ONE per date per user)
-- ============================================
CREATE TABLE day_stamps (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    praise_date DATE NOT NULL,
    stamp_asset_id BIGINT NOT NULL REFERENCES stamp_assets(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, praise_date)
);

-- Index for efficient querying
CREATE INDEX idx_day_stamps_user_date ON day_stamps(user_id, praise_date);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE praises ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_stamps ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: PRAISES
-- ============================================
CREATE POLICY "Users can view their own praises"
    ON praises FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own praises"
    ON praises FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own praises"
    ON praises FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own praises"
    ON praises FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: DAY_CARDS
-- ============================================
CREATE POLICY "Users can view their own day cards"
    ON day_cards FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own day cards"
    ON day_cards FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own day cards"
    ON day_cards FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own day cards"
    ON day_cards FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: STAMP_ASSETS (read-only for users)
-- ============================================
CREATE POLICY "Anyone can view stamp assets"
    ON stamp_assets FOR SELECT
    TO authenticated
    USING (true);

-- Admin/service role can manage stamp_assets (no policy needed, bypasses RLS)

-- ============================================
-- RLS POLICIES: DAY_STAMPS
-- ============================================
CREATE POLICY "Users can view their own day stamps"
    ON day_stamps FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own day stamps"
    ON day_stamps FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own day stamps"
    ON day_stamps FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own day stamps"
    ON day_stamps FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET SETUP
-- Run this in Supabase Dashboard SQL Editor or via API
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('praise-photos', 'praise-photos', true);

-- Storage policies are set up separately in the Supabase Dashboard
-- or via the storage API. See README for instructions.
