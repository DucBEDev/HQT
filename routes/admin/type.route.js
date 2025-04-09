const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/type.controller');

router.get('/', controller.index);
router.delete('/delete/:maTL', controller.delete);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);

module.exports = router;