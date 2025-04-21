const systemConfig = require('../../configs/system');

// const userMiddleware = require("../../middlewares/admin/user.middleware");

const authRoute = require('./auth.route');
const dashboardRoute = require('./dashboard.route');

module.exports = (app) => {
    const PATH_URL = systemConfig.prefixUrl;

    app.use(PATH_URL + '/auth', authRoute);
    app.use(PATH_URL + '/dashboard', dashboardRoute);
}