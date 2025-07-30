-- Migration: Make source_url column nullable in owner_companies table
-- Description: This migration changes the source_url column to allow NULL values
-- Date: 2025-07-29

-- Make source_url column nullable
ALTER TABLE public.owner_companies 
ALTER COLUMN source_url DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.owner_companies.source_url IS '参照元URL（オプション）';