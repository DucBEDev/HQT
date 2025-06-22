const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, createUserConnection, defaultPool, getUserPool, closeUserPool} = require('../../configs/database');

const NhanVienRepository = require('../../repositories/NhanVienRepository');
const DocGiaRepository = require('../../repositories/DocGiaRepository');

const systemConfig = require('../../configs/system');

// [GET] /auth/login
module.exports.showLogIn = async (req, res) => {
    res.render('admin/pages/auth/login');
} 

// [POST] /auth/login
module.exports.logIn = async (req, res) => {
    const { username, password } = req.body;

    try {
        const role = await NhanVienRepository.getRoleByUsername(defaultPool, username);

        if (!role || role.length === 0 || role[0] !== "THUTHU") {
            return res.render('admin/pages/auth/login', {
                message: 'Tài khoản không được cấp quyền truy cập!'
            });
        }

        const userPool = await createUserConnection(username, password, req.session.id);
        userPool.on('error', err => {
            console.error(`UserPool (${username}) Connection Error:`, err);
        });

        // Lưu pool vào session
        const empId = username.split('NV')[1];


        req.session.empId = empId;
        req.session.username = username;
        req.session.role = role[0];

        req.flash("success", "Đăng nhập thành công!");
        res.redirect(`${systemConfig.prefixAdmin}/staff`);
    } catch (err) {
        req.flash("error", "Đăng nhập thất bại!")
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
};

// [GET] /auth/logout
module.exports.logout = async (req, res) => {
    closeUserPool(req.session.id)
    req.session.destroy();
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};

// [GET] /auth/changePass
module.exports.changePassword = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const empList = await NhanVienRepository.getAll(pool);
    const dgList = await DocGiaRepository.getAll(pool);

    res.render('admin/pages/auth/changePassword', {
        empList: empList,
        dgList: dgList
    })
};

// [POST] /auth/changePass
module.exports.changePasswordPost = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    console.log(pool.config.password)

    try {
        const { userType, userId, newPassword, confirmPassword } = req.body;
        let newUserId = ((userType == 'librarian') ? 'NV' : 'DG') + userId;

        if (newPassword !== confirmPassword) {
            req.flash("error", "Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return res.redirect(`${systemConfig.prefixAdmin}/auth/changePass`);
        }

        const params = [
            { name: 'LoginName', type: sql.NVarChar, value: newUserId },
            { name: 'NewPassword', type: sql.NVarChar, value: newPassword },
            { name: 'OldPassword', type: sql.NVarChar, value: null }
        ];
        console.log(params)
        await executeStoredProcedure(pool, 'sp_ChangeLoginPassword', params);

        req.flash('success', "Đổi mật khẩu thành công!");
        res.redirect(`${systemConfig.prefixAdmin}/auth/changePass`);
    } catch (error) {
        console.log(error);
        req.flash("error", "Đổi mật khẩu thất bại!");
        res.redirect(`${systemConfig.prefixAdmin}/auth/changePass`);
    }
};

// [GET] /auth/formLogin
module.exports.formLoginView = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const empList = await NhanVienRepository.getEmployeeLogins(pool);
    const dgList = await DocGiaRepository.getReaderLogins(pool);

    res.render('admin/pages/auth/deleteLogin', {
        empList: empList,
        dgList: dgList
    })
};

// [DELETE] /auth/deleteLogin
module.exports.deleteLogin = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const { userType, userId } = req.body;
        let newUserId = ((userType == 'librarian') ? 'NV' : 'DG') + userId;

        const userTypeTest = (userType == 'librarian') ? 'NHANVIEN_LOGIN' : 'DOCGIA_LOGIN';


        const params = [
            { name: 'ID', type: sql.BigInt, value: userId },
            { name: 'USER_TYPE', type: sql.NVarChar, value: userTypeTest }
        ];

        await executeStoredProcedure(pool, 'sp_XoaTaiKhoanMoi', params);

        req.flash('success', "Xoá login thành công!");
        res.redirect(`${systemConfig.prefixAdmin}/auth/deleteLogin`);
    } catch (error) {
        req.flash("error", "Xóa login thất bại!");
        res.redirect(`${systemConfig.prefixAdmin}/auth/deleteLogin`);
    }
    
};

// [POST /auth/createLogin
module.exports.createLogin = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const { userType, userId, password, confirmPassword } = req.body;
        const loginName = ((userType == 'librarian') ? "NV" : "DG") + userId;
        console.log(loginName)

        // const params = [
        //     { name: 'ID', type: sql.BigInt, value: userId },
        //     { name: 'USER_TYPE', type: sql.NVarChar, value: userTypeTest }
        // ];

        // await executeStoredProcedure(pool, 'sp_XoaTaiKhoanMoi', params);

        req.flash("success", "Tạo login thành công!");
        res.redirect(`${systemConfig.prefixAdmin}/auth/formLogin`);
        
    } catch (error) {
        req.flash("error", "Tạo login thất bại!");
        res.redirect("back");
    }

}
