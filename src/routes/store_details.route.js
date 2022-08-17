'use strict';
const router = require('express').Router();
const commonController = require('../controllers/store_details/common.controller');
const productController = require('../controllers/store_details/product.controller');
const validateController = require('../controllers/store_details/validate.controller');
const paymentController = require('../controllers/store_details/payment.controller');
const quotationController = require('../controllers/store_details/quotation.controller');

router
    .route('/store')
    .get(commonController.store)
router
    .route('/details_v1')
    .get(commonController.details_v1)
router
    .route('/details_v2')
    .get(commonController.details_v2)
router
    .route('/details_v3')
    .get(commonController.details_v3)
router
    .route('/domain_details')
    .get(commonController.domain_details)
router
    .route('/layouts')
    .get(commonController.layouts)
/* remove in future */
router
    .route('/details')
    .get(commonController.details)
router
    .route('/home')
    .get(commonController.home)
router
    .route('/home_v1')
    .get(commonController.layouts)
/* ### remove in future ### */
router
    .route('/ai_styles')
    .get(commonController.ai_styles)
router
    .route('/sizing_assistant')
    .post(commonController.sizing_assistant)
router
    .route('/product_features')
    .get(commonController.product_features)
router
    .route('/product_features/:store_id')
    .get(commonController.product_features_v2)
router
    .route('/vendor_features/:store_id/:vendor_id')
    .get(commonController.vendor_features)
router
    .route('/shipping_methods')
    .get(commonController.shipping_methods)
router
    .route('/delivery_methods')
    .get(commonController.delivery_methods)
router
    .route('/quick_order_details')
    .post(commonController.quick_order_details)
router
    .route('/gift_cards')
    .get(commonController.gift_cards)
router
    .route('/country_list')
    .get(commonController.country_list)
router
    .route('/blogs')
    .get(commonController.blogs)
router
    .route('/blog_details')
    .get(commonController.blog_details)
router
    .route('/discounts')
    .get(commonController.discounts)
router
    .route('/collections')
    .get(commonController.collections)
router
    .route('/subscribe_newsletter')
    .post(commonController.subscribe_newsletter)
router
    .route('/enquiry_mail')
    .post(commonController.enquiry_mail)
router
    .route('/vendor_enquiry_mail')
    .post(commonController.vendor_enquiry_mail)
router
    .route('/sitemap')
    .get(commonController.sitemap)
router
    .route('/donation_amount')
    .get(commonController.donation_amt)
router
    .route('/policy')
    .get(commonController.policy_details)
router
    .route('/contact_page')
    .get(commonController.contact_page)
router
    .route('/locations')
    .get(commonController.locations)
router
    .route('/extra_page')
    .get(commonController.extra_page)
router
    .route('/dinamic_offers')
    .get(commonController.dinamic_offers)
router
    .route('/appointment_services')
    .get(commonController.appointment_services)
router
    .route('/appointments')
    .post(commonController.appointments)
router
    .route('/tracking/:store_id/:cp/:tn')
    .get(commonController.tracking)

// products
router
    .route('/category/details')
    .post(productController.category_details)
router
    .route('/category/details/:version')
    .post(productController.category_details_v2)
router
    .route('/product/list')
    .post(productController.list)
router
    .route('/product/list/:version')
    .post(productController.list_v2)
router
    .route('/product/filter')
    .post(productController.filter_products)
router
    .route('/product/random_list')
    .post(productController.random_list)
router
    .route('/product/ai_styles_filter')
    .post(productController.ai_styles_filter)
router
    .route('/product/ai_styles_filter_v2')
    .post(productController.ai_styles_filter_v2)
router
    .route('/product/details')
    .post(productController.details)
router
    .route('/product/search')
    .post(productController.search)
router
    .route('/product/addon_details')
    .get(productController.addon_details)
router
    .route('/product/measurements')
    .get(productController.measurement)
router
    .route('/order_details')
    .get(productController.order_details)
router
    .route('/quotation_details')
    .get(productController.quotation_details)
router
    .route('/reviews')
    .get(productController.reviews)
    .post(productController.add_review)

// validation
router
    .route('/update_cart_list')
    .post(validateController.update_cart_list)
router
    .route('/check_stock_availabilty')
    .post(validateController.check_stock_availabilty)
router
    .route('/validate_coupons')
    .post(validateController.validate_coupons)
router
    .route('/validate_offer_code')
    .post(validateController.validate_offer_code)
router
    .route('/check_dunzo_availabilty')
    .post(validateController.check_dunzo_availabilty)

// CCAvenue payment
router
    .route('/ccavenue_encryption')
    .get(paymentController.ccavenue_encryption)
router
    .route('/ccavenue_payment/:status/:store_id')
    .post(paymentController.ccavenue_payment_status)

// Razorpay
router
    .route('/razorpay_payment/:store_id')
    .post(paymentController.razorpay_payment_status)

router
    .route('/razorpay_payment/:store_id/:vendor_id')
    .post(paymentController.razorpay_payment_status)

router
    .route('/razorpay_webhook/:store_id')
    .post(paymentController.razorpay_webhook)
router
    .route('/product_razorpay_payment/:order_id/:payment_id')
    .get(paymentController.product_razorpay_status)
router
    .route('/giftcard_razorpay_payment/:order_id/:payment_id')
    .get(paymentController.giftcard_razorpay_status)
router
    .route('/donation_razorpay_payment/:order_id/:payment_id')
    .get(paymentController.donation_razorpay_status)

// PayPal payment
router
    .route('/product_paypal_payment/:status/:order_id')
    .get(paymentController.product_paypal_status)
router
    .route('/giftcard_paypal_payment/:status/:order_id')
    .get(paymentController.giftcard_paypal_status)
router
    .route('/donation_paypal_payment/:status/:order_id')
    .get(paymentController.donation_paypal_status)

// Square payment
router
    .route('/square_payment/:store_id')
    .post(paymentController.square_payment_status)

// Fatoorah payment
router
    .route('/fatoorah_initiate_pay/:store_id')
    .post(paymentController.fatoorah_initiate_pay)
router
    .route('/fatoorah_payment/:store_id')
    .get(paymentController.fatoorah_payment_status)

// Telr
router
    .route('/telr_payment/:order_type/:order_id')
    .get(paymentController.telr_payment_status)

// Foloosi
router
    .route('/foloosi_payment/:store_id')
    .get(paymentController.foloosi_payment_status)

// Flutter Wave
router
    .route('/fw_payment/:store_id')
    .get(paymentController.fw_payment_status)

// Billbox
router
    .route('/billbox_payment/:store_id')
    .get(paymentController.billbox_payment_status)

// Gpay or Bank Transfer
router
    .route('/update_order_payment')
    .post(paymentController.update_order_payment)

// quotation
router
    .route('/quote_request/:type/:store_id/:quote_id')
    .get(quotationController.quote_request)

module.exports = router;