"use strict";
const mongoose = require('mongoose');
const orderList = require("../../models/order_list.model");
const offer = require("../../models/offer_codes.model");
const store = require("../../models/store.model");
const mailService = require("../../../services/mail.service");
const createPayment = require("../../../services/create_payment.service");
const commonService = require("../../../services/common.service");
const stockService = require("../../../services/stock.service");

// validate offer code
exports.validate_offercoupon = (req, res) => {
    let queryData = { store_id: mongoose.Types.ObjectId(req.body.store_id), status: "active", enable_status: true, valid_from: { $lte: new Date() } };
    if(req.body.code) { queryData.code = req.body.code; }
    else { queryData.code_type = "auto_discount"; }
    offer.findOne(queryData, function(err, response) {
        if(!err && response) {
            let codeDetails = response;
            if(codeDetails.valid_to)
            {
                if(new Date(codeDetails.valid_to) >= new Date())
                {
                    if(codeDetails.restrict_usage) {
                        if(codeDetails.usage_limit > codeDetails.redeemed_count)
                        {
                            if(codeDetails.onetime_usage) { res.json({ status: false, message: "Please login to avail this offer." }); }
                            else { res.json({ status: true, data: codeDetails }); }
                        }
                        else {
                            res.json({ status: false, message: "Offer expired" });
                        }
                    }
                    else {
                        if(codeDetails.onetime_usage) {
                            res.json({ status: false, message: "Please login to avail this offer." });
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
                    if(codeDetails.usage_limit > codeDetails.redeemed_count)
                    {
                        if(codeDetails.onetime_usage) { res.json({ status: false, message: "Please login to avail this offer." }); }
                        else { res.json({ status: true, data: codeDetails }); }
                    }
                    else {
                        res.json({ status: false, message: "Offer expired" });
                    }
                }
                else {
                    if(codeDetails.onetime_usage) {
                        res.json({ status: false, message: "Please login to avail this offer." });
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

// create order without payment
exports.create_order_wo_payment = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), version: 1 }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            req.body.status = "active";
            req.body.order_by = "guest";
            req.body.customer_id = req.body.store_id;
            req.body.customer_name = req.body.shipping_address.name;
            req.body.order_number = commonService.orderNumber();
            req.body.coupon_list = req.body.coupon_list.filter(object => object.price>0);
            req.body.invoice_number = "";
            if(storeDetails.invoice_status) {
                req.body.invoice_number = commonService.invoiceNumber(storeDetails.invoice_config);
            }
            orderList.create(req.body, function(err, response) {
                if(!err && response)
                {
                    let orderDetails = response;
                    // update next invoice no
                    if(req.body.invoice_number) {
                        store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                    }
                    // decrease product stock
                    stockService.decProductStock(orderDetails.item_list);
                    // decrease coupon balance
                    if(orderDetails.coupon_list.length) { stockService.updateCouponBalance(orderDetails); }
                    // update offer redeem count
                    if(orderDetails.offer_details) { stockService.incOfferRedeemCount(orderDetails.offer_details); }
                    // order placed mail
                    mailService.sendOrderPlacedMail(null, orderDetails._id);
                    // order placed mail to vendor
                    if(orderDetails.vendor_list.length) {
                        mailService.sendOrderPlacedMailToVendor(orderDetails._id);
                    }
                    // response
                    let sendData = { order_type: "product", order_id: orderDetails._id };
                    res.json({ status: true, data: sendData });
                }
                else { res.json({ status: false, error: err, message: "Unable to place order" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

exports.create_order = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), version: 1 }, function(err, response) {
        if(!err && response)
        {
            // hold product
            stockService.holdProductAndCoupon(req.body.unique_product_list, req.body.coupon_list).then(() => {
                // if hold selected products
                req.body.order_by = "guest";
                req.body.customer_id = req.body.store_id;
                req.body.customer_name = req.body.shipping_address.name;
                req.body.order_number = commonService.orderNumber();
                orderList.create(req.body, function(err, response) {
                    if(!err && response)
                    {
                        let orderDetails = response;
                        orderDetails.customer_email = orderDetails.guest_email;
                        // create payment
                        if(orderDetails.payment_details.name=="Razorpay")
                        {
                            createPayment.createRazorpay(orderDetails, function(err, response) {
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
                            createPayment.createPaypal(orderDetails, function(err, response) {
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
                                order_type: "product",
                                payment_method: 'CCAvenue',
                                order_details: orderDetails,
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: orderDetails.currency_type.country_code,
                                amount: Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))
                            };
                            res.json({ status: true, data: sendData });
                        }
                        else if(orderDetails.payment_details.name=="Square")
                        {
                            let sendData = {
                                order_type: "product",
                                payment_method: 'Square',
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: orderDetails.currency_type.country_code,
                                amount: Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))
                            };
                            res.json({ status: true, data: sendData });
                        }
                        else if(orderDetails.payment_details.name=="Fatoorah")
                        {
                            orderDetails.fatoorah_pay_id = req.body.fatoorah_pay_id;
                            createPayment.createFatoorah(orderDetails, function(err, response) {
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
                            createPayment.createTelr(orderDetails, function(err, response) {
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
                            createPayment.createFoloosi(orderDetails, function(err, response) {
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
                    else { res.json({ status: false, error: err, message: "Unable to place order" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

exports.order_details = (req, res) => {
    orderList.findOne({ _id: mongoose.Types.ObjectId(req.query.order_id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid order" });
        }
    });
}