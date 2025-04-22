const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/type.controller');

router.get('/', controller.index);
router.delete('/delete/:maTL', controller.delete);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.get('/edit/:maTL', controller.edit);
router.post('/edit/:maTL', controller.editPost);
router.post('/undo', controller.undo); // Route mới cho undo
router.post('/clear-undo', controller.clearUndo); // Thêm route mới


module.exports = router;