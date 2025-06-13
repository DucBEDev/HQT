const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/backup_restore.controller');

router.post('/backup', controller.backup);
router.post('/restore', controller.restore);
router.post('/restore-point-in-time', controller.restoreToPointInTime);
router.get('/', controller.index);



module.exports = router;