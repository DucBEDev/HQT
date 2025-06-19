const { sql } = require('../configs/database');
const DauSach = require('../models/DauSach');

class DauSachRepository {
    static async getAll(pool) {
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
                row.ISDELETED
            ));
        } catch (err) {
            console.error('Error in getAll DauSach:', err);
            throw err;
        }
    }

    static async add(pool, dauSach) {
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

    static async getCurrentId(pool) {
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

    static async getAllBaseOnType(pool, type) {
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

    static async getAllBaseOnDate(pool, startDate, endDate, quantity) {
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

    static async getAllWithQuantity(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query(`SELECT 
                                                        ds.ISBN,
                                                        s.MASACH,
                                                        ds.TENSACH,
                                                        s.TINHTRANG,
                                                        s.CHOMUON,
                                                        COUNT(s.MASACH) OVER (PARTITION BY ds.ISBN) AS SOLUONG
                                                    FROM DAUSACH AS ds 
                                                    LEFT JOIN SACH AS s ON ds.ISBN = s.ISBN
                                                    WHERE ds.ISDELETED = 0 
                                                        AND (s.ISDELETED = 0 OR s.ISDELETED IS NULL) AND s.TINHTRANG = 1 
                                                    ORDER BY ds.ISBN, s.MASACH;`);
            return result.recordset
        } catch (err) {
            console.error('Error in getAll DauSach:', err);
            throw err;
        }
    }

    static async getAllWithStatus(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                WITH SachStats AS (
                    SELECT 
                        ISBN,
                        COUNT(MASACH) AS SOLUONG,
                        SUM(CASE WHEN CHOMUON = 0 THEN 1 ELSE 0 END) AS SOLUONGCHOMUON
                    FROM SACH
                    WHERE ISBN IS NOT NULL
                    GROUP BY ISBN
                )
                SELECT DISTINCT
                    ds.ISBN, 
                    ds.TENSACH, 
                    ds.KHOSACH, 
                    ds.NOIDUNG, 
                    ds.SOTRANG, 
                    ds.GIA, 
                    ds.HINHANHPATH,
                    ds.NGAYXUATBAN, 
                    ds.LANXUATBAN, 
                    ds.NHAXB,
                    tl.TENTL,
                    nn.NGONNGU,
                    STRING_AGG(tg.HOTENTG, ', ') AS TENTACGIA,
                    COALESCE(ss.SOLUONG, 0) AS SOLUONG,
                    COALESCE(ss.SOLUONGCHOMUON, 0) AS SOLUONGCHOMUON
                FROM DAUSACH ds
                LEFT JOIN SachStats ss ON ds.ISBN = ss.ISBN
                LEFT JOIN THELOAI tl ON ds.MATL = tl.MATL
                LEFT JOIN NGONNGU nn ON ds.MANGONNGU = nn.MANGONNGU
                LEFT JOIN TACGIA_SACH tgs ON tgs.ISBN = ds.ISBN
                LEFT JOIN TACGIA tg ON tg.MATACGIA = tgs.MATACGIA
                WHERE ds.ISDELETED = 0 OR ds.ISDELETED IS NULL
                GROUP BY 
                    ds.ISBN, ds.TENSACH, ds.KHOSACH, ds.NOIDUNG, ds.SOTRANG, ds.GIA,
                    ds.HINHANHPATH, ds.NGAYXUATBAN, ds.LANXUATBAN, ds.NHAXB,
                    tl.TENTL, nn.NGONNGU, ss.SOLUONG, ss.SOLUONGCHOMUON
                ORDER BY ds.TENSACH
            `);
            return result.recordset;
        } catch (err) {
            console.error('Error in getAllWithStatus DauSach:', err);
            throw err;
        }
    }

    static async getBookDetailByISBN(pool, isbn) {
        try {
            await pool.connect();
            
            const bookResult = await pool.request()
                .input('isbn', sql.NVarChar, isbn)
                .query(`
                    WITH SachStats AS (
                        SELECT 
                            ISBN,
                            COUNT(MASACH) AS SOLUONG,
                            SUM(CASE WHEN CHOMUON = 0 THEN 1 ELSE 0 END) AS SOLUONGCHOMUON
                        FROM SACH
                        WHERE ISBN = @isbn
                        GROUP BY ISBN
                    )
                    SELECT 
                        ds.ISBN, 
                        ds.TENSACH, 
                        ds.KHOSACH, 
                        ds.NOIDUNG, 
                        ds.SOTRANG, 
                        ds.GIA, 
                        ds.HINHANHPATH,
                        ds.NGAYXUATBAN, 
                        ds.LANXUATBAN, 
                        ds.NHAXB,
                        tl.TENTL AS TheLoai,
                        nn.NGONNGU AS NgonNgu,
                        STRING_AGG(tg.HOTENTG, ', ') AS TacGia,
                        COALESCE(ss.SOLUONG, 0) AS SOLUONG,
                        COALESCE(ss.SOLUONGCHOMUON, 0) AS SOLUONGCHOMUON
                    FROM DAUSACH ds
                    LEFT JOIN SachStats ss ON ds.ISBN = ss.ISBN
                    LEFT JOIN THELOAI tl ON ds.MATL = tl.MATL
                    LEFT JOIN NGONNGU nn ON ds.MANGONNGU = nn.MANGONNGU
                    LEFT JOIN TACGIA_SACH tgs ON tgs.ISBN = ds.ISBN
                    LEFT JOIN TACGIA tg ON tg.MATACGIA = tgs.MATACGIA
                    WHERE ds.ISBN = @isbn 
                      AND (ds.ISDELETED = 0 OR ds.ISDELETED IS NULL)
                    GROUP BY 
                        ds.ISBN, ds.TENSACH, ds.KHOSACH, ds.NOIDUNG, ds.SOTRANG, ds.GIA,
                        ds.HINHANHPATH, ds.NGAYXUATBAN, ds.LANXUATBAN, ds.NHAXB,
                        tl.TENTL, nn.NGONNGU, ss.SOLUONG, ss.SOLUONGCHOMUON
                `);
        
            const copiesResult = await pool.request()
                .input('isbn', sql.NVarChar, isbn)
                .query(`
                    SELECT 
                        s.MASACH,
                        CASE 
                            WHEN nt.MOTA IS NOT NULL AND nt.KE IS NOT NULL 
                            THEN CONCAT(nt.MOTA, ' - Kệ ', nt.KE)
                            WHEN nt.MOTA IS NOT NULL 
                            THEN nt.MOTA
                            ELSE 'Chưa xếp vị trí'
                        END AS ViTri,
                        s.TINHTRANG AS TinhTrangCode,
                        s.CHOMUON AS TrangThaiCode
                    FROM SACH s
                    LEFT JOIN NGANTU nt ON s.MANGANTU = nt.MANGANTU
                    WHERE s.ISBN = @isbn
                    ORDER BY s.MASACH
                `);
        
            // Kết hợp dữ liệu
            const book = bookResult.recordset[0] || null;
            if (book) {
                book.copies = copiesResult.recordset;
                
                // Thêm thông tin tổng hợp
                book.tongSoBan = book.copies.length;
                book.soLuongCoTheMuon = book.copies.filter(copy => copy.TrangThaiCode == false).length;
                book.soLuongDangMuon = book.copies.filter(copy => copy.TrangThaiCode == true).length;
            }
        
            return book;
        } catch (err) {
            console.error('Error in getBookDetailByISBN:', err);
            throw err;
        }
    }

    static async getDauSach(pool, isbn) {
        await pool.connect();
        const result = await pool.request()
            .input('isbn', sql.NVarChar, isbn)
            .query(`
                SELECT d.*,
                tg.MATACGIA,
                tg.HOTENTG
                FROM DAUSACH d
                LEFT JOIN TACGIA_SACH ts ON ts.ISBN = d.ISBN
                LEFT JOIN TACGIA tg ON tg.MATACGIA = ts.MATACGIA
                WHERE d.ISBN = @isbn
            `);
        return result.recordset[0];
    }
}



module.exports = DauSachRepository;