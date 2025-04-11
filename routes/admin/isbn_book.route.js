const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/isbn_book.controller');

router.get('/', controller.index);
router.get('/sach', controller.getSachByISBN);
router.post('/dausach/write', controller.createDauSach);
router.post('/sach/write', controller.createSach);
router.delete('/delete/:isbn', controller.deleteDauSach);
router.delete('/sach/delete/:maSach', controller.deleteSach);
router.get('/next-id', controller.getNextISBN);

module.exports = router;