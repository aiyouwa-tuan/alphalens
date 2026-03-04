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
        await client.query(`
            ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS start_time text;
            ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS end_time text;
        `);
        console.log('Migration end_time successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
migrate();
