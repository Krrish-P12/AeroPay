-- AeroPay Neon PostgreSQL Database Schema

-- 1. Users table (Holds account balance and hashed bank PIN)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,        -- e.g. 'saanvi@aeropay'
    pin_hash VARCHAR(255) NOT NULL,     -- Plaintext '1234' or bcrypt hash
    balance NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Escrow Locks table (Tracks active and settled escrow certificates)
CREATE TABLE IF NOT EXISTS escrow_locks (
    escrow_id VARCHAR(50) PRIMARY KEY,  -- e.g. 'esc_a1b2c3d4'
    user_id VARCHAR(100) REFERENCES users(id),
    locked_amount NUMERIC(12, 2) NOT NULL,
    buyer_public_key TEXT NOT NULL,
    cert_data TEXT NOT NULL,
    server_signature TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'SETTLED', 'EXPIRED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Settlements table (For offline transactions redeemed by merchants)
CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    escrow_id VARCHAR(50) REFERENCES escrow_locks(escrow_id),
    merchant_id VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    nonce INT NOT NULL,
    buyer_signature TEXT NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Confirmed Authoritative Transactions Ledger
CREATE TABLE IF NOT EXISTS confirmed_transactions (
    id SERIAL PRIMARY KEY,
    escrow_id VARCHAR(50) REFERENCES escrow_locks(escrow_id),
    sender_id VARCHAR(100) REFERENCES users(id),
    receiver_id VARCHAR(100) REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    nonce INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SETTLED', -- 'SETTLED', 'VOID', 'DISPUTED'
    buyer_signature TEXT,
    tx_raw_data TEXT,
    settled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_escrow_nonce UNIQUE (escrow_id, nonce)
);

-- 5. Seed initial test accounts
INSERT INTO users (id, pin_hash, balance) 
VALUES 
    ('saanvi@aeropay', '1234', 5000.00),
    ('parth@aeropay', '1234', 5000.00),
    ('merchant@aeropay', '1234', 1000.00)
ON CONFLICT (id) DO NOTHING;

