const express = require('express');
const router = express.Router();

const authMiddleware = require('../../middlewares/client/auth.middlewares');

const controller = require('../../controller/client/dashboard.controller');

router.get('/', authMiddleware.auth, controller.index);
router.get('/detail/:isbn', authMiddleware.auth, controller.detail);

module.exports = router;