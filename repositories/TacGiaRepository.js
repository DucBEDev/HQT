const { sql, pool } = require('../configs/database');
const TacGia = require('../models/TacGia');

class TacGiaRepository {
    static async getAll() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM TACGIA');
            return result.recordset.map(row => new TacGia(
                row.MATACGIA,
                row.HOTENTG,
                row.DIACHITG,
                row.DIENTHOAITG
            ));
        } catch (err) {
            console.error('Error in getAll TacGia:', err);
            throw err;
        }
    }

    static async add(tacGia) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('hoTenTG', sql.NVarChar, tacGia.hoTenTG);
            request.input('dia ЧиTG', sql.NVarChar, tacGia.diaChiTG);
            request.input('dienThoaiTG', sql.NVarChar, tacGia.dienThoaiTG);

            const result = await request.query(`
                INSERT INTO TACGIA (HOTENTG, DIACHITG, DIENTHOAITG)
                VALUES (@hoTenTG, @diaChiTG, @dienThoaiTG)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add TacGia:', err);
            throw err;
        }
    }

    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MATACGIA) as maxId FROM TACGIA');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId TacGia:', err);
            throw err;
        }
    }
}

module.exports = TacGiaRepository;