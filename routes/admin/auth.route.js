const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/auth.controller');

router.get('/login', controller.showLogIn);
router.post('/login', controller.logIn);
router.get('/logout', controller.logout);

router.get('/changePass', controller.changePassword);
router.post('/changePass', controller.changePasswordPost);

router.get('/deleteLogin', controller.deleteLoginView);
router.delete('/deleteLogin', controller.deleteLogin);

module.exports = router;