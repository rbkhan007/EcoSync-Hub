const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Use the Render External Database URL provided by the user
const connectionString = process.env.DATABASE_URL || 'postgres://ecosync_hub_user:QXjMApJHz9cV5Hnc5OsL8UUs7FNqd7CT@dpg-d64h9kq4d50c73efh8ug-a.singapore-postgres.render.com/ecosync_hub';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function importSql() {
    try {
        console.log('Reading SQL file...');
        const sqlPath = path.join(__dirname, '..', '..', 'ecosync_hub_pg.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('Executing SQL (this may take a minute)...');
            await client.query(sql);
            console.log('✅ Database imported successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error during import:', err.message);
    } finally {
        await pool.end();
    }
}

importSql();
