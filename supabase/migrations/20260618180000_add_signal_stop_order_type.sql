-- Allow stop orders in addition to market and limit.

ALTER TABLE signals DROP CONSTRAINT IF EXISTS signals_order_type_check;

ALTER TABLE signals
  ADD CONSTRAINT signals_order_type_check
  CHECK (order_type IN ('market', 'limit', 'stop'));

COMMENT ON COLUMN signals.order_type IS 'Order execution type: market, limit (entry_price = limit price), or stop (entry_price = stop price).';
