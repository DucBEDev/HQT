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
router.post('/book/delete', controller.deleteBook);
router.post('/book/write', controller.write);
router.post('/book/update', controller.update);

router.post('/create', upload.array('hinhAnhPath'), uploadCloud.upload, controller.createDauSach);
router.post('/delete/:isbn', controller.deleteTitle);
router.get('/next-id', controller.getNextISBN);
router.get('/report', controller.getReport);
router.post('/download-report', controller.downloadReport);

module.exports = router;