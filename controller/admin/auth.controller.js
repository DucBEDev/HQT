const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, createUserConnection, defaultPool} = require('../../configs/database');

const NhanVienRepository = require('../../repositories/NhanVienRepository');

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
        console.log('Role:', role);
        if (!role || role.length === 0 || role[0] !=="THUTHU")
        {
            console.log('Role not found or not THUTHU');
            req.flash('error', 'Tên người dùng hoặc mật khẩu không đúng!');
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
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

        res.redirect(`${systemConfig.prefixAdmin}/staff`);
    } catch (err) {
        req.flash('error', 'Tên người dùng hoặc mật khẩu không đúng!');
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
};

// [GET] /auth/change-password-enter-login
module.exports.showChangePasswordEnterLogin = async (req, res) => {
    res.render('admin/pages/auth/change-password-enter-login');
};

// [POST] /auth/change-password-enter-login
module.exports.changePasswordEnterLogin = async (req, res) => {
    const {username} = req.body;

    try {
        const request = defaultPool.request(); // Tạo request
        request.input('LoginName', sql.NVarChar, username); // Thêm tham số MATL
        const result = await request.query('SELECT * FROM sys.server_principals WHERE name = @LoginName'); // Truy vấn với tham số
        
        if (result) {
            req.session.changePassUsername = username;
            res.redirect(`${systemConfig.prefixAdmin}/auth/change-password`);
        } else {
            req.flash('error', 'Tên người dùng không tồn tại!');
            res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }
    }
    catch (err) {
        req.flash('error', 'Có lỗi xảy ra trong quá trình tìm kiếm tài khoản!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

};

// [GET] /auth/change-password
module.exports.showChangePassword = async (req, res) => {
    res.render('admin/pages/auth/change-password')
};

// [POST] /auth/change-password
module.exports.changePassword = async (req, res) => {
    const {oldPass, newPass} = req.body;
    const username = req.session.changePassUsername;

    try {
        const params = [
            { name: 'LoginName', type: sql.NVarChar, value: username },
            { name: 'NewPassword', type: sql.NVarChar, value: newPass },
            { name: 'OldPassword', type: sql.NVarChar, value: oldPass }
        ];
        await executeStoredProcedure(defaultPool, 'sp_ChangeLoginPassword', params);

        req.flash('success', 'Đổi mật khẩu thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    catch (err) {
        req.flash('error', 'Có lỗi xảy ra trong quá trình tìm kiếm tài khoản!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
};

// [GET] /auth/logout
module.exports.logout = async (req, res) => {
    req.session.destroy();
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};
