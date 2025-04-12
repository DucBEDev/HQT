const { sql, pool } = require('../configs/database');
const DauSach = require('../models/DauSach');

class DauSachRepository {
    static async getAll() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM DAUSACH');
            return result.recordset.map(row => new DauSach(
                row.ISBN,
                row.TENSACH,
                row.KHOSACH,
                row.NOIDUNG,
                row.HINHANHPATH,
                row.NGAYXUATBAN,
                row.LANXUATBAN === null ? null : row.LANXUATBAN,
                row.SOTRANG === null ? null : row.SOTRANG,
                row.GIA === null ? null : row.GIA,
                row.NHAXB,
                row.MANGONNGU === null ? null : row.MANGONNGU,
                row.MATL,
                row.MATACGIA
            ));
        } catch (err) {
            console.error('Error in getAll DauSach:', err);
            throw err;
        }
    }

    static async add(dauSach) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('isbn', sql.NVarChar, dauSach.isbn);
            request.input('tenSach', sql.NVarChar, dauSach.tenSach);
            request.input('khoSach', sql.NVarChar, dauSach.khoSach);
            request.input('noiDung', sql.NVarChar, dauSach.noiDung);
            request.input('hinhAnhPath', sql.NVarChar, dauSach.hinhAnhPath);
            request.input('ngayXuatBan', sql.DateTime, dauSach.ngayXuatBan);
            request.input('lanXuatBan', sql.Int, dauSach.lanXuatBan);
            request.input('soTrang', sql.Int, dauSach.soTrang);
            request.input('gia', sql.BigInt, dauSach.gia);
            request.input('nhaXB', sql.NVarChar, dauSach.nhaXB);
            request.input('maNgonNgu', sql.Int, dauSach.maNgonNgu);
            request.input('maTL', sql.NVarChar, dauSach.maTL);
            request.input('maTacGia', sql.Int, dauSach.maTacGia);

            const result = await request.query(`
                INSERT INTO DAUSACH (ISBN, TENSACH, KHOSACH, NOIDUNG, HINHANHPATH, NGAYXUATBAN, LANXUATBAN, SOTRANG, GIA, NHAXB, MANGONNGU, MATL, MATACGIA)
                VALUES (@isbn, @tenSach, @khoSach, @noiDung, @hinhAnhPath, @ngayXuatBan, @lanXuatBan, @soTrang, @gia, @nhaXB, @maNgonNgu, @maTL, @maTacGia)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add DauSach:', err);
            throw err;
        }
    }

    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('prefix', sql.NVarChar, 'ISBN%')
                .query('SELECT MAX(ISBN) as maxId FROM DAUSACH WHERE ISBN LIKE @prefix');
            const maxId = result.recordset[0].maxId;
            if (!maxId) return 0;
            return parseInt(maxId.replace('ISBN', '').trim());
        } catch (err) {
            console.error('Error in getCurrentId DauSach:', err);
            throw err;
        }
    }

    static async getAllWithQuantity() {
        try {
            await pool.connect();
            const result = await pool.request().query(`SELECT 
                                                        ds.ISBN,
                                                        s.MASACH,
                                                        ds.TENSACH,
                                                        s.TINHTRANG,
                                                        COUNT(s.MASACH) OVER (PARTITION BY ds.ISBN) AS SOLUONG
                                                    FROM DAUSACH AS ds 
                                                    LEFT JOIN SACH AS s ON ds.ISBN = s.ISBN
                                                    WHERE ds.ISDELETED = 0 
                                                        AND (s.ISDELETED = 0 OR s.ISDELETED IS NULL)
                                                    ORDER BY ds.ISBN, s.MASACH;`);
            return result.recordset
        } catch (err) {
            console.error('Error in getAll DauSach:', err);
            throw err;
        }
    }
}

module.exports = DauSachRepository;