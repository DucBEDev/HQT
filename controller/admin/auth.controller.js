const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, createUserConnection } = require('../../configs/database');

const systemConfig = require('../../configs/system');

// [GET] /auth/login
module.exports.showLogIn = async (req, res) => {
    res.render('admin/pages/auth/login');
} 

// [POST] /auth/login
module.exports.logIn = async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password)

    try {
        // Tạo kết nối với thông tin đăng nhập người dùng
        const userPool = await createUserConnection(username, password);

        // Lưu pool vào session
        // req.session.userPool = userPool;
        // req.session.username = username;
        console.log('User pool created successfully!');
        console.log(userPool);

        res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
    } catch (err) {
        req.flash('error', 'Tên người dùng hoặc mật khẩu không đúng!');
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
};
