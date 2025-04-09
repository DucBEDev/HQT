const systemConfig = require('../../configs/system');

// const userMiddleware = require("../../middlewares/admin/user.middleware");

const staffRoute = require('./staff.route');
const readerRoute = require('./reader.route');
const typeRoute = require('./type.route');

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.use(PATH_ADMIN + '/staff', staffRoute);
    app.use(PATH_ADMIN + '/reader', readerRoute);
    app.use(PATH_ADMIN + '/type', typeRoute);
}