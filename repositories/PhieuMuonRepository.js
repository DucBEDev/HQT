const { sql, pool } = require('../configs/database');
const PhieuMuon = require('../models/PhieuMuon');

class PhieuMuonRepository {
    // Lấy tất cả phiếu mượn (chưa bị xóa)
    static async getAll() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM PHIEUMUON WHERE ISDELETED = 0');
            return result.recordset.map(row => new PhieuMuon(
                row.MAPHIEU,
                row.MADG,
                row.HINHTHUC,
                row.NGAYMUON,
                row.MANV
            ));
        } catch (err) {
            console.error('Error in getAll PhieuMuon:', err);
            throw err;
        }
    }

    // Lấy phiếu mượn theo mã phiếu
    static async getById(maPhieu) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('MAPHIEU', sql.BigInt, maPhieu);
            
            const resultPM = await request.query('SELECT * FROM PHIEUMUON WHERE MAPHIEU = @MAPHIEU AND ISDELETED = 0');
            if (resultPM.recordset.length === 0) {
                throw new Error('Không tìm thấy phiếu mượn với mã này');
            }
            const phieuMuon = resultPM.recordset[0];
            const returnPM = new PhieuMuon(phieuMuon.MAPHIEU, phieuMuon.MADG, phieuMuon.HINHTHUC, phieuMuon.NGAYMUON, phieuMuon.MANV);

            const resultCTPM = await request.query(
                                                `SELECT ctpm.MAPHIEU AS maPhieu,
                                                        ctpm.MASACH AS maSach,
                                                        ctpm.TINHTRANGMUON AS tinhTrangMuon,
                                                        ctpm.NGAYTRA AS ngayTra,
                                                        ds.TENSACH AS tenSach
                                                FROM CT_PHIEUMUON ctpm
                                                LEFT JOIN SACH s ON s.MASACH = ctpm.MASACH
                                                LEFT JOIN DAUSACH ds ON ds.ISBN = s.ISBN
                                                WHERE ctpm.MAPHIEU = @MAPHIEU`
            );
            
            return { phieuMuon: returnPM, ctpmList: resultCTPM.recordset };
        } catch (err) {
            console.error('Error in getById PhieuMuon:', err);
            throw err;
        }
    }

    // Thêm phiếu mượn mới
    static async add(phieuMuon) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('maDG', sql.BigInt, phieuMuon.maDG);
            request.input('hinhThuc', sql.Bit, phieuMuon.hinhThuc);
            request.input('ngayMuon', sql.SmallDateTime, phieuMuon.ngayMuon || new Date());
            request.input('maNV', sql.Int, phieuMuon.maNV);

            const result = await request.query(`
                INSERT INTO PHIEUMUON (MADG, HINHTHUC, NGAYMUON, MANV)
                VALUES (@maDG, @hinhThuc, @ngayMuon, @maNV)
            `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Error in add PhieuMuon:', err);
            throw err;
        }
    }

    // Lấy mã phiếu mượn hiện tại (mã lớn nhất)
    static async getCurrentId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MAPHIEU) as maxId FROM PHIEUMUON');
            return result.recordset[0].maxId || 0;
        } catch (err) {
            console.error('Error in getCurrentId PhieuMuon:', err);
            throw err;
        }
    }

    // Lấy mã phiếu mượn tiếp theo
    static async getNextId() {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MAX(MAPHIEU) as maxId FROM PHIEUMUON');
            return parseInt(result.recordset[0].maxId || 0) + 1;
        } catch (err) {
            console.error('Error in getNextId PhieuMuon:', err);
            throw err;
        }
    }

    // Trả sách
    static async bookReturn(maPhieu) {
        try {
            await pool.connect();
            const request = pool.request();
            request.input('MAPHIEU', sql.BigInt, maPhieu);
            await request.query('UPDATE CT_PHIEUMUON SET TRA = 1 WHERE MAPHIEU = @MAPHIEU');
        } catch (err) {
            console.error('Error in getNextId PhieuMuon:', err);
            throw err;
        }
    }
}

module.exports = PhieuMuonRepository;