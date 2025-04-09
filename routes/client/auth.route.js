const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/auth.controller');

router.get('/login', controller.showLogIn);
router.post('/login', controller.logIn);
router.get('/register', controller.showRegister);
router.post('/register', controller.register);

module.exports = router;