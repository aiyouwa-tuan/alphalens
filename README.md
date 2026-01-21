# AlphaLens

A premium, self-hosted stock portfolio tracking application.

## Features

- **Personal Stock Pool**: Manage your favorite stocks.
- **Transactions**: Log Buy/Sell records with automatic average cost calculation.
- **Performance**: Track Realized and Unrealized P/L in real-time.
- **Cloud Ready**: Built for Supabase (PostgreSQL) and Next.js.

## Integrations

- **Database**: Supabase (PostgreSQL)
- **Market Data**: Supports Custom API (Massive) or Yahoo Finance fallback.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Rename `.env.local.example` to `.env.local` and add your keys:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_MARKET_API_KEY=...
   STOCK_API_URL_TEMPLATE=...
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## License
MIT
