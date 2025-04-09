const { sql, pool } = require('../configs/database');
const TheLoai = require('../models/TheLoai');

class TheLoaiRepository {
    static async getAll() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM THELOAI');
            return result.recordset.map(row => new TheLoai(
                row.MATL,
                row.TENTL
            ));
        } catch (err) {
            console.error('Error in getAll TheLoai:', err);
            throw err;
        }
    }

    static async add(theLoai) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maTL', sql.NVarChar, theLoai.maTL);
            request.input('tenTL', sql.NVarChar, theLoai.tenTL);

            const result = await request.query(`
                INSERT INTO THELOAI (MATL, TENTL)
                VALUES (@maTL, @tenTL)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add TheLoai:', err);
            throw err;
        }
    }

    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('prefix', sql.NVarChar, 'TL%')
                .query('SELECT MAX(MATL) as maxId FROM THELOAI WHERE MATL LIKE @prefix');
            const maxId = result.recordset[0].maxId;
            if (!maxId) return 1;
            return parseInt(maxId.replace('TL', '').trim());
        } catch (err) {
            console.error('Error in getCurrentId TheLoai:', err);
            throw err;
        }
    }

    static async delete(maTL) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maTL', sql.NVarChar, maTL);
            const record = await request.query('UPDATE THELOAI SET XOA = 1 WHERE MATL = @maTL');    
            return record.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in delete TheLoai:', err);
            throw err;
        }
    }

    static async getNextId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MATL) as maxId FROM THELOAI');
            const maxId = parseInt(result.recordset[0].maxId.substring(2));

            const nextId = `TL${(maxId + 1).toString().padStart(3, '0')}`;
            return nextId;
        } catch (err) {
            console.error('Error in getNextId TheLoai:', err);
            throw err;
        }
    }   
}

module.exports = TheLoaiRepository;