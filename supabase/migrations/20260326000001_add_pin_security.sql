-- Add PIN security columns to clients table
-- This enables secure phone recovery with PIN + backup codes

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS recovery_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_recovery_attempt TIMESTAMP WITH TIME ZONE;

-- Create index for phone recovery lookups
CREATE INDEX IF NOT EXISTS idx_clients_phone_pin ON clients(phone) WHERE phone IS NOT NULL;

-- Comments
COMMENT ON COLUMN clients.pin_hash IS 'Bcrypt hash of 6-digit PIN for phone recovery';
COMMENT ON COLUMN clients.backup_codes IS 'Array of bcrypt hashed backup codes (format: XXXX-XXXX). Single-use only.';
COMMENT ON COLUMN clients.recovery_attempts IS 'Number of failed recovery attempts in current window';
COMMENT ON COLUMN clients.last_recovery_attempt IS 'Timestamp of last recovery attempt for rate limiting';
