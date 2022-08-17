'use strict';
const router = require('express').Router();
const addressListController = require('../controllers/user/addresslist.controller');
const modelController = require('../controllers/user/model.controller');
const customerController = require('../controllers/user/customer.controller');
const orderController = require('../controllers/user/order.controller');
const couponController = require('../controllers/user/coupon.controller');
const donationController = require('../controllers/user/donation.controller');
const dinamicRewardsController = require('../controllers/user/dinamic_rewards.controller');
const quotationController = require('../controllers/user/quotation.controller');
const appointmentController = require('../controllers/user/appointment.controller');

router
    .route('/customer')
    .get(customerController.details)
    .put(customerController.update)

router
    .route('/update_mobile')
    .post(customerController.update_mobile)
router
    .route('/update_wish_list')
    .get(customerController.update_wish_list)

router
    .route('/address')
    .post(addressListController.add)
    .put(addressListController.update)
    .patch(addressListController.remove)

router
    .route('/model')
    .post(modelController.add)
    .put(modelController.update)
    .patch(modelController.remove)

router
    .route('/change_pwd')
    .put(customerController.change_pwd)
router
    .route('/feedback')
    .post(customerController.feedback)

router
    .route('/generate_otp')
    .post(customerController.generate_otp)
router
    .route('/validate_otp')
    .post(customerController.validate_otp)

// order
router
    .route('/order/pickup_details')
    .post(orderController.pickup_details)
router
    .route('/order/delivery_details')
    .post(orderController.delivery_details)
router
    .route('/order/shipping_details')
    .post(orderController.shipping_details)
router
    .route('/order/checkout_details')
    .get(orderController.checkout_details)
router
    .route('/order/calc_discount')
    .post(orderController.calc_discount)
router
    .route('/order/create_wo_payment')
    .post(orderController.create_order_wo_payment)
router
    .route('/order/create')
    .post(orderController.create_order)
router
    .route('/order/create_v2')
    .post(orderController.create_order_v2)
router
    .route('/order/list')
    .get(orderController.order_list)
router
    .route('/order/details')
    .get(orderController.order_details)
    .patch(orderController.cancel_order)

// cod otp
router
    .route('/order/cod_otp')
    .post(orderController.send_cod_otp)
    .get(orderController.validate_cod_otp)

// coupon
router
    .route('/buy_coupon')
    .post(couponController.generate)
router
    .route('/coupon')
    .get(couponController.coupons)
router
    .route('/validate_offercoupon')
    .post(couponController.validate_offercoupon)

// appointment
router
    .route('/appointment')
    .get(appointmentController.list)
    .post(appointmentController.create)

// donation
router
    .route('/donation')
    .post(donationController.create)
    .get(donationController.details)

// dinamic offer
router
    .route('/dinamic_rewards')
    .get(dinamicRewardsController.list)
    .post(dinamicRewardsController.create)

// quotation
router
    .route('/quotation')
    .post(quotationController.create)
    .get(quotationController.details)

module.exports = router;