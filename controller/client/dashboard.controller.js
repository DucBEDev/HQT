const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const DauSachRepository = require('../../repositories/DauSachRepository');

const systemConfig = require('../../configs/system');

// [GET] /Library/dashboard
module.exports.index = async (req, res) => {
    const books = await DauSachRepository.getAllWithStatus();

    res.render('client/pages/dashboard/index', { 
        books 
    });
}  

// [GET] /Library/dashboard/detail/:isbn
module.exports.detail = async (req, res) => {
    const { isbn } = req.params;
    const book = await DauSachRepository.getBookDetailByISBN(isbn);
    res.render('client/pages/dashboard/detail', { book });
}
