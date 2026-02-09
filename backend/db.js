const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection on startup with retries for production
const testConnection = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log('Successfully connected to PostgreSQL!', res.rows[0]);
            return;
        } catch (err) {
            console.error(`Database connection attempt ${i + 1} failed:`, err.message);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('Final database connection attempt failed. Service may be unstable.');
};

testConnection();

module.exports = {
    query: async (text, params = []) => {
        let index = 1;

        // Handle identifier placeholders (??)
        let processedText = text;
        const processedParams = [];

        // Match ?? vs ?
        // This is a simple implementation; complex queries might need a more robust parser
        const parts = text.split(/(\?\?|\?)/);
        let paramIndex = 0;
        processedText = '';

        parts.forEach(part => {
            if (part === '??') {
                const identifier = params[paramIndex++];
                processedText += `"${identifier}"`;
            } else if (part === '?') {
                processedText += `$${index++}`;
                processedParams.push(params[paramIndex++]);
            } else {
                processedText += part;
            }
        });

        // Translate MySQL metadata queries
        let pgText = processedText.trim();
        const upperText = pgText.toUpperCase();
        const dbName = process.env.DB_NAME || 'ecosync_hub';

        if (upperText === 'SHOW TABLES') {
            pgText = `SELECT tablename as "Tables_in_${dbName}", tablename as "Tables_in_defaultdb" FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
        } else if (upperText.startsWith('DESCRIBE ')) {
            const tableName = pgText.split(' ')[1].replace(/"/g, '');
            pgText = `
                SELECT 
                    cols.column_name as "Field", 
                    cols.data_type as "Type", 
                    cols.is_nullable as "Null", 
                    CASE WHEN kcu.column_name IS NOT NULL THEN 'PRI' ELSE '' END as "Key", 
                    cols.column_default as "Default", 
                    CASE WHEN cols.column_default LIKE 'nextval%' THEN 'auto_increment' ELSE '' END as "Extra" 
                FROM information_schema.columns cols
                LEFT JOIN information_schema.key_column_usage kcu 
                    ON cols.table_name = kcu.table_name 
                    AND cols.column_name = kcu.column_name 
                    AND kcu.constraint_name LIKE '%_pkey'
                WHERE cols.table_name = $1
            `;
            processedParams.length = 0;
            processedParams.push(tableName);
        }

        const isInsert = upperText.startsWith('INSERT');
        if (isInsert && !upperText.includes('RETURNING')) {
            pgText += ' RETURNING id';
        }

        const res = await pool.query(pgText, processedParams);

        if (isInsert || upperText.startsWith('UPDATE') || upperText.startsWith('DELETE')) {
            const resultInfo = {
                insertId: (isInsert && res.rows.length > 0) ? res.rows[0].id : null,
                affectedRows: res.rowCount,
                rowCount: res.rowCount
            };
            return [resultInfo, res.fields];
        }

        return [res.rows, res.fields];
    },
    promise: function () {
        return {
            ...this,
            getConnection: async () => {
                const client = await pool.connect();
                // Add mysql2 compatibility methods to the client
                const connectionShim = {
                    query: async (text, params = []) => {
                        // Reuse the same logic from the main query method
                        const [processedText, processedParams] = await this.translate(text, params);
                        const res = await client.query(processedText, processedParams);

                        const upperText = processedText.trim().toUpperCase();
                        const isInsert = upperText.startsWith('INSERT');

                        if (isInsert || upperText.startsWith('UPDATE') || upperText.startsWith('DELETE')) {
                            const resultInfo = {
                                insertId: (isInsert && res.rows.length > 0) ? res.rows[0].id : null,
                                affectedRows: res.rowCount,
                                rowCount: res.rowCount
                            };
                            return [resultInfo, res.fields];
                        }
                        return [res.rows, res.fields];
                    },
                    beginTransaction: () => client.query('BEGIN'),
                    commit: () => client.query('COMMIT'),
                    rollback: () => client.query('ROLLBACK'),
                    release: () => client.release(),
                    // mysql2 compatibility
                    beginTransaction: async () => await client.query('BEGIN'),
                    commit: async () => await client.query('COMMIT'),
                    rollback: async () => await client.query('ROLLBACK'),
                    release: () => client.release()
                };
                return connectionShim;
            }
        };
    },
    // Helper to reuse translation logic
    translate: async function (text, params = []) {
        if (typeof text !== 'string') return [text, params];

        // Replace backticks with double quotes for PostgreSQL compatibility
        let processedText = text.replace(/`/g, '"');

        let index = 1;
        const processedParams = [];
        const parts = processedText.split(/(\?\?|\?)/);
        let paramIndex = 0;
        processedText = '';

        parts.forEach(part => {
            if (part === '??') {
                const identifier = params[paramIndex++];
                processedText += `"${identifier}"`;
            } else if (part === '?') {
                processedText += `$${index++}`;
                processedParams.push(params[paramIndex++]);
            } else {
                processedText += part;
            }
        });

        let pgText = processedText.trim();
        const upperText = pgText.toUpperCase();
        const dbName = process.env.DB_NAME || 'ecosync_hub';

        if (upperText === 'SHOW TABLES') {
            pgText = `SELECT tablename as "Tables_in_${dbName}", tablename as "Tables_in_defaultdb" FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
        } else if (upperText.startsWith('DESCRIBE ')) {
            const tableName = pgText.split(' ')[1].replace(/"/g, '');
            pgText = `
                SELECT 
                    cols.column_name as "Field", 
                    cols.data_type as "Type", 
                    cols.is_nullable as "Null", 
                    CASE WHEN kcu.column_name IS NOT NULL THEN 'PRI' ELSE '' END as "Key", 
                    cols.column_default as "Default", 
                    CASE WHEN cols.column_default LIKE 'nextval%' THEN 'auto_increment' ELSE '' END as "Extra" 
                FROM information_schema.columns cols
                LEFT JOIN information_schema.key_column_usage kcu 
                    ON cols.table_name = kcu.table_name 
                    AND cols.column_name = kcu.column_name 
                    AND kcu.constraint_name LIKE '%_pkey'
                WHERE cols.table_name = $1
            `;
            processedParams.length = 0;
            processedParams.push(tableName);
        }

        const isInsert = upperText.startsWith('INSERT');
        if (isInsert && !upperText.includes('RETURNING')) {
            // Remove trailing semicolon before appending RETURNING
            if (pgText.endsWith(';')) {
                pgText = pgText.slice(0, -1);
            }
            pgText += ' RETURNING id';
        }

        return [pgText, processedParams];
    },
    pool
};
