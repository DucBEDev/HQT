const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');
const NhanVienRepository = require('../../repositories/NhanVienRepository'); // Giả định bạn sẽ tạo repository tương ứng
const systemConfig = require('../../configs/system');
const NhanVien = require('../../models/NhanVien');

// [GET] /staff
module.exports.index = async (req, res) => {
    const list = await NhanVienRepository.getAll();

    res.render('admin/pages/nhanvien/index', {
        staffList: list,
        pageTitle: 'Quản lý nhân viên',
    });
};

// [DELETE] /staff/delete/:maNV
module.exports.delete = async (req, res) => {
    console.log("Called");

    const { maNV } = req.params; // Lấy giá trị maNV từ req.params
    console.log(maNV);

    // Định dạng params thành mảng chứa một đối tượng
    const params = [
        { name: 'MANV', type: sql.Int, value: maNV }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_XoaNhanVien', params);
        res.redirect(`${systemConfig.prefixAdmin}/staff`);
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa nhân viên!');
    }
};

// [GET] /staff/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/nhanvien/create', {
        pageTitle: 'Thêm nhân viên',
    });
};

// [POST] /staff/create
module.exports.createPost = async (req, res) => {
    const staffList = req.body;

    for (const staff of staffList) {
        const cleanHoNV = staff.hoNV.trim().replace(/\s+/g, ' ');
        const cleanTenNV = staff.tenNV.trim().replace(/\s+/g, ' ');
        const cleanDiaChi = staff.diaChi.trim().replace(/\s+/g, ' ');

        const params = [
            { name: 'HONV', type: sql.NVarChar, value: cleanHoNV },
            { name: 'TENNV', type: sql.NVarChar, value: cleanTenNV },
            { name: 'GIOITINH', type: sql.Bit, value: staff.gioiTinh == '1' },
            { name: 'DIACHI', type: sql.NVarChar, value: cleanDiaChi },
            { name: 'DIENTHOAI', type: sql.NVarChar, value: staff.dienThoai },
            { name: 'EMAIL', type: sql.NVarChar, value: staff.email }
        ];
        await executeStoredProcedureWithTransaction('sp_ThemNhanVien', params);
    }

    res.json({ success: true });
};

// [GET] /staff/edit/:maNV
module.exports.edit = async (req, res) => {
    const { maNV } = req.params;

    // Giả định có hàm lấy thông tin nhân viên từ DB
    const staff = await NhanVienRepository.getById(maNV); // Bạn cần triển khai hàm nàyd

    res.render('admin/pages/nhanvien/edit', {
        staff,
        pageTitle: 'Chỉnh sửa nhân viên',
    });
};

// [POST] /staff/edit/:maNV
module.exports.editPost = async (req, res) => {
    const { maNV } = req.params;
    const { hoNV, tenNV, diaChi, dienThoai, gioiTinh, email } = req.body;

    const staff = new NhanVien(maNV, hoNV, tenNV, diaChi, dienThoai, gioiTinh, email)

    const params = [
        { name: 'MANV', type: sql.Int, value: maNV },
        { name: 'HONV', type: sql.NVarChar, value: hoNV },
        { name: 'TENNV', type: sql.NVarChar, value: tenNV },
        { name: 'DIACHI', type: sql.NVarChar, value: diaChi },
        { name: 'DIENTHOAI', type: sql.NVarChar, value: dienThoai },
        { name: 'GIOITINH', type: sql.Bit, value: gioiTinh === '1' },
        { name: 'EMAIL', type: sql.NVarChar, value: email }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_SuaNhanVien', params);
        res.render('admin/pages/nhanvien/edit', {
            staff: staff,
            pageTitle: 'Chỉnh sửa nhân viên',
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật nhân viên!');
    }
};

// [GET] /staff/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await NhanVienRepository.getNextId();
    res.json({ success: true, nextId });
};

