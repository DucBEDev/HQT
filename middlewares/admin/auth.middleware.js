const systemConfig = require('../../configs/system');
const { getUserPool } = require('../../configs/database');


module.exports.auth = async (req, res, next) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        console.log('Connecting to database...');
        console.log(pool)
        await pool.connect();
        await pool.request().query('SELECT 1 AS Test');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    next();
}