const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/auth.controller');

router.get('/login', controller.showLogIn);
router.post('/login', controller.logIn);

module.exports = router;