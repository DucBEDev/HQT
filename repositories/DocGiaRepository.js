const { sql } = require('../configs/database');
const DocGia = require('../models/DocGia');

class DocGiaRepository {
    static async getAll(pool) {
        try {
            await pool.connect();
            // const result = await pool.request().query('SELECT * FROM DOCGIA WHERE XOA = 0');
            const result = await pool.request().query('SELECT * FROM DOCGIA WHERE ISDELETED =0');
            return result.recordset.map(row => new DocGia(
                row.MADG,
                row.HODG,
                row.TENDG,
                row.EMAILDG,
                row.SOCMND,
                row.GIOITINH,
                row.NGAYSINH,
                row.DIACHIDG,
                row.DIENTHOAI,
                row.NGAYLAMTHE,
                row.NGAYHETHAN,
                row.HOATDONG
            ));
        } catch (err) {
            console.error('Error in getAll DocGia:', err);
            throw err;
        }
    }


    static async getById(pool, maDG) {
        try {
            await pool.connect(); // Kết nối đến DB
            const request = pool.request(); // Tạo request
            request.input('MADG', sql.Int, maDG); // Thêm tham số MADG
            const result = await request.query('SELECT * FROM DOCGIA WHERE MADG = @MADG'); // Truy vấn với tham số
            if (result.recordset.length === 0) {
                throw new Error('Không tìm thấy độc giả với mã này');
            }
            const docgia = result.recordset[0];
            return new DocGia(
                docgia.MADG,
                docgia.HODG,
                docgia.TENDG,
                docgia.EMAILDG,
                docgia.SOCMND,
                docgia.GIOITINH,
                docgia.NGAYSINH,
                docgia.DIACHIDG,
                docgia.DIENTHOAI,
                docgia.NGAYLAMTHE,
                docgia.NGAYHETHAN,
                docgia.HOATDONG
            );
        } catch (err) {
            console.error('Error in getById DocGia:', err);
            throw err;
        }
    }

    static async add(pool, docGia) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('hoDG', sql.NVarChar, docGia.hoDG);
            request.input('tenDG', sql.NVarChar, docGia.tenDG);
            request.input('emailDG', sql.NVarChar, docGia.emailDG);
            request.input('soCMND', sql.NVarChar, docGia.soCMND);
            request.input('gioiTinh', sql.Bit, docGia.gioiTinh);
            request.input('ngaySinh', sql.DateTime, docGia.ngaySinh);
            request.input('diaChiDG', sql.NVarChar, docGia.diaChiDG);
            request.input('dienThoai', sql.NVarChar, docGia.dienThoai);
            request.input('ngayLamThe', sql.DateTime, docGia.ngayLamThe);
            request.input('ngayHetHan', sql.DateTime, docGia.ngayHetHan);
            request.input('hoatDong', sql.Bit, docGia.hoatDong);

            const result = await request.query(`
                INSERT INTO DOCGIA (HODG, TENDG, EMAILDG, SOCMND, GIOITINH, NGAYSINH, DIACHIDG, DIENTHOAI, NGAYLAMTHE, NGAYHETHAN, HOATDONG)
                VALUES (@hoDG, @tenDG, @emailDG, @soCMND, @gioiTinh, @ngaySinh, @diaChiDG, @dienThoai, @ngayLamThe, @ngayHetHan, @hoatDong)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add DocGia:', err);
            throw err;
        }
    }


    static async checkExist(pool, docGia) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('emailDG', sql.NVarChar, docGia.emailDG);
            request.input('soCMND', sql.NVarChar, docGia.soCMND);
            request.input('dienThoai', sql.NVarChar, docGia.dienThoai);

            const result = await request.query(`
                SELECT COUNT(*) AS count
                FROM DOCGIA
                WHERE (EMAILDG = @emailDG OR SOCMND = @soCMND OR DIENTHOAI = @dienThoai)
                    AND ISDELETED = 0
            `);

            return result.recordset[0].count > 0;
        } catch (err) {
            console.error('Error in checkExist DocGia:', err);
            throw err;
        }
    }

    static async getCurrentId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MADG) as maxId FROM DOCGIA');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId DocGia:', err);
            throw err;
        }
    }

    static async delete(pool, maDG) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maDG', sql.Int, maDG);
            const record = await request.query('UPDATE DOCGIA SET XOA = 1 WHERE MADG = @maDG'); 
            return record.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in delete DocGia:', err);
            throw err;
        }
    }

    static async changeStatus(pool, maDG, newStatus) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maDG', sql.Int, maDG);
            request.input('newStatus', sql.Bit, newStatus);
            const record = await request.query('UPDATE DOCGIA SET HOATDONG = @newStatus WHERE MADG = @maDG');     
            return record.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in changeStatus DocGia:', err);
            throw err;
        }
    }

    static async getNextId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MADG) as maxId FROM DOCGIA');
            return parseInt(result.recordset[0].maxId) + 1;
        } catch (err) {
            console.error('Error in getNextId DocGia:', err);
            throw err;
        }
    }

    static async getOverdueReader(pool) {
        try {
            await pool.connect();
            const result = await pool.request()
                    .query(`SELECT 
                            dg.SOCMND AS soCMND,
                            CONCAT(dg.HODG, ' ', dg.TENDG) AS hoTen,
                            dg.DIENTHOAI AS soDT,
                            dg.EMAILDG AS email,
                            ctpm.MASACH AS maSach,
                            ds.TENSACH as tenSach,
                            pm.NGAYMUON AS ngayMuon,
                            DATEDIFF(day, DATEADD(day, 15, pm.NGAYMUON), GETDATE()) AS soNgayQuaHan,
                            (SELECT COUNT(DISTINCT dg2.MADG) 
                            FROM DOCGIA dg2
                            LEFT JOIN PHIEUMUON pm2 ON dg2.MADG = pm2.MADG
                            LEFT JOIN CT_PHIEUMUON ctpm2 ON ctpm2.MAPHIEU = pm2.MAPHIEU 
                                AND pm2.NGAYMUON < GETDATE()
                                AND ctpm2.TRA IS NULL
                            WHERE dg2.HOATDONG = 1 AND DATEDIFF(day, pm2.NGAYMUON, GETDATE()) > 0
                            ) AS soLuongDocGia
                        FROM DOCGIA dg
                        LEFT JOIN PHIEUMUON pm ON dg.MADG = pm.MADG
                        LEFT JOIN CT_PHIEUMUON ctpm ON ctpm.MAPHIEU = pm.MAPHIEU 
                            AND pm.NGAYMUON < GETDATE()
                            AND ctpm.TRA IS NULL
                        LEFT JOIN SACH s ON s.MASACH = ctpm.MASACH
                        LEFT JOIN DAUSACH ds ON ds.ISBN = s.ISBN
                        WHERE dg.HOATDONG = 1 AND DATEDIFF(day, pm.NGAYMUON, GETDATE()) > 0;`);

            return result.recordset
        } catch (err) {
            console.error('Error in getOverdueReader DocGia:', err);
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
}

module.exports = DocGiaRepository;