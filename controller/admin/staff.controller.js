const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, executeStoredProcedureWithTransactionAndReturnCode, getUserPool } = require('../../configs/database');
const systemConfig = require('../../configs/system');
const NhanVien = require('../../models/NhanVien');
const { pushToUndoStack, popUndoStack, clearUndoStack, updateAfterDeleteUndo, isEmpty } = require('../../public/js/adminjs/staff/staff-undo');

const NhanVienRepository = require('../../repositories/NhanVienRepository'); 


// [GET] /staff
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    const list = await NhanVienRepository.getAll(pool);

    res.render('admin/pages/nhanvien/index', {
        staffList: list,
        pageTitle: 'Quản lý nhân viên',
        isEmptyStack: isEmpty()
    });
};

// [DELETE] /staff/delete/:maNV
module.exports.delete = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maNV } = req.params; 
    const staff = await NhanVienRepository.getById(pool, maNV);

    const params = [
        { name: 'USER_TYPE', type: sql.VarChar(10), value: 'NHANVIEN' },
        { name: 'ID', type: sql.Int, value: maNV },

    ];

    try {
        await executeStoredProcedure(pool,'sp_XoaTaiKhoanMoi', params);
        pushToUndoStack('delete', staff);
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
    try {
        const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }
        
        const staffList = req.body;
        console.log(staffList)

        // let duplicateStaffs = [];
        // for (const staff of staffList) {
        //     if(NhanVienRepository.checkExist(pool, staff)=== true) {
        //         duplicateStaffs.push(staff);
        //     }
        // }

        // if (duplicateStaffs.length > 0) {
        //     return res.status(400).json({
        //         success: false, 
        //         message: 'Các nhân viên sau có sô điện thoại hoặc email trùng với số điện thoại hoặc email khác của nhân viên đã có trong database: ' + duplicateStaffs.map(a => a.hoNV + " " + a.tenNV).join(', ')
                
        //     });
        // }

        const savedStaff = [];
        for (const staff of staffList) {
            const cleanHoNV = staff.hoNV.trim().replace(/\s+/g, ' ');
            const cleanTenNV = staff.tenNV.trim().replace(/\s+/g, ' ');
            const cleanDiaChi = staff.diaChi.trim().replace(/\s+/g, ' ');

            const params = [
                { name: 'USER_TYPE', type: sql.VarChar(10), value: 'NHANVIEN' },
                { name: 'HONV', type: sql.NVarChar, value: cleanHoNV },
                { name: 'TENNV', type: sql.NVarChar, value: cleanTenNV },
                { name: 'GIOITINH', type: sql.Bit, value: staff.gioiTinh == '1' },
                { name: 'DIACHI', type: sql.NVarChar, value: cleanDiaChi },
                { name: 'DIENTHOAI', type: sql.NVarChar, value: staff.dienThoai },
                { name: 'EMAIL', type: sql.NVarChar, value: staff.email },
                { name: 'PASS', type: sql.NVarChar, value: "1111" }

            ];
            console.log(params)
            const result = await executeStoredProcedure(pool, 'sp_TaoTaiKhoanMoi', params);
            const maNV = result.recordset && result.recordset[0] ? result.recordset[0].ID : null;
            savedStaff.push({
                maNV: maNV,
                hoNV: cleanHoNV,
                tenNV: cleanTenNV,
                gioiTinh: staff.gioiTinh == '1',
                diaChi: cleanDiaChi,
                dienThoai: staff.dienThoai,
                email: staff.email
            });
        }

        pushToUndoStack('create', savedStaff);
        req.flash('success', 'Tạo nhân viên thành công!');

        res.json({ success: true });

        //res.redirect(`${systemConfig.prefixAdmin}/staff`);

    }
    catch (error) {
        console.error('Error creating staff:', error);
        req.flash('error', 'Có lỗi xảy ra khi tạo nhân viên!');

        res.status(500).json({ success: false, message: error.message });
        //res.redirect(`${systemConfig.prefixAdmin}/staff/create`);
    }
    
};

// [GET] /staff/edit/:maNV
module.exports.edit = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maNV } = req.params;

    const staff = await NhanVienRepository.getById(pool, maNV);

    res.render('admin/pages/nhanvien/edit', {
        staff,
        pageTitle: 'Chỉnh sửa nhân viên',
    });
};

