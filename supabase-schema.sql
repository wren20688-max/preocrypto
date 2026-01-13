-- PreoCrypto Supabase Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alter existing users table to add new columns if they don't exist
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'normal';
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS marketer_win_rate DECIMAL(5,2) DEFAULT 90.00;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Drop and recreate tokens table to ensure correct schema
DROP TABLE IF EXISTS tokens CASCADE;

-- Tokens table (for session management)
CREATE TABLE IF NOT EXISTS tokens (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  username TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Transactions table (all financial transactions)
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'trade', 'bonus'
  amount DECIMAL(15,2) NOT NULL,
  balance_type TEXT NOT NULL, -- 'demo' or 'real'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table (all trading activity)
DROP TABLE IF EXISTS trades CASCADE;

CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  pair TEXT NOT NULL, -- 'BTC/USD', 'EUR/USD', etc.
  type TEXT NOT NULL, -- 'buy', 'sell'
  amount DECIMAL(15,2) NOT NULL,
  entry_price DECIMAL(15,4) NOT NULL,
  exit_price DECIMAL(15,4),
  profit_loss DECIMAL(15,2),
  result TEXT, -- 'win', 'loss'
  balance_type TEXT NOT NULL, -- 'demo' or 'real'
  status TEXT NOT NULL, -- 'open', 'closed'
  stop_loss DECIMAL(15,4),
  take_profit DECIMAL(15,4),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Deposits table (payment tracking)
DROP TABLE IF EXISTS deposits CASCADE;

CREATE TABLE IF NOT EXISTS deposits (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  phone_number TEXT,
  payment_method TEXT,
  payment_reference TEXT UNIQUE,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Withdrawals table
DROP TABLE IF EXISTS withdrawals CASCADE;

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  phone_number TEXT,
  payment_method TEXT,
  status TEXT NOT NULL, -- 'pending', 'completed', 'rejected'
  admin_notes TEXT,
  admin_approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Admin audit log table (tracks all admin actions)
DROP TABLE IF EXISTS admin_audit_log CASCADE;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_username TEXT NOT NULL,
  changes JSONB,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing indexes if they exist before recreating
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_tokens_username;
DROP INDEX IF EXISTS idx_tokens_expires;
DROP INDEX IF EXISTS idx_transactions_username;
DROP INDEX IF EXISTS idx_transactions_created;
DROP INDEX IF EXISTS idx_trades_username;
DROP INDEX IF EXISTS idx_trades_status;
DROP INDEX IF EXISTS idx_trades_date;
DROP INDEX IF EXISTS idx_deposits_username;
DROP INDEX IF EXISTS idx_deposits_status;
DROP INDEX IF EXISTS idx_deposits_reference;
DROP INDEX IF EXISTS idx_withdrawals_username;
DROP INDEX IF EXISTS idx_withdrawals_status;
DROP INDEX IF EXISTS idx_admin_audit_admin;
DROP INDEX IF EXISTS idx_admin_audit_target;
DROP INDEX IF EXISTS idx_admin_audit_date;

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tokens_username ON tokens(username);
CREATE INDEX idx_tokens_expires ON tokens(expires_at);
CREATE INDEX idx_transactions_username ON transactions(username);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_trades_username ON trades(username);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_date ON trades(opened_at DESC);
CREATE INDEX idx_deposits_username ON deposits(username);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_reference ON deposits(payment_reference);
CREATE INDEX idx_withdrawals_username ON withdrawals(username);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_email);
CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_username);
CREATE INDEX idx_admin_audit_date ON admin_audit_log(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Enable all access for service role" ON users;
DROP POLICY IF EXISTS "Enable all access for service role" ON tokens;
DROP POLICY IF EXISTS "Enable all access for service role" ON transactions;
DROP POLICY IF EXISTS "Enable all access for service role" ON trades;
DROP POLICY IF EXISTS "Enable all access for service role" ON deposits;
DROP POLICY IF EXISTS "Enable all access for service role" ON withdrawals;
DROP POLICY IF EXISTS "Enable all access for service role" ON admin_audit_log;

-- Allow service role (backend) to access everything
CREATE POLICY "Enable all access for service role" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service role" ON tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service role" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service role" ON trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service role" ON deposits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service role" ON withdrawals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service role" ON admin_audit_log FOR ALL USING (true) WITH CHECK (true);

-- Insert main admin user (wren20688@gmail.com)
INSERT INTO users (username, password, name, email, demo_balance, real_balance, role, is_admin, status)
VALUES ('wren_admin', 'Jos134ka2', 'Wren Admin', 'wren20688@gmail.com', 50000.00, 0.00, 'admin', true, 'active')
ON CONFLICT (email) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'PreoCrypto database schema created successfully!';
  RAISE NOTICE 'Demo admin account: username=admin, password=admin123';
END $$;
