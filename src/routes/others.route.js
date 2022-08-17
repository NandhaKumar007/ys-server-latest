'use strict';
const router = require('express').Router();
const commonController = require('../controllers/others/common.controller');
const storeController = require('../controllers/others/store.controller');
const paymentController = require('../controllers/others/payment.controller');
const deployController = require('../controllers/others/deploy.controller');

router
    .route('/check_email')
    .post(commonController.check_email_availability)
router
    .route('/subscribe_newsletter')
    .post(commonController.subscribe_newsletter)
router
    .route('/enquiry')
    .post(commonController.enquiry)
router
    .route('/campaign_enquiry')
    .post(commonController.campaign_enquiry)
router
    .route('/theme_enquiry')
    .post(commonController.theme_enquiry)
router
    .route('/packages')
    .get(commonController.packages)
router
    .route('/payment_types')
    .get(commonController.payment_types)
router
    .route('/ys_currency_list')
    .get(commonController.ys_currency_list)

router
    .route('/create_store')
    .post(storeController.create_store)
router
    .route('/store_activation')
    .get(storeController.store_activation)

router
    .route('/order_details/:type/:store_id/:order_id')
    .get(storeController.order_details)

router
    .route('/vendor')
    .post(storeController.vendor_signup)

// deployment
router
    .route('/deploy')
    .get(deployController.details)
    .put(deployController.update)
router
    .route('/plan')
    .post(deployController.purchase_plan)
    .put(deployController.change_plan)
router
    .route('/billing_details')
    .post(deployController.billing_details)

// Payment
router
    .route('/razorpay_store_payment/:id')
    .post(paymentController.razorpay_store_payment_status)
router
    .route('/razorpay_webhook/:id')
    .post(paymentController.razorpay_webhook)

// ERP
router
    .route('/product/stock/:store_id')
    .put(commonController.product_stock_update)

// Dunzo
router
    .route('/dunzo_webhook')
    .post(commonController.dunzo_webhook)

// test endpoint
router
    .route('/delhivery_endpoint')
    .get(commonController.test_endpoint)
    .post(commonController.test_endpoint)

module.exports = router;