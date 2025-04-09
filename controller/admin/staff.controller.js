const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const NhanVienRepository = require('../../repositories/NhanVienRepository');

const systemConfig = require('../../configs/system');

// [GET] /staff
module.exports.index = async (req, res) => {
    const list = await NhanVienRepository.getAll();

    res.render('admin/pages/nhanvien/index', {
        staffList: list,
        pageTitle: 'Quản lý nhân viên',
    });
}
