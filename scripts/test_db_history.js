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
async function check() {
    try {
        await client.connect();
        const res = await client.query('SELECT count(*) FROM analysis_history');
        console.log('Total history records:', res.rows[0].count);
        
        // Let's grant permissions just in case
        await client.query('GRANT ALL ON TABLE analysis_history TO anon, authenticated, service_role;');
        console.log('Granted permissions to anon and authenticated roles.');
        
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}
check();
