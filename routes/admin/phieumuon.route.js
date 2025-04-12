const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/phieumuon.controller');


router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.get('/', controller.index);

module.exports = router;