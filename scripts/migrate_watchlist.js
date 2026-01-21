const { Client } = require('pg');

// Credentials
const DB_HOST = 'db.gfgkeobfkokqgmebqgbt.supabase.co';
const DB_USER = 'postgres';
const DB_PASS = 'YpJxPXlGD1maGJDY';
const DB_NAME = 'postgres';
const DB_PORT = 5432;

const client = new Client({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Connecting...');
        await client.connect();

        const sql = `
      create table if not exists watchlists (
        user_id uuid references users(id) on delete cascade not null,
        symbol text not null,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        primary key (user_id, symbol)
      );
    `;

        console.log('Creating Watchlists table...');
        await client.query(sql);
        console.log('Success!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
