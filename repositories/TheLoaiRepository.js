const { sql, defaultPool, recreateUserPool} = require('../configs/database');
const TheLoai = require('../models/TheLoai');


class TheLoaiRepository {
    static async getAll(pool) {
        try {
            //const userPool = await recreateUserPool(pool.config);  Tạo lại pool với thông tin đăng nhập người dùng
            //await userPool.connect(); // Kết nối đến DB
            //console.log(defaultPool)
            // Use direct query (if you prefer keeping it)
            const result = await pool.request().query('SELECT * FROM THELOAI WHERE ISDELETED=0');
            return result.recordset.map(row => new TheLoai(
                row.MATL,
                row.TENTL
            ));
        } catch (err) {
            console.error('Error in getAll TheLoai:', err);
            throw err;
        }
    }


    static async getById(pool, maTL) {
        try {
           // await pool.connect(); // Kết nối đến DB
            const request = pool.request(); // Tạo request
            request.input('MATL', sql.NVarChar, maTL); // Thêm tham số MATL
            const result = await request.query('SELECT * FROM THELOAI WHERE MATL = @MATL'); // Truy vấn với tham số
            return new TheLoai(result.recordset[0].MATL, result.recordset[0].TENTL)

            
            
        } catch (err) {
            console.error('Error in getById TheLoai:', err);
            throw err;
        }
    }


    static async checkExist(pool, theLoai) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('MATL', sql.NChar(10), theLoai.MATL);

            const result = await request.query(`
                SELECT COUNT(*) AS count
                FROM THELOAI
                WHERE MATL = @MATL
                    AND ISDELETED = 0
            `);

            return result.recordset[0].count > 0;
        } catch (err) {
            console.error('Error in checkExist TheLoai:', err);
            throw err;
        }
    }

    static async getCurrentId(pool) {
        try {
           // await pool.connect();
            const result = await pool.request()
                .input('prefix', sql.NVarChar, 'TL%')
                .query('SELECT MAX(MATL) as maxId FROM THELOAI WHERE MATL LIKE @prefix');
            const maxId = result.recordset[0].maxId;
            if (!maxId) return 1;
            return parseInt(maxId.replace('TL', '').trim());
        } catch (err) {
            console.error('Error in getCurrentId TheLoai:', err);
            throw err;
        }
    }

    static async getNextId(pool) {
        try {
           // await pool.connect();
            const result = await pool.request().query('SELECT MAX(MATL) as maxId FROM THELOAI');
            const maxId = parseInt(result.recordset[0].maxId.substring(2));

            const nextId = `TL${(maxId + 1).toString().padStart(8, '0')}`;
            return nextId;
        } catch (err) {
            console.error('Error in getNextId TheLoai:', err);
            throw err;
        }
    }   
}

module.exports = TheLoaiRepository;