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
                row.MATL
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

            const result = await request.query(`
                INSERT INTO DAUSACH (ISBN, TENSACH, KHOSACH, NOIDUNG, HINHANHPATH, NGAYXUATBAN, LANXUATBAN, SOTRANG, GIA, NHAXB, MANGONNGU, MATL)
                VALUES (@isbn, @tenSach, @khoSach, @noiDung, @hinhAnhPath, @ngayXuatBan, @lanXuatBan, @soTrang, @gia, @nhaXB, @maNgonNgu, @maTL)
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

    static async getAllBaseOnType(type) {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('type', sql.NVarChar, type)
                .query(`SELECT 
                        ds.ISBN AS isbn,
                        ds.TENSACH AS tenSach,
                        ds.NGAYXUATBAN AS ngayXuatBan,
                        ds.SOTRANG AS soTrang,
                        STRING_AGG(tg.HOTENTG, ', ') WITHIN GROUP (ORDER BY tg.HOTENTG) AS tacGia,
                        nn.NGONNGU AS ngonNgu,
                        COUNT(s.MASACH) AS soCuon
                    FROM DAUSACH AS ds 
                    LEFT JOIN SACH AS s ON ds.ISBN = s.ISBN AND s.ISDELETED = 0
                    LEFT JOIN TACGIA_SACH AS ts ON ds.ISBN = ts.ISBN
                    LEFT JOIN TACGIA AS tg ON ts.MATACGIA = tg.MATACGIA
                    LEFT JOIN NGONNGU AS nn ON ds.MANGONNGU = nn.MANGONNGU
                    WHERE ds.ISDELETED = 0 AND ds.MATL = @type
                    GROUP BY ds.ISBN, ds.TENSACH, ds.NGAYXUATBAN, ds.SOTRANG, nn.NGONNGU
                    ORDER BY ds.TENSACH ASC;`);
            return result.recordset
        } catch (err) {
            console.error('Error in getAll DauSach:', err);
            throw err;
        }
    }

    static async getAllBaseOnDate(startDate, endDate, quantity) {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('startDate', sql.DateTime, startDate)
                .input('endDate', sql.DateTime, endDate)
                .input('quantity', sql.Int, quantity)
                .query(`SELECT 
                        ds.ISBN AS isbn,
                        ds.TENSACH AS tenSach,
                        tg.HOTENTG AS hoTenTG,
                        tl.TENTL AS tenTL,
                        COUNT(pm.MAPHIEU) AS soLuongMuon
                        FROM PHIEUMUON pm
                        LEFT JOIN CT_PHIEUMUON ctpm ON pm.MAPHIEU = ctpm.MAPHIEU
                        LEFT JOIN SACH s ON s.MASACH = ctpm.MASACH
                        LEFT JOIN DAUSACH ds ON ds.ISBN = s.ISBN
                        LEFT JOIN TACGIA_SACH ts ON ts.ISBN = ds.ISBN
                        LEFT JOIN TACGIA tg ON tg.MATACGIA = ts.MATACGIA
                        LEFT JOIN THELOAI tl ON tl.MATL = ds.MATL
                        WHERE pm.NGAYMUON BETWEEN @startDate AND @endDate
                        GROUP BY ds.ISBN, ds.TENSACH, tg.HOTENTG, tl.TENTL
                        ORDER BY COUNT(pm.MAPHIEU) DESC
                        OFFSET 0 ROWS FETCH NEXT @quantity ROWS ONLY;`);
            return result.recordset
        } catch (err) {
            console.error('Error in getAll DauSach:', err);
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