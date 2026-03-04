const { Pool } = require('pg');
const pool = new Pool({
    host: 'db.gfgkeobfkokqgmebqgbt.supabase.co',
    user: 'postgres',
    password: 'YpJxPXlGD1maGJDY',
    database: 'postgres',
    port: 6543,
    ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(res => console.log('Port 6543 works:', res.rows)).catch(err => console.error('Port 6543 failed:', err.message));
const pool2 = new Pool({
    host: 'db.gfgkeobfkokqgmebqgbt.supabase.co',
    user: 'postgres',
    password: 'YpJxPXlGD1maGJDY',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});
pool2.query('SELECT NOW()').then(res => console.log('Port 5432 works:', res.rows)).catch(err => console.error('Port 5432 failed:', err.message));
