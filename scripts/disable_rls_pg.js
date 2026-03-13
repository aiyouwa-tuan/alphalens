const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function disableRls() {
    // Check if we have a connection string, otherwise construct one
    // Format: postgres://[user]:[password]@[host]:[port]/[database]
    const connectionString =
        process.env.DATABASE_URL ||
        "postgres://postgres.gfgkeobfkokqgmebqgbt:YpJxPXlGD1maGJDY@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

    console.log("Connecting to Supabase Database via pg...");

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected securely!");

        console.log("Executing SQL to disable Row Level Security on system_settings...");
        await client.query("ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;");

        console.log("🎉 SUCCESS! Row Level Security has been disabled.");
        console.log("You can now go to the AlphaLens website and save the model settings.");
    } catch (err) {
        console.error("❌ Failed to execute SQL:", err.message);
        console.error("This usually means the password or host is incorrect for direct DB connections.");
    } finally {
        await client.end();
    }
}

disableRls();
