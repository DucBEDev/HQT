const { sql } = require('../configs/database');
const TacGia = require('../models/TacGia');

class TacGiaRepository {
    static async getAll(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM TACGIA WHERE ISDELETED =0');
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


    static async getById(pool, maTacGia) {
        try {
            await pool.connect(); // Kết nối đến DB
            const request = pool.request(); // Tạo request
            request.input('MATACGIA', sql.Int, maTacGia); // Thêm tham số MATL
            const result = await request.query('SELECT * FROM TACGIA WHERE MATACGIA = @MATACGIA'); // Truy vấn với tham số
            return new TacGia(result.recordset[0].MATACGIA, result.recordset[0].HOTENTG, result.recordset[0].DIACHITG, result.recordset[0].DIENTHOAITG)         
        } catch (err) {
            console.error('Error in getById TacGia:', err);
            throw err;
        }
    }


    static async add(pool, tacGia) {
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

    static async getCurrentId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MATACGIA) as maxId FROM TACGIA');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId TacGia:', err);
            throw err;
        }
    }

    static async getNextId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MATACGIA) as maxId FROM TACGIA');
            return parseInt(result.recordset[0].maxId) + 1;
        } catch (err) {
            console.error('Error in getNextId TacGia:', err);
            throw err;
        }
    }
}

module.exports = TacGiaRepository;