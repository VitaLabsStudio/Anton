-- Track temporal config changes
CREATE TABLE IF NOT EXISTS temporal_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  config_id VARCHAR(100) NOT NULL,
  config_before JSONB,
  config_after JSONB,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_temporal_config_history_type_id ON temporal_config_history(config_type, config_id);
CREATE INDEX IF NOT EXISTS idx_temporal_config_history_changed_at ON temporal_config_history(changed_at DESC);
