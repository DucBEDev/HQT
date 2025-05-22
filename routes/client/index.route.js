const systemConfig = require('../../configs/system');

const authMiddleware = require("../../middlewares/client/auth.middleware");

const authRoute = require('./auth.route');
const dashboardRoute = require('./dashboard.route');

module.exports = (app) => {
    const PATH_URL = systemConfig.prefixUrl;

    app.use(PATH_URL + '/auth', authRoute);
    app.use(PATH_URL + '/dashboard', authMiddleware.auth, dashboardRoute);
}