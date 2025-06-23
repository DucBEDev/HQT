const { sql } = require('../configs/database');
const Sach = require('../models/Sach');

class SachRepository {
    static async getAll(pool) {
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

    static async add(pool, sach) {
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

    static async getCurrentId(pool) {
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

    static async getBooksByISBN(pool, isbn) {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('isbn', sql.NVarChar, isbn)
                .query('SELECT * FROM SACH WHERE ISBN = @isbn AND ISDELETED = 0');    
            return result.recordset.map(row => new Sach(
                row.MASACH,
                row.ISBN,
                row.TINHTRANG,
                row.CHOMUON,
                row.MANGANTU === null ? null : row.MANGANTU
            ));
        } catch (err) {
            console.error('Error in getBooksByISBN Sach:', err);
            throw err;
        }
    }


    static async checkExist(pool, maSach) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('MASACH', sql.NChar(20), maSach);

            const result = await request.query(`
                SELECT COUNT(*) AS count
                FROM SACH
                WHERE MASACH = @MASACH
                    AND ISDELETED = 0
            `);

            return result.recordset[0].count > 0;
        } catch (err) {
            console.error('Error in checkExist Sach:', err);
            throw err;
        }
    }
    

    static async getNextId(pool) {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MASACH) as maxId FROM SACH');
            const maxId = parseInt(result.recordset[0].maxId.substring(4));

            const nextId = `SACH${(maxId + 1).toString().padStart(4, '0')}`;
            return nextId;
        } catch (err) {
            console.error('Error in getNextId Sach:', err);
            throw err;
        }
    }  
    
    
    static async getByMaSach(pool, maSach) {
        try {
            await pool.connect(); // Kết nối đến DB
            const request = pool.request(); // Tạo request
            request.input('MASACH', sql.NChar(20), maSach); // Thêm tham số MASACH
            const result = await request.query('SELECT * FROM SACH WHERE MASACH = @MASACH'); // Truy vấn với tham số
            if (result.recordset.length === 0) {
                return null; // Không tìm thấy bản ghi
            }
            const record = result.recordset[0];
            return new Sach(
                record.MASACH,
                record.ISBN,
                record.TINHTRANG,
                record.CHOMUON,
                record.MANGANTU
            );
        } catch (err) {
            console.error('Error in getByMaSach Sach:', err);
            throw err;
        }
    }
}

module.exports = SachRepository;