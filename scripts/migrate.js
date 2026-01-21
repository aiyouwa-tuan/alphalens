const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Credentials derived from user input
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
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

async function migrate() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        const schemaPath = path.join(__dirname, '../data/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration successful!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