// [POST] /staff/edit/:maNV
module.exports.editPost = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maNV } = req.params;
    const { hoNV, tenNV, diaChi, dienThoai, gioiTinh, email } = req.body;

    const cleanHoNV = hoNV.trim().replace(/\s+/g, ' ');
    const cleanTenNV = tenNV.trim().replace(/\s+/g, ' ');
    const cleanDiaChi = diaChi.trim().replace(/\s+/g, ' ');

    const oldStaff = await NhanVienRepository.getById(pool, maNV);
    const staff = new NhanVien(maNV, hoNV, tenNV, diaChi, dienThoai, gioiTinh, email)

    const params = [
        { name: 'MANV', type: sql.Int, value: maNV.trim() },
        { name: 'HONV', type: sql.NVarChar, value: cleanHoNV },
        { name: 'TENNV', type: sql.NVarChar, value: cleanTenNV },
        { name: 'DIACHI', type: sql.NVarChar, value: cleanDiaChi },
        { name: 'DIENTHOAI', type: sql.NVarChar, value: dienThoai },
        { name: 'GIOITINH', type: sql.Bit, value: gioiTinh === '1' },
        { name: 'EMAIL', type: sql.NVarChar, value: email.trim() }
    ];

    try {
        await executeStoredProcedureWithTransaction(pool,'sp_SuaNhanVien', params);
        pushToUndoStack('edit', oldStaff);
        res.status(200).json({
            success: true
        })
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật nhân viên!');
    }
};

// [POST] /staff/undo
module.exports.undo = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const lastAction = popUndoStack();

    if (!lastAction) {
        return res.json({ success: false, message: 'Không có thao tác để undo!' });
    }

    const { action, data } = lastAction;

    try {
        if (action === 'create') {
            // Undo create: Xóa từng nhân viên đã thêm
            for (const staff of data) {
                const params = [
                    { name: 'USER_TYPE', type: sql.VarChar(10), value: 'NHANVIEN' },
                    { name: 'ID', type: sql.Int, value: staff.maNV }
                ];
                await executeStoredProcedure(pool, 'sp_XoaTaiKhoanMoi', params);
            }
        } else if (action === 'delete') {
            const oldMaNV = data.maNV; // Lấy mã nhân viên từ dữ liệu đã xóa
            // Undo delete: Thêm lại nhân viên đã xóa
            const params = [
                { name: 'USER_TYPE', type: sql.VarChar(10), value: 'NHANVIEN' },
                { name: 'HONV', type: sql.NVarChar, value: data.hoNV },
                { name: 'TENNV', type: sql.NVarChar, value: data.tenNV },
                { name: 'GIOITINH', type: sql.Bit, value: data.gioiTinh },
                { name: 'DIACHI', type: sql.NVarChar, value: data.diaChi },
                { name: 'DIENTHOAI', type: sql.NVarChar, value: data.dienThoai },
                { name: 'EMAIL', type: sql.NVarChar, value: data.email },
                { name: 'PASS', type: sql.NVarChar, value: "1111" }, // Mật khẩu mặc định
                { name: 'MANVCU', type: sql.BigInt, value: data.maNV } // Mật khẩu mặc định

            ];
            const result = await executeStoredProcedure(pool, 'sp_TaoTaiKhoanMoi', params);
            const newMaNV = result.recordset && result.recordset[0] ? result.recordset[0].ID : null;

            updateAfterDeleteUndo(oldMaNV, newMaNV);


        } else if (action === 'edit') {
            // Undo edit: Khôi phục thông tin cũ
            const params = [
                { name: 'MANV', type: sql.Int, value: data.maNV },
                { name: 'HONV', type: sql.NVarChar, value: data.hoNV },
                { name: 'TENNV', type: sql.NVarChar, value: data.tenNV },
                { name: 'DIACHI', type: sql.NVarChar, value: data.diaChi },
                { name: 'DIENTHOAI', type: sql.NVarChar, value: data.dienThoai },
                { name: 'GIOITINH', type: sql.Bit, value: data.gioiTinh },
                { name: 'EMAIL', type: sql.NVarChar, value: data.email }
            ];
            await executeStoredProcedureWithTransaction(pool, 'sp_SuaNhanVien', params);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};


// [POST] /staff/clear-undo
module.exports.clearUndo = async (req, res) => {
    console.log("Clearing staff undo stack ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    try {
        clearUndoStack();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing undo stack:', error);
        res.json({ success: false, message: 'Không thể xóa stack undo!' });
    }
};

// [GET] /staff/next-id
module.exports.getNextId = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const nextId = await NhanVienRepository.getNextId(pool);
    res.json({ success: true, nextId });
};

// // [GET] /staff/profile
// module.exports.profile = async (req, res) => {
//     const pool = getUserPool(req.session.id);
//     if (!pool) {
//         return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
//     }

//     const staff = await NhanVienRepository.getById(pool, req.session.id);
    
//     res.render("admin/pages/nhanvien/profile", {
//         staff: staff
//     });
// };
