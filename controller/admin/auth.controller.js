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
        const userPool = await createUserConnection(username, password, req.session.id);
        userPool.on('error', err => {
            console.error(`UserPool (${username}) Connection Error:`, err);
        });

        // Lưu pool vào session
        req.session.username = username;

        res.redirect(`${systemConfig.prefixAdmin}/staff`);
    } catch (err) {
        req.flash('error', 'Tên người dùng hoặc mật khẩu không đúng!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
};


// [GET] /auth/change-password-enter-login
module.exports.showChangePasswordEnterLogin = async (req, res) => {
    res.render('admin/pages/auth/change-password-enter-login');
};


// [POST] /auth/change-password-enter-login
module.exports.changePasswordEnterLogin = async (req, res) => {
    const {username} = req.body;
    console.log(username)

    try
    {
        console.log('Checking if user exists..........................................................................')
        const request = defaultPool.request(); // Tạo request
        request.input('LoginName', sql.NVarChar, username); // Thêm tham số MATL
        const result = await request.query('SELECT * FROM sys.server_principals WHERE name = @LoginName'); // Truy vấn với tham số
        console.log(result)
        if(result)
        {
            console.log('User exists..........................................................................')
            req.session.changePassUsername = username;
            res.redirect(`${systemConfig.prefixAdmin}/auth/change-password`);
        }
        else
        {
            console.log('User does not exist..........................................................................')
            req.flash('error', 'Tên người dùng không tồn tại!');
            res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }
    }
    catch (err) {
        req.flash('error', 'Có lỗi xảy ra trong quá trình tìm kiếm tài khoản!');
        console.log(err)
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

};


// [GET] /auth/change-password
module.exports.showChangePassword = async (req, res) => {
    res.render('admin/pages/auth/change-password')
};


// [POST] /auth/change-password
module.exports.changePassword = async (req, res) => {
    console.log('Changing password..........................................................................')
    const {oldPass, newPass} = req.body;
    console.log(oldPass, newPass)
    const username = req.session.changePassUsername;

    try
    {
        const params = [
            { name: 'LoginName', type: sql.NVarChar, value: username },
            { name: 'NewPassword', type: sql.NVarChar, value: newPass },
            { name: 'OldPassword', type: sql.NVarChar, value: oldPass }
        ];
        await executeStoredProcedure(defaultPool, 'sp_ChangeLoginPassword', params)
        req.flash('success', 'Đổi mật khẩu thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    catch (err) {
        req.flash('error', 'Có lỗi xảy ra trong quá trình tìm kiếm tài khoản!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

};
