const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/dashboard.controller');

router.get('/', controller.index);
router.get('/detail/:isbn', controller.detail);

module.exports = router;