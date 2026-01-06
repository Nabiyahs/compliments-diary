export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      praises: {
        Row: {
          id: number
          user_id: string
          praise_date: string
          content: string
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          praise_date: string
          content: string
          created_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          praise_date?: string
          content?: string
          created_at?: string
        }
      }
      day_cards: {
        Row: {
          id: number
          user_id: string
          card_date: string
          photo_url: string | null
          caption: string | null
          sticker_state: Json
          updated_at: string
        }
        Insert: {
          id?: never
          user_id: string
          card_date: string
          photo_url?: string | null
          caption?: string | null
          sticker_state?: Json
          updated_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          card_date?: string
          photo_url?: string | null
          caption?: string | null
          sticker_state?: Json
          updated_at?: string
        }
      }
      stamp_assets: {
        Row: {
          id: number
          key: string
          label: string
          asset_url: string | null
          created_at: string
        }
        Insert: {
          id?: never
          key: string
          label: string
          asset_url?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          key?: string
          label?: string
          asset_url?: string | null
          created_at?: string
        }
      }
      day_stamps: {
        Row: {
          id: number
          user_id: string
          praise_date: string
          stamp_asset_id: number
          updated_at: string
        }
        Insert: {
          id?: never
          user_id: string
          praise_date: string
          stamp_asset_id: number
          updated_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          praise_date?: string
          stamp_asset_id?: number
          updated_at?: string
        }
      }
    }
  }
}

// Sticker state for emoji stickers on polaroid
export interface StickerState {
  emoji: string
  x: number // normalized 0..1
  y: number // normalized 0..1
  scale: number
  rotate: number
  z: number
}

// Aggregated month data for efficient loading
export interface MonthDayData {
  date: string
  praiseCount: number
  photoUrl: string | null
  hasStamp: boolean
}

// Praise entry
export interface Praise {
  id: number
  user_id: string
  praise_date: string
  content: string
  created_at: string
}

// Day card (with parsed sticker_state)
export interface DayCard {
  id: number
  user_id: string
  card_date: string
  photo_url: string | null
  caption: string | null
  sticker_state: StickerState[]
  updated_at: string
}

// Stamp asset
export interface StampAsset {
  id: number
  key: string
  label: string
  asset_url: string | null
  created_at: string
}

// Day stamp
export interface DayStamp {
  id: number
  user_id: string
  praise_date: string
  stamp_asset_id: number
  updated_at: string
}

// Extended day stamp with asset info
export interface DayStampWithAsset extends DayStamp {
  stamp_asset: StampAsset
}
