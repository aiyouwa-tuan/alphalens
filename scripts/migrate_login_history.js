const { Client } = require('pg');
const DB_HOST = 'db.gfgkeobfkokqgmebqgbt.supabase.co';
const DB_USER = 'postgres';
const DB_PASS = 'YpJxPXlGD1maGJDY';
const DB_NAME = 'postgres';
const DB_PORT = 5432;
const client = new Client({
    host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, port: DB_PORT,
    ssl: { rejectUnauthorized: false }
});
async function migrate() {
    try {
        await client.connect();

        // Ensure UUID extension is available
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS login_history (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                email text NOT NULL,
                ip_address text,
                location text,
                login_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                duration_seconds integer DEFAULT 0
            );
        `);
        console.log('Migration login_history successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
migrate();
