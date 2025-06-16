const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, getUserPool, defaultPool} = require('../../configs/database');

const DauSachRepository = require('../../repositories/DauSachRepository');

const systemConfig = require('../../configs/system');

// [GET] /Library/dashboard
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const books = await DauSachRepository.getAllWithStatus(pool);
    res.render('client/pages/dashboard/index', { 
        books 
    });
}  

// [GET] /Library/dashboard/detail/:isbn
module.exports.detail = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { isbn } = req.params;
    const book = await DauSachRepository.getBookDetailByISBN(pool, isbn);

    res.render('client/pages/dashboard/detail', { book });
}
