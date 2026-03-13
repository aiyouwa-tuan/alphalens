const { Client } = require('/Users/marobin/Downloads/AlphaLens/node_modules/pg');

async function run() {
    const client = new Client({
        connectionString: "postgres://postgres.gfgkeobfkokqgmebqgbt:YpJxPXlGD1maGJDY@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected!');
        await client.query('ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;');
        console.log('RLS Disabled! AlphaLens settings will now save successfully.');
    } catch (e) {
        console.error("Connection Failed:", e.message);
    } finally {
        await client.end();
    }
}
run().catch(console.error);
