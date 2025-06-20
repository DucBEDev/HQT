const { sql } = require('../configs/database');
const NhanVien = require('../models/NhanVien');

class NhanVienRepository {
    static async getAll(pool) {
        try {
            await pool.connect(); // Đảm bảo pool đã kết nối
            const request = pool.request();
            const result = await request.query('SELECT * FROM NHANVIEN WHERE ISDELETED =0');
            return result.recordset.map(row => new NhanVien(
                row.MANV,
                row.HONV,
                row.TENNV,
                row.DIACHI,
                row.DIENTHOAI,
                row.GIOITINH,
                row.EMAIL
            ));
        } catch (err) {
            console.error('Error in getAll NhanVien:', err);
            throw err;
        }
    }


    static async getById(pool, maNV) {
        try {
            await pool.connect(); // Kết nối đến DB
            const request = pool.request(); // Tạo request
            request.input('MANV', sql.Int, maNV); // Thêm tham số MATL
            const result = await request.query('SELECT * FROM NHANVIEN WHERE MANV = @MANV'); // Truy vấn với tham số
            return new NhanVien(result.recordset[0].MANV, result.recordset[0].HONV, result.recordset[0].TENNV, result.recordset[0].DIACHI, result.recordset[0].DIENTHOAI, result.recordset[0].GIOITINH, result.recordset[0].EMAIL)         
        } catch (err) {
            console.error('Error in getById NhanVien:', err);
            throw err;
        }
    }


    static async add(pool, nhanVien) {
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

    static async getCurrentId(pool) {
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

    static async delete(pool, maNV) {
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

    static async getNextId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MANV) as maxId FROM NHANVIEN');
            return parseInt(result.recordset[0].maxId) + 1;
        } catch (err) {
            console.error('Error in getNextId NhanVien:', err);
            throw err;
        }
    }


    static async getRoleByUsername(pool, username) {
        try {
            await pool.connect();
            const request = pool.request();

            request.input('LoginName', sql.NVarChar, username);

            const result = await request.query(`
                SELECT 
                    r.name AS ServerRole
                FROM sys.server_role_members rm
                JOIN sys.server_principals r ON rm.role_principal_id = r.principal_id
                JOIN sys.server_principals m ON rm.member_principal_id = m.principal_id
                WHERE m.name = @LoginName
                UNION
                SELECT name AS ServerRole
                FROM sys.server_principals
                WHERE principal_id IN (
                    SELECT role_principal_id 
                    FROM sys.server_role_members 
                    WHERE member_principal_id = (
                        SELECT principal_id 
                        FROM sys.server_principals 
                        WHERE name = @LoginName
                    )
                );
            `);
            return result.recordset.map(row => row.ServerRole);
        } catch (err) {
            console.error('Error in get Role:', err);
            throw err;
        }
    }

    static async getEmployeeLogins(pool) {
        try {
            await pool.connect();
            const request = pool.request();
            const result = await request.query(`
                SELECT 
                    sp.name as LOGIN_NAME,
                    nv.MANV,
                    nv.HONV,
                    nv.TENNV,
                    sp.is_disabled
                FROM sys.server_principals sp
                INNER JOIN NHANVIEN nv ON sp.name = 'NV' + CAST(nv.MANV AS VARCHAR) 
                WHERE sp.type = 'S'
                AND nv.ISDELETED = 0
                ORDER BY sp.name
            `);
            return result.recordset;
        } catch (err) {
            console.error('Error in getEmployeeLogins:', err);
            throw err;
        }
    }
}

module.exports = NhanVienRepository;