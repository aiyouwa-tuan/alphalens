-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Portfolios Table
-- Stores the current state of holdings for a user
create table portfolios (
  user_id uuid primary key references users(id) on delete cascade,
  holdings jsonb default '[]'::jsonb, -- Array of { symbol, quantity, averageCost }
  realized_pl numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Transactions Table
-- Log of all buy/sell actions
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  symbol text not null,
  type text check (type in ('BUY', 'SELL')) not null,
  quantity numeric not null,
  price numeric not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Watchlists Table
create table watchlists (
  user_id uuid references users(id) on delete cascade not null,
  symbol text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, symbol)
);

-- Row Level Security (RLS) policies can be added if using Supabase Auth, 
-- but since we are handling Auth in Next.js (Server-Side), 
-- we connect with the Service Role Key (if needed) or just Anon Key (if RLS is open).
-- For this MVP/Client-side logic, ensure RLS is enabled if exposing to public.
-- But here we are using the helper on server side (Next.js API routes).
