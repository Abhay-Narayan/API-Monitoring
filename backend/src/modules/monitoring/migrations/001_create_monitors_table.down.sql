-- Drop monitors table and related objects
DROP TRIGGER IF EXISTS update_monitors_updated_at ON monitors;
DROP TABLE IF EXISTS monitors CASCADE;
