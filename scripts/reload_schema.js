const { Client } = require('pg');
const DB_HOST = 'db.gfgkeobfkokqgmebqgbt.supabase.co';
const DB_USER = 'postgres';
const DB_PASS = 'YpJxPXlGD1maGJDY';
const DB_NAME = 'postgres';
const DB_PORT = 6543;
const client = new Client({
    host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, port: DB_PORT,
    ssl: { rejectUnauthorized: false }
});
async function reloadSchema() {
    try {
        await client.connect();
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Schema reload triggered!');

        // Also ensure grants are fully applied
        await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
        await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
        console.log('Grants reapplied.');
    } catch (err) {
        console.error('Reload failed:', err);
    } finally {
        await client.end();
    }
}
reloadSchema();
