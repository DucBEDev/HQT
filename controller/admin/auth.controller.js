const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const NhanVienRepository = require('../../repositories/NhanVienRepository');

const systemConfig = require('../../configs/system');

// [GET] /auth/login
module.exports.showLogIn = async (req, res) => {
    res.render('admin/pages/auth/login');
} 

// [POST] /auth/login
module.exports.logIn = async (req, res) => {
    const { email, password } = req.body;
    // const params = [
    //     { name: 'LGNAME', type: sql.VarChar, value: email },
    //     { name: 'PASS', type: sql.VarChar, value: password }
    // ];

    try {
        // const result = await executeStoredProcedure('sp_DangNhap', params);
        const staff = await NhanVienRepository.getById("3");
        res.cookie('userAdmin', "3");
        res.redirect(`${systemConfig.prefixAdmin}/staff`);
        
    } catch (error) {
        console.log(error);
        res.render('client/pages/auth/login', {
            message: 'Sai tên tài khoản hoặc mật khẩu'
        });
    }
}       
