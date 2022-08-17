'use strict';
const router = require('express').Router();
const guestUserController = require('../controllers/guest/guest_user.controller');

router
    .route('/details')
    .put(guestUserController.update)
router
    .route('/validate_offercoupon')
    .post(guestUserController.validate_offercoupon)

// order
router
    .route('/order/pickup_details')
    .post(guestUserController.pickup_details)
router
    .route('/order/delivery_details')
    .post(guestUserController.delivery_details)
router
    .route('/order/shipping_details')
    .post(guestUserController.shipping_details)
router
    .route('/order/checkout_details')
    .get(guestUserController.checkout_details)
    router
    .route('/order/calc_discount')
    .post(guestUserController.calc_discount)
router
    .route('/order/create_v2')
    .post(guestUserController.create_order_v2)

router
    .route('/order/create_wo_payment')
    .post(guestUserController.create_order_wo_payment)
router
    .route('/order/create')
    .post(guestUserController.create_order)

router
    .route('/order/details')
    .get(guestUserController.order_details)

// cod otp
router
    .route('/order/cod_otp')
    .post(guestUserController.send_cod_otp)
    .get(guestUserController.validate_cod_otp)

module.exports = router;