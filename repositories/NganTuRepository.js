const { sql } = require('../configs/database');
const NganTu = require('../models/NganTu');

class NganTuRepository {
    static async getAll(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM NGANTU');
            return result.recordset.map(row => new NganTu(
                row.MANGANTU,
                row.MOTA,
                row.KE
            ));
        } catch (err) {
            console.error('Error in getAll NganTu:', err);
            throw err;      
        }
    }


    static async getById(pool, maNT) {
        try {
            await pool.connect(); // Kết nối đến DB
            const request = pool.request(); // Tạo request
            request.input('MANGANTU', sql.Numeric, maNT); 
            const result = await request.query('SELECT * FROM NGANTU WHERE MANGANTU = @MANGANTU'); // Truy vấn với tham số
            return new NganTu(result.recordset[0].MANGANTU, result.recordset[0].MOTA, result.recordset[0].KE)
        } catch (err) {
            console.error('Error in getById NganTu:', err);
            throw err;
        }
    }

    static async getCurrentId(pool) {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('prefix', sql.NVarChar, 'GT%')
                .query('SELECT MAX(MANGANTU) as maxId FROM NGANTU WHERE MANGANTU LIKE @prefix');
            const maxId = result.recordset[0].maxId;
            if (!maxId) return 1;
            return parseInt(maxId.replace('GT', '').trim());
        } catch (err) {
            console.error('Error in getCurrentId NganTu:', err);
            throw err;
        }
    }

    static async getNextId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MANGANTU) as maxId FROM NGANTU');
            const maxId = parseInt(result.recordset[0].maxId.substring(2));

            const nextId = `GT${(maxId + 1).toString().padStart(3, '0')}`;
            return nextId;
        } catch (err) {
            console.error('Error in getNextId NganTu:', err);
            throw err;
        }
    }   
}

module.exports = NganTuRepository;