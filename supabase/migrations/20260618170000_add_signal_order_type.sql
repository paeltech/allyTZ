-- Add order type (market / limit) to signals and track in update history.

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'market'
  CHECK (order_type IN ('market', 'limit'));

COMMENT ON COLUMN signals.order_type IS 'Order execution type: market or limit (entry_price is limit price when limit).';

-- Extend change tracking for order_type
CREATE OR REPLACE FUNCTION build_signal_changes(OLD signals, NEW signals)
RETURNS JSONB AS $$
DECLARE
  ch JSONB := '{}'::jsonb;
BEGIN
  IF OLD.entry_price IS DISTINCT FROM NEW.entry_price THEN
    ch := ch || jsonb_build_object('entry_price', jsonb_build_object('old', OLD.entry_price, 'new', NEW.entry_price));
  END IF;
  IF OLD.stop_loss IS DISTINCT FROM NEW.stop_loss THEN
    ch := ch || jsonb_build_object('stop_loss', jsonb_build_object('old', OLD.stop_loss, 'new', NEW.stop_loss));
  END IF;
  IF (OLD.take_profit_1 IS DISTINCT FROM NEW.take_profit_1) OR (OLD.take_profit_1 IS NULL AND NEW.take_profit_1 IS NOT NULL) OR (OLD.take_profit_1 IS NOT NULL AND NEW.take_profit_1 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_1', jsonb_build_object('old', OLD.take_profit_1, 'new', NEW.take_profit_1));
  END IF;
  IF (OLD.take_profit_2 IS DISTINCT FROM NEW.take_profit_2) OR (OLD.take_profit_2 IS NULL AND NEW.take_profit_2 IS NOT NULL) OR (OLD.take_profit_2 IS NOT NULL AND NEW.take_profit_2 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_2', jsonb_build_object('old', OLD.take_profit_2, 'new', NEW.take_profit_2));
  END IF;
  IF (OLD.take_profit_3 IS DISTINCT FROM NEW.take_profit_3) OR (OLD.take_profit_3 IS NULL AND NEW.take_profit_3 IS NOT NULL) OR (OLD.take_profit_3 IS NOT NULL AND NEW.take_profit_3 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_3', jsonb_build_object('old', OLD.take_profit_3, 'new', NEW.take_profit_3));
  END IF;
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    ch := ch || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
  END IF;
  IF (OLD.analysis IS DISTINCT FROM NEW.analysis) OR (OLD.analysis IS NULL AND NEW.analysis IS NOT NULL) OR (OLD.analysis IS NOT NULL AND NEW.analysis IS NULL) THEN
    ch := ch || jsonb_build_object('analysis', jsonb_build_object('old', OLD.analysis, 'new', NEW.analysis));
  END IF;
  IF (OLD.confidence_level IS DISTINCT FROM NEW.confidence_level) OR (OLD.confidence_level IS NULL AND NEW.confidence_level IS NOT NULL) OR (OLD.confidence_level IS NOT NULL AND NEW.confidence_level IS NULL) THEN
    ch := ch || jsonb_build_object('confidence_level', jsonb_build_object('old', OLD.confidence_level, 'new', NEW.confidence_level));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    ch := ch || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF OLD.trading_pair IS DISTINCT FROM NEW.trading_pair THEN
    ch := ch || jsonb_build_object('trading_pair', jsonb_build_object('old', OLD.trading_pair, 'new', NEW.trading_pair));
  END IF;
  IF OLD.signal_type IS DISTINCT FROM NEW.signal_type THEN
    ch := ch || jsonb_build_object('signal_type', jsonb_build_object('old', OLD.signal_type, 'new', NEW.signal_type));
  END IF;
  IF OLD.order_type IS DISTINCT FROM NEW.order_type THEN
    ch := ch || jsonb_build_object('order_type', jsonb_build_object('old', OLD.order_type, 'new', NEW.order_type));
  END IF;
  RETURN ch;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION signal_row_to_snapshot(r signals)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'trading_pair', r.trading_pair,
    'signal_type', r.signal_type,
    'order_type', r.order_type,
    'entry_price', r.entry_price,
    'stop_loss', r.stop_loss,
    'take_profit_1', r.take_profit_1,
    'take_profit_2', r.take_profit_2,
    'take_profit_3', r.take_profit_3,
    'title', r.title,
    'analysis', r.analysis,
    'confidence_level', r.confidence_level,
    'status', r.status,
    'created_at', r.created_at
  );
END;
$$ LANGUAGE plpgsql;
