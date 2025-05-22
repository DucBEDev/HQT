const systemConfig = require('../../configs/system');
const { getUserPool } = require('../../configs/database');

module.exports.auth = async (req, res, next) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixUrl}/auth/login`);
    }
    next();
}