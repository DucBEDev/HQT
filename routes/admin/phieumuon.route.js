const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/phieumuon.controller');


router.get('/', controller.index);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);

module.exports = router;