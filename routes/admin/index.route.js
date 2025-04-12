const systemConfig = require('../../configs/system');

// const userMiddleware = require("../../middlewares/admin/user.middleware");

const staffRoute = require('./staff.route');
const readerRoute = require('./reader.route');
const typeRoute = require('./type.route');
const authorRoute = require('./author.route');
const isbn_bookRoute = require('./isbn_book.route');
const phieumuonRoute = require('./phieumuon.route');


module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.use(PATH_ADMIN + '/staff', staffRoute);
    app.use(PATH_ADMIN + '/reader', readerRoute);
    app.use(PATH_ADMIN + '/type', typeRoute);
    app.use(PATH_ADMIN + '/author', authorRoute);
    app.use(PATH_ADMIN + '/phieumuon', phieumuonRoute);

}