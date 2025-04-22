const systemConfig = require('../../configs/system');

module.exports.auth = async (req, res, next) => {
    if (req.cookies.userAdmin) {
        next();
    }
    else {
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
    }
    
}