-- Migration: Add data_prova field to preparatorios table
-- This field stores the exam date for countdown functionality in Reta Final mode

ALTER TABLE preparatorios
ADD COLUMN IF NOT EXISTS data_prova DATE;

-- Add comment to explain the field
COMMENT ON COLUMN preparatorios.data_prova IS 'Data prevista da prova para countdown no modo Reta Final';
