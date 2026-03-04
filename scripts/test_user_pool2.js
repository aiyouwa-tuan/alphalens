const { Client } = require('pg');
async function test() {
    const client = new Client({
        connectionString: "postgresql://postgres.ygkyzmcnwcehqaiwfjcq:sbsdccn001%40@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });
    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log('✅ Connection to user database successful!', res.rows);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await client.end();
    }
}
test();
