const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// Get list of all tables in the database
router.get('/tables', async (req, res) => {
    try {
        const [tables] = await db.promise().query('SHOW TABLES');
        const tableName = `Tables_in_${process.env.DB_NAME || 'ecosync_hub'}`;
        const tableList = tables.map(t => t[tableName]);

        // Get row count for each table
        const tablesWithCounts = await Promise.all(
            tableList.map(async (table) => {
                try {
                    const [countResult] = await db.promise().query(`SELECT COUNT(*) as count FROM ??`, [table]);
                    return { name: table, count: countResult[0].count };
                } catch (err) {
                    return { name: table, count: 0 };
                }
            })
        );

        res.json(tablesWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tables', error: error.message });
    }
});

// Get table schema and data
router.get('/tables/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const { page = 1, limit = 50, search = '', sortBy = '', sortOrder = 'ASC' } = req.query;

    try {
        // Get table structure
        const [columns] = await db.promise().query('DESCRIBE ??', [tableName]);

        // Build search query
        let searchCondition = '';
        let searchParams = [tableName];

        if (search) {
            const searchableColumns = columns
                .filter(col => ['varchar', 'text', 'char'].some(type => col.Type.includes(type)))
                .map(col => col.Field);

            if (searchableColumns.length > 0) {
                searchCondition = ' WHERE ' + searchableColumns.map(col => `?? LIKE ?`).join(' OR ');
                searchableColumns.forEach(col => {
                    searchParams.push(col);
                    searchParams.push(`%${search}%`);
                });
            }
        }

        // Build sort query
        let sortQuery = '';
        if (sortBy && columns.find(col => col.Field === sortBy)) {
            sortQuery = ` ORDER BY ?? ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;
            searchParams.push(sortBy);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM ??${searchCondition}`;
        const [countResult] = await db.promise().query(countQuery, searchParams.slice(0, searchParams.length - (sortBy ? 1 : 0)));
        const total = countResult[0].total;

        // Get paginated data
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `SELECT * FROM ??${searchCondition}${sortQuery} LIMIT ? OFFSET ?`;
        const [data] = await db.promise().query(dataQuery, [...searchParams, parseInt(limit), offset]);

        res.json({
            tableName,
            columns: columns.map(col => ({
                field: col.Field,
                type: col.Type,
                null: col.Null === 'YES',
                key: col.Key,
                default: col.Default,
                extra: col.Extra
            })),
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch table data', error: error.message });
    }
});

// Insert new record
router.post('/tables/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const data = req.body;

    try {
        // Remove auto-increment fields
        const [columns] = await db.promise().query('DESCRIBE ??', [tableName]);
        const autoIncrementField = columns.find(col => col.Extra.includes('auto_increment'));
        if (autoIncrementField) {
            delete data[autoIncrementField.Field];
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');

        const query = `INSERT INTO ?? (${fields.map(() => '??').join(', ')}) VALUES (${placeholders})`;
        const [result] = await db.promise().query(query, [tableName, ...fields, ...values]);

        res.json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create record', error: error.message });
    }
});

// Update record
router.put('/tables/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const data = req.body;

    try {
        // Get primary key field
        const [columns] = await db.promise().query('DESCRIBE ??', [tableName]);
        const primaryKey = columns.find(col => col.Key === 'PRI');

        if (!primaryKey) {
            return res.status(400).json({ message: 'Table has no primary key' });
        }

        // Remove primary key from update data
        delete data[primaryKey.Field];

        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(() => '?? = ?').join(', ');

        const query = `UPDATE ?? SET ${setClause} WHERE ?? = ?`;
        const params = [tableName];
        fields.forEach(field => {
            params.push(field);
            params.push(data[field]);
        });
        params.push(primaryKey.Field, id);

        const [result] = await db.promise().query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }

        res.json({ message: 'Record updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update record', error: error.message });
    }
});

// Delete record
router.delete('/tables/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;

    try {
        // Get primary key field
        const [columns] = await db.promise().query('DESCRIBE ??', [tableName]);
        const primaryKey = columns.find(col => col.Key === 'PRI');

        if (!primaryKey) {
            return res.status(400).json({ message: 'Table has no primary key' });
        }

        const query = `DELETE FROM ?? WHERE ?? = ?`;
        const [result] = await db.promise().query(query, [tableName, primaryKey.Field, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }

        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete record', error: error.message });
    }
});

// Bulk delete records
router.post('/tables/:tableName/bulk-delete', async (req, res) => {
    const { tableName } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid IDs array' });
    }

    try {
        const [columns] = await db.promise().query('DESCRIBE ??', [tableName]);
        const primaryKey = columns.find(col => col.Key === 'PRI');

        if (!primaryKey) {
            return res.status(400).json({ message: 'Table has no primary key' });
        }

        const placeholders = ids.map(() => '?').join(', ');
        const query = `DELETE FROM ?? WHERE ?? IN (${placeholders})`;
        const [result] = await db.promise().query(query, [tableName, primaryKey.Field, ...ids]);

        res.json({ message: `${result.affectedRows} record(s) deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete records', error: error.message });
    }
});

module.exports = router;
