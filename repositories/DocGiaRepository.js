const { sql, pool } = require('../configs/database');
const DocGia = require('../models/DocGia');

class DocGiaRepository {
    static async getAll() {
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


    static async getById(maDG) {
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

    static async add(docGia) {
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

    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MADG) as maxId FROM DOCGIA');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId DocGia:', err);
            throw err;
        }
    }

    static async delete(maDG) {
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

    static async changeStatus(maDG, newStatus) {
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

    static async getNextId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MADG) as maxId FROM DOCGIA');
            return parseInt(result.recordset[0].maxId) + 1;
        } catch (err) {
            console.error('Error in getNextId DocGia:', err);
            throw err;
        }
    }
}

module.exports = DocGiaRepository;