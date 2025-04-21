const systemConfig = require('../../configs/system');

module.exports.auth = async (req, res, next) => {
    if (req.cookies.user) {
        next();
    }
    else {
        res.redirect(`${systemConfig.prefixUrl}/auth/login`)
    }
    
}