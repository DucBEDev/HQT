const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/isbn_book.controller');

// Connect Multer library to upload images
const multer = require('multer');
// const storageMulter = require("../../helpers/storageMulter");
const upload = multer({ storage: multer.memoryStorage() });
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware")

router.get('/', controller.index);
router.get('/getData', controller.getData);

router.get('/book', controller.getBooks);
router.delete('/book/delete/:maSach', controller.deleteBook);
router.post('/book/write', controller.write);

router.post('/write', upload.array('hinhAnhPath'), uploadCloud.upload, controller.createDauSach);
router.post('/sach/write', controller.createSach);
router.delete('/delete/:isbn', controller.deleteTitle);
router.get('/next-id', controller.getNextISBN);
router.get('/report', controller.getReport);
router.post('/download-report', controller.downloadReport);

module.exports = router;