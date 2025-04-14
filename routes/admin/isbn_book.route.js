const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/isbn_book.controller');

router.get('/', controller.index);
router.get('/book', controller.getBooks);
router.get('/book/next-id', controller.getNextId);
router.delete('/book/delete/:maSach', controller.deleteBook);
router.post('/book/write', controller.write);
router.post('/dausach/write', controller.createDauSach);
router.post('/sach/write', controller.createSach);
router.delete('/delete/:isbn', controller.deleteTitle);
router.get('/next-id', controller.getNextISBN);

module.exports = router;