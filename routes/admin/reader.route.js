const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/reader.controller');

router.get('/', controller.index);
router.delete('/delete/:maDG', controller.delete);
router.patch('/change-status/:newStatus/:maDG', controller.changeStatus);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.get('/edit/:maDG', controller.edit);
router.patch('/edit/:maDG', controller.editPatch);

module.exports = router;