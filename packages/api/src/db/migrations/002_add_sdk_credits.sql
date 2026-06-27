-- Credit balance and grant total per api_key
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS credits_granted INTEGER NOT NULL DEFAULT 100;

COMMENT ON COLUMN api_keys.credits_balance IS 'Current usable credit balance, decremented per SDK billing-deduct call';
COMMENT ON COLUMN api_keys.credits_granted IS 'Lifetime credits granted to this key (free grant + purchases), for accounting';

-- Per-call transaction log for analytics + idempotency
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('grant', 'debit', 'purchase', 'refund')),
  amount INTEGER NOT NULL,
  tool TEXT,
  call_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_api_key_ts
  ON credit_transactions(api_key_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_tx_call_id
  ON credit_transactions(call_id) WHERE call_id IS NOT NULL;
