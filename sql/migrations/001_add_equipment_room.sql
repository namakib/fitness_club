-- ============================================================
-- Migration 001: Add room_id to equipment
-- Run on existing DBs that were created before this column existed.
-- Idempotent: safe to run multiple times.
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'equipment' AND column_name = 'room_id'
    ) THEN
        ALTER TABLE equipment ADD COLUMN room_id INTEGER REFERENCES room(room_id);
        UPDATE equipment SET room_id = 1 WHERE equipment_id IN (4, 5, 6, 8);
        UPDATE equipment SET room_id = 3 WHERE equipment_id IN (1, 2, 3, 7);
        ALTER TABLE equipment ALTER COLUMN room_id SET NOT NULL;
    END IF;
END
$$;
