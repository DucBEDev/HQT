const { sql, pool } = require('../configs/database');
const NhanVien = require('../models/NhanVien');

class NhanVienRepository {
    static async getAll() {
        try {
            await pool.connect(); // Đảm bảo pool đã kết nối
            const request = pool.request();
            const result = await request.query('SELECT * FROM NHANVIEN');
            return result.recordset.map(row => new NhanVien(
                row.MANV,
                row.HOTENNV,
                row.DIACHI,
                row.DIENTHOAI
            ));
        } catch (err) {
            console.error('Error in getAll NhanVien:', err);
            throw err;
        }
    }

    static async add(nhanVien) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('hoTenNV', sql.NVarChar, nhanVien.hoTenNV);
            request.input('diaChi', sql.NVarChar, nhanVien.diaChi);
            request.input('dienThoai', sql.NVarChar, nhanVien.dienThoai);

            const result = await request.query(`
                INSERT INTO NHANVIEN (HOTENNV, DIACHI, DIENTHOAI)
                VALUES (@hoTenNV, @diaChi, @dienThoai)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add NhanVien:', err);
            throw err;
        }
    }

    static async getCurrentId() {
        try {
            await pool.connect();
            const request = pool.request();
            const result = await request.query('SELECT MAX(MANV) as maxId FROM NHANVIEN');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId NhanVien:', err);
            throw err;
        }
    }

    static async delete(maNV) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maNV', sql.Int, maNV);
            const record = await request.query('UPDATE NHANVIEN SET TRANGTHAI = 0 WHERE MANV = @maNV'); 
            return record.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in delete NhanVien:', err);
            throw err;
        }
    }
}

module.exports = NhanVienRepository;