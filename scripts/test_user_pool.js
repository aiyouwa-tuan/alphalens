const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres.ygkyzmcnwcehqaiwfjcq:sbsdccn001%40@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    ssl: { rejectUnauthorized: false }
});
client.connect()
    .then(() => client.query('SELECT NOW()'))
    .then(res => console.log('✅ Connection to user database successful!', res.rows))
    .catch(err => console.error('❌ Connection failed:', err.message))
    .finally(() => client.end());
