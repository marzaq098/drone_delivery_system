CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  method VARCHAR(20) NOT NULL DEFAULT 'MPESA',
  status VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(64),
  phone_number VARCHAR(20),
  checkout_request_id VARCHAR(100),
  merchant_request_id VARCHAR(100),
  callback_payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_req ON payments(checkout_request_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

