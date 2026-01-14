-- PreoCrypto Supabase Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (stores all user accounts)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  country TEXT,
  demo_balance DECIMAL(15,2) DEFAULT 10000.00,
  real_balance DECIMAL(15,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tokens table (for session management)
CREATE TABLE IF NOT EXISTS tokens (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  username TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Transactions table (all financial transactions)
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
CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL, -- 'buy', 'sell'
  amount DECIMAL(15,2) NOT NULL,
  entry_price DECIMAL(15,4) NOT NULL,
  exit_price DECIMAL(15,4),
  profit_loss DECIMAL(15,2),
  balance_type TEXT NOT NULL, -- 'demo' or 'real'
  status TEXT NOT NULL, -- 'open', 'closed'
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Deposits table (payment tracking)
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
CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  phone_number TEXT,
  payment_method TEXT,
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'completed'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tokens_username ON tokens(username);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_transactions_username ON transactions(username);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_username ON trades(username);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_deposits_username ON deposits(username);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_reference ON deposits(payment_reference);
CREATE INDEX IF NOT EXISTS idx_withdrawals_username ON withdrawals(username);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

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

-- Allow service role (backend) to access everything
CREATE POLICY "Enable all access for service role" ON users FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON tokens FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON transactions FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON trades FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON deposits FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON withdrawals FOR ALL USING (true);

-- Insert demo admin user (for testing)
INSERT INTO users (username, password, name, email, demo_balance, real_balance, is_admin)
VALUES ('admin', 'admin123', 'Admin User', 'admin@preocrypto.com', 50000.00, 0.00, true)
ON CONFLICT (username) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'PreoCrypto database schema created successfully!';
  RAISE NOTICE 'Demo admin account: username=admin, password=admin123';
END $$;
