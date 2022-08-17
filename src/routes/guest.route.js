'use strict';
const router = require('express').Router();
const guestController = require('../controllers/guest/guest.controller');

// order
router
    .route('/order/create_wo_payment')
    .post(guestController.create_order_wo_payment)
router
    .route('/order/create')
    .post(guestController.create_order)
router
    .route('/order/details')
    .get(guestController.order_details)
router
    .route('/order/validate_offercoupon')
    .post(guestController.validate_offercoupon)

module.exports = router;