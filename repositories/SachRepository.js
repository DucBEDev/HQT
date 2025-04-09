const { sql, pool } = require('../configs/database');
const Sach = require('../models/Sach');

class SachRepository {
    static async getAll() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM SACH');
            return result.recordset.map(row => new Sach(
                row.MASACH,
                row.ISBN,
                row.TINHTRANG,
                row.CHOMUON,
                row.MANGANTU === null ? null : row.MANGANTU
            ));
        } catch (err) {
            console.error('Error in getAll Sach:', err);
            throw err;
        }
    }

    static async add(sach) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maSach', sql.NVarChar, sach.maSach);
            request.input('isbn', sql.NVarChar, sach.isbn);
            request.input('tinhTrang', sql.Bit, sach.tinhTrang);
            request.input('choMuon', sql.Bit, sach.choMuon);
            request.input('maNganTu', sql.Int, sach.maNganTu);

            const result = await request.query(`
                INSERT INTO SACH (MASACH, ISBN, TINHTRANG, CHOMUON, MANGANTU)
                VALUES (@maSach, @isbn, @tinhTrang, @choMuon, @maNganTu)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add Sach:', err);
            throw err;
        }
    }

    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('prefix', sql.NVarChar, 'SACH%')
                .query('SELECT MAX(MASACH) as maxId FROM SACH WHERE MASACH LIKE @prefix');
            const maxId = result.recordset[0].maxId;
            if (!maxId) return 1;
            return parseInt(maxId.replace('SACH', '').trim());
        } catch (err) {
            console.error('Error in getCurrentId Sach:', err);
            throw err;
        }
    }
}

module.exports = SachRepository;