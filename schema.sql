-- schema.sql
-- Use this file to initialize your Cloudflare D1 database:
-- npx wrangler d1 execute <DATABASE_NAME> --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    language TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
