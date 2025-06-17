const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, createUserConnection, defaultPool} = require('../../configs/database');

const systemConfig = require('../../configs/system');
const DocGiaRepository = require('../../repositories/DocGiaRepository');

// [GET] /auth/login
module.exports.showLogIn = async (req, res) => {
    res.render('client/pages/auth/login');
} 

// [POST] /auth/login
module.exports.logIn = async (req, res) => {
    const { username, password } = req.body;

    try {
        const role = await DocGiaRepository.getRoleByUsername(defaultPool, username);

        if (!role || role.length === 0 || role[0] !== "DOCGIA") {
            return res.render('client/pages/auth/login', {
                message: 'Tài khoản không được cấp quyền truy cập!'
            });
        }

        const userPool = await createUserConnection(username, password, req.session.id);
        userPool.on('error', err => {
            console.error(`UserPool (${username}) Connection Error:`, err);
        });

        // Lưu pool vào session
        req.session.username = username;

        res.redirect(`${systemConfig.prefixUrl}/dashboard`)
        
    } catch (error) {
        console.log(error);
        res.render('client/pages/auth/login', {
            message: 'Sai tên tài khoản hoặc mật khẩu'
        });
    }
}       
