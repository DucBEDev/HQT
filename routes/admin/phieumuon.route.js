const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/phieumuon.controller');


router.get('/', controller.index);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.get('/detail/:maPhieu', controller.detail);
router.patch('/edit/:maPhieu', controller.edit);
router.patch('/lostBook/:maPhieu/:maSach', controller.lostBook);
router.patch('/returnBook/:maPhieu/:maSach', controller.returnBook);

module.exports = router;