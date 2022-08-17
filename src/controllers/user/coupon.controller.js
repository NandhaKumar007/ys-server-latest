"use strict";
const mongoose = require('mongoose');
const customer = require("../../models/customer.model");
const coupon = require("../../models/coupon_codes.model");
const offers = require("../../models/offer_codes.model");
const createPayment = require("../../../services/create_payment.service");
const commonService = require("../../../services/common.service");
const validationService = require("../../../services/validation.service");

// generate coupon(gift card)
exports.generate = (req, res) => {
    customer.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.id), status: "active" }
        },
        { $lookup:
            {
               from: 'stores',
               localField: 'store_id',
               foreignField: '_id',
               as: 'storeDetails'
            }
        }
    ], function(err, response) {
        if(!err && response[0])
        {
            req.body.customer_id = req.id;
            let customerDetails = response[0];
            req.body.store_id = customerDetails.store_id;
            let gcConfig = customerDetails.storeDetails[0].additional_features;
        	let randomCode = commonService.giftCouponCode(12);
            req.body.code = randomCode.match(/.{1,4}/g).join("-");
            coupon.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), code: req.body.code }, function(err, response) {
                if(!err && !response) {
                    // create
                    req.body.expiry_on = new Date().setMonth(new Date().getMonth() + parseFloat(gcConfig.gc_validity_in_month));
                    req.body.order_number = commonService.orderNumber();
                    if(customerDetails.unique_id) {
                        req.body.order_number = req.body.order_number+'-'+customerDetails.unique_id;
                    }
                    req.body.balance = req.body.price;
                    req.body.coupon_type = gcConfig.giftcard_type;
                    coupon.create(req.body, function(err, response) {
                        if(!err && response) {
                            let orderDetails = response;
                            orderDetails.customer_email = customerDetails.email;
                            // unset checkout details
                            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) }, { $unset: { checkout_details: "" } }, function(err, response) { });
                            // create payment
                            if(orderDetails.payment_details.name=="Razorpay")
                            {
                                createPayment.createRazorpayForGC(orderDetails, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, data: response });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: response });
                                    }
                                });
                            }
                            else if(orderDetails.payment_details.name=="PayPal")
                            {
                                createPayment.createPaypalForGC(orderDetails, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, data: response });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: response });
                                    }
                                });
                            }
                            else if(orderDetails.payment_details.name=="CCAvenue")
                            {
                                let sendData = {
                                    order_type: "giftcard",
                                    payment_method: 'CCAvenue',
                                    order_details: orderDetails,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: orderDetails.currency_type.country_code,
                                    amount: Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price))
                                };
                                res.json({ status: true, data: sendData });
                            }
                            else if(orderDetails.payment_details.name=="Square")
                            {
                                let sendData = {
                                    order_type: "giftcard",
                                    payment_method: 'Square',
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: orderDetails.currency_type.country_code,
                                    amount: Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price))
                                };
                                res.json({ status: true, data: sendData });
                            }
                            else if(orderDetails.payment_details.name=="Fatoorah")
                            {
                                orderDetails.fatoorah_pay_id = req.body.fatoorah_pay_id;
                                createPayment.createFatoorahForGC(orderDetails, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, data: response });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: response });
                                    }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Telr")
                            {
                                createPayment.createTelrForGC(orderDetails, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, data: response });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: response });
                                    }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Foloosi")
                            {
                                createPayment.createFoloosiForGC(orderDetails, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, data: response });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: response });
                                    }
                                });
                            }
                            else {
                                res.json({ status: false, message: "Invalid payment method" });
                            }
                        }
                        else {
                            res.json({ status: false, error: err, message: "Unable to create coupon" });
                        }
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "Try again after sometime" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
}

// generated coupon(gift card) list & details
exports.coupons = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            if(req.query.coupon_id)
            {
                // coupon details
                coupon.findOne({
                    customer_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.coupon_id)
                }, { code: 0 }, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, customer_details: customerDetails, data: response });
                    } else {
                        res.json({ status: false, message: "Invalid user" });
                    }
                });
            }
            else {
                // list all coupons
                coupon.aggregate([
                    { $match:
                        { customer_id: mongoose.Types.ObjectId(req.id), status: "active" }
                    },
                    { $lookup:
                        {
                        from: 'customers',
                        localField: 'redeemed_by',
                        foreignField: '_id',
                        as: 'customerDetails'
                        }
                    },
                    { $project : { "code": 0 } },
                    { $sort : { created_on : -1 } }
                ], function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response });
                    } else {
                        res.json({ status: false, message: "Invalid user" });
                    }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
}

// validate offer code
exports.validate_offercoupon = (req, res) => {
    if(req.login_type && req.body.customer_id) { req.id = req.body.customer_id; }
    let queryData = { store_id: mongoose.Types.ObjectId(req.body.store_id), status: "active", enable_status: true, valid_from: { $lte: new Date() } };
    if(req.body.code) { queryData.code = req.body.code; }
    else { queryData.code_type = "auto_discount"; }
    offers.findOne(queryData, function(err, response) {
        if(!err && response) {
            let codeDetails = response;
            if(codeDetails.valid_to)
            {
                if(new Date(codeDetails.valid_to) >= new Date())
                {
                    if(codeDetails.restrict_usage) {
                        validationService.validateUsageRestriction(req.id, codeDetails).then((offerDetails) => {
                            res.json(offerDetails);
                        });
                    }
                    else {
                        if(codeDetails.onetime_usage) {
                            validationService.validateCustomerOffer(req.id, codeDetails).then((offerDetails) => {
                                res.json(offerDetails);
                            });
                        }
                        else {
                            res.json({ status: true, data: codeDetails });
                        }
                    }
                }
                else {
                    res.json({ status: false, message: "Offer expired" });
                }
            }
            else
            {
                if(codeDetails.restrict_usage) {
                    validationService.validateUsageRestriction(req.id, codeDetails).then((offerDetails) => {
                        res.json(offerDetails);
                    });
                }
                else {
                    if(codeDetails.onetime_usage) {
                        validationService.validateCustomerOffer(req.id, codeDetails).then((offerDetails) => {
                            res.json(offerDetails);
                        });
                    }
                    else {
                        res.json({ status: true, data: codeDetails });
                    }
                }
            }
        }
        else {
            res.json({ status: false, message: "Invalid code" });
        }
    });
}