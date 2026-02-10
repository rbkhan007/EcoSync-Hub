const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DB_TYPE = process.env.DB_TYPE || (process.env.DATABASE_URL?.includes('postgres') ? 'postgres' : 'mysql');

let pool;

if (DB_TYPE === 'postgres') {
    const { Pool } = require('pg');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        ssl: {
            rejectUnauthorized: false
        }
    });

    console.log('Database connecting to: PostgreSQL');
} else {
    const mysql = require('mysql2');
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ecosync_hub',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    console.log('Database connecting to: MySQL (XAMPP/Local)');
}

// Unified Query Interface
const query = async (text, params = []) => {
    if (DB_TYPE === 'postgres') {
        const translate = (sql, sqlParams) => {
            let index = 1;
            const processedParams = [];
            const parts = sql.split(/(\?\?|\?)/);
            let paramIndex = 0;
            let processedText = '';

            parts.forEach(part => {
                if (part === '??') {
                    const identifier = sqlParams[paramIndex++];
                    processedText += `"${identifier}"`;
                } else if (part === '?') {
                    processedText += `$${index++}`;
                    processedParams.push(sqlParams[paramIndex++]);
                } else {
                    processedText += part;
                }
            });

            // Handle metadata translations
            let pgText = processedText.trim();
            const upperText = pgText.toUpperCase();
            const dbName = process.env.DB_NAME || 'ecosync_hub';

            if (upperText === 'SHOW TABLES') {
                pgText = `SELECT tablename as "Tables_in_${dbName}" FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
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
                if (pgText.endsWith(';')) pgText = pgText.slice(0, -1);
                pgText += ' RETURNING id';
            }

            return [pgText, processedParams];
        };

        const [processedText, processedParams] = translate(text, params);
        const res = await pool.query(processedText, processedParams);

        const upperText = text.trim().toUpperCase();
        const isInsert = upperText.startsWith('INSERT');
        const isWrite = isInsert || upperText.startsWith('UPDATE') || upperText.startsWith('DELETE');

        if (isWrite) {
            return [{
                insertId: (isInsert && res.rows.length > 0) ? res.rows[0].id : null,
                affectedRows: res.rowCount,
                rowCount: res.rowCount
            }, res.fields];
        }
        return [res.rows, res.fields];
    } else {
        // Native MySQL support for ? and ??
        return pool.promise().query(text, params);
    }
};

module.exports = {
    query,
    promise: () => ({
        query,
        getConnection: async () => {
            if (DB_TYPE === 'postgres') {
                const client = await pool.connect();
                return {
                    query: async (text, params) => {
                        // Reuse translation logic (simplified here)
                        const [processedText, processedParams] = await module.exports.translate(text, params);
                        const res = await client.query(processedText, processedParams);
                        const upperText = text.trim().toUpperCase();
                        if (upperText.startsWith('INSERT') || upperText.startsWith('UPDATE') || upperText.startsWith('DELETE')) {
                            return [{
                                insertId: (upperText.startsWith('INSERT') && res.rows.length > 0) ? res.rows[0].id : null,
                                affectedRows: res.rowCount
                            }];
                        }
                        return [res.rows];
                    },
                    beginTransaction: () => client.query('BEGIN'),
                    commit: () => client.query('COMMIT'),
                    rollback: () => client.query('ROLLBACK'),
                    release: () => client.release()
                };
            } else {
                return pool.promise().getConnection();
            }
        }
    }),
    translate: async (sql, sqlParams) => {
        // Exported helper for specific uses
        if (DB_TYPE !== 'postgres') return [sql, sqlParams];
        let index = 1;
        const processedParams = [];
        const parts = sql.split(/(\?\?|\?)/);
        let paramIndex = 0;
        let processedText = '';
        parts.forEach(part => {
            if (part === '??') {
                processedText += `"${sqlParams[paramIndex++]}"`;
            } else if (part === '?') {
                processedText += `$${index++}`;
                processedParams.push(sqlParams[paramIndex++]);
            } else {
                processedText += part;
            }
        });
        return [processedText, processedParams];
    },
    pool
};

