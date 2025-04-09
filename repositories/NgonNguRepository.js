const { sql, pool } = require('../configs/database');
const NgonNgu = require('../models/NgonNgu');

class NgonNguRepository {
    static async getAll() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM NGONNGU');
            return result.recordset.map(row => new NgonNgu(
                row.MANGONNGU,
                row.NGONNGU
            ));
        } catch (err) {
            console.error('Error in getAll NgonNgu:', err);
            throw err;
        }
    }

    static async add(ngonNgu) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('ngonNgu', sql.NVarChar, ngonNgu.ngonNgu);

            const result = await request.query(`
                INSERT INTO NGONNGU (NGONNGU)
                VALUES (@ngonNgu)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add NgonNgu:', err);
            throw err;
        }
    }

    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MANGONNGU) as maxId FROM NGONNGU');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId NgonNgu:', err);
            throw err;
        }
    }
}

module.exports = NgonNguRepository;