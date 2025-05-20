const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/auth.controller');

router.get('/login', controller.showLogIn);
router.get('/change-password-enter-login', controller.showChangePasswordEnterLogin);
router.post('/change-password-enter-login', controller.changePasswordEnterLogin);
router.get('/change-password', controller.showChangePassword);
router.post('/change-password', controller.changePassword);
router.post('/login', controller.logIn);

module.exports = router;