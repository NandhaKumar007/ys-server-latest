'use strict';
const router = require('express').Router();
const adminController = require('../controllers/auth/admin.controller');
const storeController = require('../controllers/auth/store.controller');
const userController = require('../controllers/auth/user.controller');

// admin
router
    .route('/admin/login')
    .post(adminController.login)

// store
router
    .route('/store/login')
    .post(storeController.login)
router
    .route('/store/login_v2')
    .post(storeController.login_v2)
router
    .route('/store/forgot_request')
    .post(storeController.forgot_request)
router
    .route('/store/validate_forgot_request')
    .post(storeController.validate_forgot_request)
router
    .route('/store/update_pwd')
    .post(storeController.update_pwd)

// vendor
router
    .route('/store/vendor_login')
    .post(storeController.vendor_login)
router
    .route('/store/vendor_forgot_request')
    .post(storeController.vendor_forgot_request)
router
    .route('/store/validate_vendor_forgot_request')
    .post(storeController.validate_vendor_forgot_request)
router
    .route('/store/update_vendor_pwd')
    .post(storeController.update_vendor_pwd)

// user
router
    .route('/user/register')
    .post(userController.register)
router
    .route('/user/register_with_otp')
    .post(userController.register_with_otp)
router
    .route('/user/validate_otp')
    .post(userController.validate_otp)
router
    .route('/user/login')
    .post(userController.login)
router
    .route('/user/social_login')
    .post(userController.social_login)
router
    .route('/user/guest_login')
    .post(userController.guest_login)
router
    .route('/user/forgot_request')
    .post(userController.forgot_request)
router
    .route('/user/validate_forgot_request')
    .post(userController.validate_forgot_request)
router
    .route('/user/update_pwd')
    .post(userController.update_pwd)

module.exports = router;