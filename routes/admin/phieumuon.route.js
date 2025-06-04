const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/phieumuon.controller');


router.get('/', controller.index);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.get('/detail/:maPhieu', controller.detail);
router.patch('/edit/:maPhieu', controller.edit);
router.patch('/lostBook/:maPhieu', controller.lostBook);
router.post('/returnBook/:maPhieu', controller.returnBook);

module.exports = router;