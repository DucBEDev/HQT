const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/staff.controller');

router.get('/edit/:maNV', controller.edit);
router.get('/', controller.index);
router.delete('/delete/:maNV', controller.delete);
router.get('/create', controller.create);
router.post('/create', controller.createPost);
router.get('/next-id', controller.getNextId);
router.post('/edit/:maNV', controller.editPost);
router.post('/undo', controller.undo); // Route mới cho undo
router.get('/profile', controller.profile);



module.exports = router;