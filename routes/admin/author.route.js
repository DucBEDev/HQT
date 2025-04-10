const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/author.controller');

router.get('/edit/:maTacGia', controller.edit);
router.get('/', controller.index);
router.delete('/delete/:maTacGia', controller.delete);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.post('/edit/:maTacGia', controller.editPost);


module.exports = router;