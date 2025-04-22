const systemConfig = require('../../configs/system');

const authMiddleware = require("../../middlewares/admin/auth.middleware");

const staffRoute = require('./staff.route');
const readerRoute = require('./reader.route');  
const typeRoute = require('./type.route');
const authorRoute = require('./author.route');
const isbn_bookRoute = require('./isbn_book.route');
const phieumuonRoute = require('./phieumuon.route');
const authRoute = require('./auth.route');

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.use(PATH_ADMIN + '/staff', authMiddleware.auth, staffRoute);
    app.use(PATH_ADMIN + '/reader', authMiddleware.auth, readerRoute);
    app.use(PATH_ADMIN + '/type', authMiddleware.auth, typeRoute);
    app.use(PATH_ADMIN + '/author', authMiddleware.auth, authorRoute);
    app.use(PATH_ADMIN + '/isbn_book', authMiddleware.auth, isbn_bookRoute);
    app.use(PATH_ADMIN + '/phieumuon', authMiddleware.auth, phieumuonRoute);
    app.use(PATH_ADMIN + '/auth', authRoute);
}