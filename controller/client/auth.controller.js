const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, createUserConnection, defaultPool} = require('../../configs/database');

const systemConfig = require('../../configs/system');

// [GET] /auth/register
module.exports.showRegister = async (req, res) => {
    res.render('client/pages/auth/register');
}

// [POST] /auth/register
module.exports.register = async (req, res) => {
    const { 
        phone, 
        password, 
        firstName, 
        lastName, 
        email, 
        citizenId, 
        gender, 
        dob, 
        address 
    } = req.body;
    const ngaySinh = new Date(dob);
    
    const params = [
        { name: 'LGNAME', type: sql.NVarChar, value: email },
        { name: 'PASS', type: sql.NVarChar, value: password },
        { name: 'ROLE', type: sql.NVarChar, value: 'DocGia' },
        { name: 'USER_TYPE', type: sql.NVarChar, value: 'DOCGIA' },
        { name: 'DIACHI', type: sql.NVarChar, value: address },
        { name: 'DIENTHOAI', type: sql.NVarChar, value: phone },
        { name: 'HODG', type: sql.NVarChar, value: firstName },
        { name: 'TENDG', type: sql.NVarChar, value: lastName },
        { name: 'EMAILDG', type: sql.NVarChar, value: email },
        { name: 'SOCMND', type: sql.NVarChar, value: citizenId },
        { name: 'GIOITINH', type: sql.Bit, value: gender === '1' },
        { name: 'NGAYSINH', type: sql.DateTime, value: ngaySinh },
        { name: 'HOTENNV', type: sql.NVarChar, value: null }
    ];

    try {
        const result = await executeStoredProcedure('sp_TaoTaiKhoan', params);
    
        res.redirect(`${systemConfig.prefixUrl}/auth/login`);
    } catch (error) {
        console.log(error);
        // Handle error appropriately
        res.render('client/pages/auth/register', { 
            message: 'Số điện thoại đã tồn tại'
        });
    }
}

// [GET] /auth/login
module.exports.showLogIn = async (req, res) => {
    res.render('client/pages/auth/login');
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

        res.redirect(`${systemConfig.prefixUrl}/dashboard`)
        
    } catch (error) {
        console.log(error);
        res.render('client/pages/auth/login', {
            message: 'Sai tên tài khoản hoặc mật khẩu'
        });
    }
}       
