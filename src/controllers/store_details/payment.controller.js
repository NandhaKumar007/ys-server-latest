"use strict";
const mongoose = require('mongoose');
const paypal = require('@paypal/checkout-server-sdk');
const nodeCCAvenue = require('node-ccavenue');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const request = require('request');
const squareConnect = require('square-connect');

const store = require("../../models/store.model");
const paymentDetails = require("../../models/payment_details.model");
const orderList = require("../../models/order_list.model");
const couponCodes = require("../../models/coupon_codes.model");
const donationList = require("../../models/donation_list.model");
const dinamicRewards = require("../../models/dinamic_rewards.model");
const customer = require("../../models/customer.model");
const guestUser = require("../../models/guest_user.model");

const mailService = require("../../../services/mail.service");
const stockService = require("../../../services/stock.service");
const commonService = require("../../../services/common.service");
const erpService = require("../../../services/erp.service");
const validationService = require("../../../services/validation.service");
const vendorWalletMgmt = require("../../models/vendor_wallet_mgmt.model");
const vendor = require("../../models/vendor.model");

/** CCAVENUE  **/
exports.ccavenue_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='CCAvenue');
            if(paymentMethod.length)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                const { encResp } = req.body;
                const ccav = new nodeCCAvenue.Configure(paymentMethod[0].config);
                const output = ccav.redirectResponseToJson(encResp);
                let orderType = output.merchant_param1;
                let orderId = output.merchant_param2;
                let paymentData = {};
                paymentData.store_id = storeDetails._id;
                paymentData.order_id = orderId;
                paymentData.payment_method = "CCAvenue";
                paymentData.payment_status = req.params.status;
                paymentData.payment_details = output;
                // payment details
                paymentDetails.create(paymentData, function(err, response) {
                    // if payment success
                    if(req.params.status=="success") {
                        // Success, Failure, Aborted, Invalid
                        if(output.order_status === 'Success') {
                            // for product
                            if(orderType=='product') {
                                orderList.findOne({ _id: mongoose.Types.ObjectId(orderId), status: "inactive" }, function(err, response) {
                                    if(!err && response) {
                                        let orderDetails = response;
                                        if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                        // clear customer cart
                                        if(!orderDetails.buy_now) {
                                            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                        }
                                        // clear guest user cart
                                        if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                            guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                        }
                                        // invoice number
                                        let invoiceNum = "";
                                        if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                            invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                        }
                                        validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                            // update order status
                                            orderList.findByIdAndUpdate(orderDetails._id,
                                            { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": output.tracking_id, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // update next invoice no
                                                    if(storeDetails.invoice_status) {
                                                        let incCount = 1;
                                                        if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                        store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                    // redirect to user application
                                                    res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                    res.end();
                                                }
                                                else {
                                                    // update order status failure
                                                    res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                    res.end();
                                                }
                                            });
                                        });
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for giftcard
                            else if(orderType=='giftcard') {
                                couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId), status: "inactive" }, function(err, response) {
                                    if(!err && response) {
                                        let couponDetails = response;
                                        // invoice number
                                        let invoiceNum = "";
                                        if(storeDetails.invoice_status) {
                                            invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                        }
                                        // update coupon status
                                        couponCodes.findByIdAndUpdate(couponDetails._id,
                                        { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": output.tracking_id, status: "active" } }, function(err, response) {
                                            if(!err && response)
                                            {
                                                // update next invoice no
                                                if(invoiceNum) {
                                                    store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                }
                                                // send mail
                                                mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                res.end();
                                            }
                                            else {
                                                // update order status failure
                                                res.writeHead(301, {Location: failureCallback+"?response=Order Update Faliure"});
                                                res.end();
                                            }
                                        });
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for donation
                            else if(orderType=='donation') {
                                donationList.findOne({ _id: mongoose.Types.ObjectId(orderId), status: "inactive" }, function(err, response) {
                                    if(!err && response) {
                                        let donationDetails = response;
                                        // update donation status
                                        donationList.findByIdAndUpdate(donationDetails._id,
                                        { $set: { payment_success: true, "payment_details.payment_id": output.tracking_id, status: "active" } }, function(err, response) {
                                            if(!err && response)
                                            {
                                                // send mail
                                                mailService.sendDonationMail(null, donationDetails._id);
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                                res.end();
                                            }
                                            else {
                                                // update order status failure
                                                res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                res.end();
                                            }
                                        });
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                                // for vendor_wallet
                            }
                            else {
                                // if invalid order type
                                res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                res.end();
                            }
                        }
                        else {
                            // if order status != success
                            res.writeHead(301, {Location: failureCallback+"?response=Payment "+output.order_status});
                            res.end();
                        }
                    }
                    else {
                        // if payment failure
                        res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid Payment Method');
            }
        }
        else {
            // invalid order
            res.send('Invalid Order');
        }
    });
}

exports.ccavenue_encryption = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='CCAvenue');
            if(paymentMethod.length)
            {
                const ccav = new nodeCCAvenue.Configure(paymentMethod[0].config);
                const encryptedOrderData = ccav.getEncryptedOrder(req.query);
                res.json({ status: true, encryptData: encryptedOrderData });
            }
            else {
                res.json({ status: false, message: "Invalid payment method" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid store" });
        }
    });
}
/** ### CCAVENUE ### **/

/** RAZORPAY **/
exports.razorpay_webhook = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let signature = req.get('x-razorpay-signature');
	        let validSignature = Razorpay.validateWebhookSignature(JSON.stringify(req.body), signature, req.params.store_id);
            if(validSignature && req.body.payload && req.body.payload.payment && req.body.payload.payment.entity) {
                let orderData = req.body.payload.payment.entity;
                orderData.webhook = true;
                // COMPLETED
                if(orderData.status === 'captured') {
                    let paymentId = orderData.id;
                    let orderType = orderData.notes.my_order_type;
                    let orderId = orderData.notes.my_order_id;
                    // payment details
                    let paymentData = {};
                    paymentData.store_id = storeDetails._id;
                    paymentData.order_id = orderId;
                    paymentData.payment_method = "Razorpay";
                    paymentData.payment_details = orderData;
                    // for product
                    if(orderType=='product') {
                        orderList.findOne({ _id: mongoose.Types.ObjectId(orderId), store_id: mongoose.Types.ObjectId(storeDetails._id), status: "inactive" }, function(err, response) {
                            if(!err && response) {
                                let orderDetails = response;
                                if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                // payment details
                                paymentDetails.create(paymentData, function(err, response) { });
                                // clear customer cart
                                if(!orderDetails.buy_now) {
                                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                }
                                // clear guest user cart
                                if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                    guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                }
                                // invoice number
                                let invoiceNum = "";
                                if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                }
                                validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                    // update order status
                                    orderList.findByIdAndUpdate(orderDetails._id,
                                    { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                        if(!err && response)
                                        {
                                            // ERP
                                            let erpDetails = storeDetails.erp_details;
                                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                if(orderDetails.order_by=='user') {
                                                    customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                                        if(!err && response) {
                                                            orderDetails.customer_email = response.email;
                                                            let erpData = {
                                                                erp_config: erpDetails.config,
                                                                store_id: storeDetails._id, event_type: 'place_order',
                                                                user_agent: req.get('User-Agent'), order_details: orderDetails
                                                            }
                                                            erpService.ambar(erpData);
                                                        }
                                                    });
                                                }
                                                else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                    orderDetails.customer_email = orderDetails.guest_email;
                                                    let erpData = {
                                                        erp_config: erpDetails.config,
                                                        store_id: storeDetails._id, event_type: 'place_order',
                                                        user_agent: req.get('User-Agent'), order_details: orderDetails
                                                    }
                                                    erpService.ambar(erpData);
                                                }
                                            }
                                            // update next invoice no
                                            if(storeDetails.invoice_status) {
                                                let incCount = 1;
                                                if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                            res.json({ status: true });
                                        }
                                        else {
                                            res.json({ status: false, message: 'Order Update Failure' });
                                        }
                                    });
                                });
                            }
                            else {
                                res.json({ status: false, message: 'Invalid Order' });
                            }
                        });
                    }
                    // for giftcard
                    else if(orderType=='giftcard') {
                        couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId), store_id: mongoose.Types.ObjectId(storeDetails._id), status: "inactive" }, function(err, response) {
                            if(!err && response) {
                                let couponDetails = response;
                                // invoice number
                                let invoiceNum = "";
                                if(storeDetails.invoice_status) {
                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                }
                                // payment details
                                paymentDetails.create(paymentData, function(err, response) { });
                                // update coupon status
                                couponCodes.findByIdAndUpdate(couponDetails._id,
                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // update next invoice no
                                        if(invoiceNum) {
                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                        }
                                        // send mail
                                        mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                        res.json({ status: true });
                                    }
                                    else {
                                        res.json({ status: false, message: 'Order Update Failure' });
                                    }
                                });
                            }
                            else {
                                res.json({ status: false, message: 'Invalid Order' });
                            }
                        });
                    }
                    // for donation
                    else if(orderType=='donation') {
                        donationList.findOne({ _id: mongoose.Types.ObjectId(orderId), store_id: mongoose.Types.ObjectId(storeDetails._id), status: "inactive" }, function(err, response) {
                            if(!err && response) {
                                let donationDetails = response;
                                // payment details
                                paymentDetails.create(paymentData, function(err, response) { });
                                // update donation status
                                donationList.findByIdAndUpdate(donationDetails._id,
                                { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // send mail
                                        mailService.sendDonationMail(null, donationDetails._id);
                                        res.json({ status: true });
                                    }
                                    else {
                                        res.json({ status: false, message: 'Order Update Failure' });
                                    }
                                });
                            }
                            else {
                                res.json({ status: false, message: 'Invalid Order' });
                            }
                        });
                    }
                    // for dinamic offer
                    else if(orderType=='dinamic_offer') {
                        dinamicRewards.findOne({ _id: mongoose.Types.ObjectId(orderId), store_id: mongoose.Types.ObjectId(storeDetails._id), status: "inactive" }, function(err, response) {
                            if(!err && response) {
                                let dOfferDetails = response;
                                // payment details
                                paymentDetails.create(paymentData, function(err, response) { });
                                // update donation status
                                dinamicRewards.findByIdAndUpdate(dOfferDetails._id,
                                { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // send mail
                                        // mailService.sendDonationMail(null, dOfferDetails._id);
                                        res.json({ status: true });
                                    }
                                    else {
                                        res.json({ status: false, message: 'Order Update Failure' });
                                    }
                                });
                            }
                            else {
                                res.json({ status: false, message: 'Invalid Order' });
                            }
                        });
                    }
                    else {
                        res.json({ status: false, message: 'Invalid Order' });
                    }
                }
                else {
                    res.json({ status: false, message: 'Payment '+orderData.status });
                }
            }
            else {
                res.json({ status: false, message: "Invalid signature" });
            }
        }
        else {
            res.json({ status: false, message: "Invalid Store" });
        }
    });
}

exports.razorpay_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length && req.body.razorpay_payment_id)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                let instance = new Razorpay(paymentMethod[0].config);
                instance.payments.fetch(req.body.razorpay_payment_id, function(err, orderData) {
                    if(!err && orderData) {
                        let paymentId = orderData.id;
                        let orderType = orderData.notes.my_order_type;
                        let orderId = orderData.notes.my_order_id;
                        // payment details
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = orderId;
                        paymentData.payment_method = "Razorpay";
                        paymentData.payment_details = orderData;
                        // COMPLETED
                        if(orderData.status === 'captured') {
                            // for product
                            if(orderType=='product') {
                                orderList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let orderDetails = response;
                                        if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                        if(orderDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // clear customer cart
                                            if(!orderDetails.buy_now) {
                                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                            }
                                            // clear guest user cart
                                            if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                            }
                                            // invoice number
                                            let invoiceNum = "";
                                            if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                            }
                                            validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                                // update order status
                                                orderList.findByIdAndUpdate(orderDetails._id,
                                                { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // ERP
                                                        let erpDetails = storeDetails.erp_details;
                                                        if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                            if(orderDetails.order_by=='user') {
                                                                customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                                                    if(!err && response) {
                                                                        orderDetails.customer_email = response.email;
                                                                        let erpData = {
                                                                            erp_config: erpDetails.config,
                                                                            store_id: storeDetails._id, event_type: 'place_order',
                                                                            user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                        }
                                                                        erpService.ambar(erpData);
                                                                    }
                                                                });
                                                            }
                                                            else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                                orderDetails.customer_email = orderDetails.guest_email;
                                                                let erpData = {
                                                                    erp_config: erpDetails.config,
                                                                    store_id: storeDetails._id, event_type: 'place_order',
                                                                    user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                }
                                                                erpService.ambar(erpData);
                                                            }
                                                        }
                                                        // update next invoice no
                                                        if(storeDetails.invoice_status) {
                                                            let incCount = 1;
                                                            if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for giftcard
                            else if(orderType=='giftcard') {
                                couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let couponDetails = response;
                                        // invoice number
                                        let invoiceNum = "";
                                        if(storeDetails.invoice_status) {
                                            invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                        }
                                        if(couponDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // update coupon status
                                            couponCodes.findByIdAndUpdate(couponDetails._id,
                                            { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // update next invoice no
                                                    if(invoiceNum) {
                                                        store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                    }
                                                    // send mail
                                                    mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                    // redirect to user application
                                                    res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                    res.end();
                                                }
                                                else {
                                                    // update order status failure
                                                    res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                    res.end();
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for donation
                            else if(orderType=='donation') {
                                donationList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let donationDetails = response;
                                        if(donationDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // update donation status
                                            donationList.findByIdAndUpdate(donationDetails._id,
                                            { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // send mail
                                                    mailService.sendDonationMail(null, donationDetails._id);
                                                    // redirect to user application
                                                    res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                                    res.end();
                                                }
                                                else {
                                                    // update order status failure
                                                    res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                    res.end();
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for dinamic offer
                            else if(orderType=='dinamic_offer') {
                                dinamicRewards.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let dOfferDetails = response;
                                        if(dOfferDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=dinamic_offer&order_id="+dOfferDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // update dinamic offer status
                                            dinamicRewards.findByIdAndUpdate(dOfferDetails._id,
                                            { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // send mail
                                                    // mailService.sendDonationMail(null, dOfferDetails._id);
                                                    // redirect to user application
                                                    res.writeHead(301, {Location: successCallback+"?type=dinamic_offer&order_id="+dOfferDetails._id});
                                                    res.end();
                                                }
                                                else {
                                                    // update order status failure
                                                    res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                    res.end();
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for vendor wallet
                            else if(orderType=='vendor_wallet') {
                                let successUrl = 'https://dev.whitemastery.com/yourstore/admin/payment-summary';
                                let failureUrl = 'https://dev.whitemastery.com/yourstore/admin/payment-summary';

                                vendorWalletMgmt.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let dOfferDetails = response;
                                        if(dOfferDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successUrl+"/vendor-wallet/"+dOfferDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // update dinamic offer status
                                            vendorWalletMgmt.findByIdAndUpdate(dOfferDetails._id, 
                                                { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" }}, 
                                                function(err, response) {
                                                if(!err && response)
                                                {
                                                    vendor.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.params.vendor_id)}, {$inc:{ "wallet_balance": dOfferDetails.order_price } }, 
                                                    { new: true }, function(err, response){
                                                        if(!err && response)
                                                        {
                                                            vendorWalletMgmt.findByIdAndUpdate(dOfferDetails._id, { $set: { balance: response.wallet_balance } }, function(err, response) { });                                                 
                                                            res.writeHead(301, {Location: successUrl+"/vendor-wallet/"+dOfferDetails._id});
                                                            res.end();
                                                        }
                                                        else {
                                                            // update order status failure                                                   
                                                            res.writeHead(301, {Location: failureUrl+"?response=Order Update Failure"});
                                                            res.end();
                                                        }
                                                    });
                                                }
                                                else {
                                                   
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureUrl+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            
                            else {
                                // if invalid order type
                                res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                res.end();
                            }
                        }
                        else {
                            paymentDetails.create(paymentData, function(err, response) { });
                            // if order status != success
                            res.writeHead(301, {Location: failureCallback+"?response=Payment "+orderData.status});
                            res.end();
                        }
                    }
                    else {
                        // if invalid order
                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid payment method or paymentId missing');
            }
        }
        else {
            // invalid store
            res.send('Invalid Store');
        }
    });
}

exports.product_razorpay_status = (req, res) => {
    orderList.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.params.order_id), status: "inactive" }
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
            let orderDetails = response[0];
            let storeDetails = response[0].storeDetails[0];
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let instance = new Razorpay(paymentMethod[0].config);
                instance.payments.fetch(req.params.payment_id, function(err, orderData) {
                    if(!err && orderData) {
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = orderDetails._id;
                        paymentData.payment_method = "Razorpay";
                        paymentData.payment_details = orderData;
                        // payment details
                        paymentDetails.create(paymentData, function(err, response) {
                            // COMPLETED
                            if(orderData.status === 'captured') {
                                // invoice number
                                let invoiceNum = "";
                                if(storeDetails.invoice_status) {
                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                }
                                // clear customer cart
                                if(!orderDetails.buy_now) {
                                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                }
                                // clear guest user cart
                                if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                    guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                }
                                // update order status
                                let paymentId = orderData.id;
                                orderList.findByIdAndUpdate(orderDetails._id,
                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // update next invoice no
                                        if(invoiceNum) {
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
                                        // redirect to user application
                                        res.json({ status: true });
                                    }
                                    else {
                                        // update order status failure
                                        res.json({ status: false, error: err, message: 'Order Update Failure' });
                                    }
                                });
                            }
                            else {
                                // if order status != success
                                res.json({ status: false, error: err, message: 'Payment '+orderData.status });
                            }
                        });
                    }
                    else {
                        // invalid payment
                        res.json({ status: false, error: err, message: 'Invalid Razorpay Order' });
                    }
                });
            }
            else {
                // invalid payment method
                res.json({ status: false, error: err, message: 'Invalid Payment Method' });
            }
        }
        else {
            // invalid order
            res.json({ status: false, error: err, message: 'Invalid Order' });
        }
    });
}

exports.giftcard_razorpay_status = (req, res) => {
    couponCodes.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.params.order_id), status: "inactive" }
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
            let couponDetails = response[0];
            let storeDetails = response[0].storeDetails[0];
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let instance = new Razorpay(paymentMethod[0].config);
                instance.payments.fetch(req.params.payment_id, function(err, orderData) {
                    if(!err && orderData) {
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = couponDetails._id;
                        paymentData.payment_method = "Razorpay";
                        paymentData.payment_details = orderData;
                        // payment details
                        paymentDetails.create(paymentData, function(err, response) {
                            // COMPLETED
                            if(orderData.status === 'captured') {
                                // invoice number
                                let invoiceNum = "";
                                if(storeDetails.invoice_status) {
                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                }
                                // update coupon status
                                let paymentId = orderData.id;
                                couponCodes.findByIdAndUpdate(couponDetails._id,
                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // update next invoice no
                                        if(invoiceNum) {
                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                        }
                                        // send mail
                                        mailService.sendGiftCardPurchaseMail(response._id);
                                        // redirect to user application
                                        res.json({ status: true });
                                    }
                                    else {
                                        // update order status failure
                                        res.json({ status: false, error: err, message: 'Order Update Failure' });
                                    }
                                });
                            }
                            else {
                                // if order status != success
                                res.json({ status: false, error: err, message: 'Payment '+orderData.status });
                            }
                        });
                    }
                    else {
                        // invalid payment
                        res.json({ status: false, error: err, message: 'Invalid Razorpay Order' });
                    }
                });
            }
            else {
                // invalid payment method
                res.json({ status: false, error: err, message: 'Invalid Payment Method' });
            }
        }
        else {
            // invalid order
            res.json({ status: false, error: err, message: 'Invalid Order' });
        }
    });
}

exports.donation_razorpay_status = (req, res) => {
    donationList.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.params.order_id), status: "inactive" }
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
            let donationDetails = response[0];
            let storeDetails = response[0].storeDetails[0];
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let instance = new Razorpay(paymentMethod[0].config);
                instance.payments.fetch(req.params.payment_id, function(err, orderData) {
                    if(!err && orderData) {
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = donationDetails._id;
                        paymentData.payment_method = "Razorpay";
                        paymentData.payment_details = orderData;
                        // payment details
                        paymentDetails.create(paymentData, function(err, response) {
                            // COMPLETED
                            if(orderData.status === 'captured') {
                                // update donation status
                                let paymentId = orderData.id;
                                donationList.findByIdAndUpdate(donationDetails._id,
                                { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // send mail
                                        mailService.sendDonationMail(null, response._id);
                                        // redirect to user application
                                        res.json({ status: true });
                                    }
                                    else {
                                        // update order status failure
                                        res.json({ status: false, error: err, message: 'Order Update Failure' });
                                    }
                                });
                            }
                            else {
                                // if order status != success
                                res.json({ status: false, error: err, message: 'Payment '+orderData.status });
                            }
                        });
                    }
                    else {
                        // invalid payment
                        res.json({ status: false, error: err, message: 'Invalid Razorpay Order' });
                    }
                });
            }
            else {
                // invalid payment method
                res.json({ status: false, error: err, message: 'Invalid Payment Method' });
            }
        }
        else {
            // invalid order
            res.json({ status: false, error: err, message: 'Invalid Order' });
        }
    });
}
/** ### RAZORPAY ### **/

/** PAYPAL **/
exports.product_paypal_status = (req, res) => {
    orderList.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.params.order_id), status: "inactive" }
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
            let orderDetails = response[0];
            if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
            let storeDetails = response[0].storeDetails[0];
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='PayPal');
            if(paymentMethod.length)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                capturePayPalOrder(paymentMethod[0], req.query.token).then((capturedOrder) => {
                    if(capturedOrder.result) {
                        let capturedData = capturedOrder.result;
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = orderDetails._id;
                        paymentData.payment_method = "PayPal";
                        paymentData.payment_status = req.params.status;
                        paymentData.payment_details = capturedData;
                        // payment details
                        paymentDetails.create(paymentData, function(err, response) {
                            // if payment success
                            if(req.params.status=="success") {
                                // COMPLETED
                                if(capturedData.status === 'COMPLETED') {
                                    // clear customer cart
                                    if(!orderDetails.buy_now) {
                                        customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                    }
                                    // clear guest user cart
                                    if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                        guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                    }
                                    // invoice number
                                    let invoiceNum = "";
                                    if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                        invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                    }
                                    validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                        // update order status
                                        let paymentId = capturedData.purchase_units[0].payments.captures[0].id;
                                        orderList.findByIdAndUpdate(orderDetails._id,
                                        { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                            if(!err && response)
                                            {
                                                // ERP
                                                let erpDetails = storeDetails.erp_details;
                                                if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                    if(orderDetails.order_by=='user') {
                                                        customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                                            if(!err && response) {
                                                                orderDetails.customer_email = response.email;
                                                                let erpData = {
                                                                    erp_config: erpDetails.config,
                                                                    store_id: storeDetails._id, event_type: 'place_order',
                                                                    user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                }
                                                                erpService.ambar(erpData);
                                                            }
                                                        });
                                                    }
                                                    else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                        orderDetails.customer_email = orderDetails.guest_email;
                                                        let erpData = {
                                                            erp_config: erpDetails.config,
                                                            store_id: storeDetails._id, event_type: 'place_order',
                                                            user_agent: req.get('User-Agent'), order_details: orderDetails
                                                        }
                                                        erpService.ambar(erpData);
                                                    }
                                                }
                                                // update next invoice no
                                                if(storeDetails.invoice_status) {
                                                    let incCount = 1;
                                                    if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                    store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                res.end();
                                            }
                                            else {
                                                // update order status failure
                                                res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                res.end();
                                            }
                                        });
                                    });
                                }
                                else {
                                    // if order status != success
                                    res.writeHead(301, {Location: failureCallback+"?response=Payment "+capturedData.status});
                                    res.end();
                                }
                            }
                            else {
                                // if payment failure
                                res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                                res.end();
                            }
                        });
                    }
                    else {
                        res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid Payment Method');
            }
        }
        else {
            // invalid order
            res.send('Invalid Order');
        }
    });
}

exports.giftcard_paypal_status = (req, res) => {
    couponCodes.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.params.order_id), status: "inactive" }
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
            let couponDetails = response[0];
            let storeDetails = response[0].storeDetails[0];
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='PayPal');
            if(paymentMethod.length)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                capturePayPalOrder(paymentMethod[0], req.query.token).then((capturedOrder) => {
                    if(capturedOrder.result) {
                        let capturedData = capturedOrder.result;
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = couponDetails._id;
                        paymentData.payment_method = "PayPal";
                        paymentData.payment_status = req.params.status;
                        paymentData.payment_details = capturedData;
                        // payment details
                        paymentDetails.create(paymentData, function(err, response) {
                            // if payment success
                            if(req.params.status=="success") {
                                // COMPLETED
                                if(capturedData.status === 'COMPLETED') {
                                    // invoice number
                                    let invoiceNum = "";
                                    if(storeDetails.invoice_status) {
                                        invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                    }
                                    // update coupon status
                                    let paymentId = capturedData.purchase_units[0].payments.captures[0].id;
                                    couponCodes.findByIdAndUpdate(couponDetails._id,
                                    { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                        if(!err && response)
                                        {
                                            // update next invoice no
                                            if(invoiceNum) {
                                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                            }
                                            // send mail
                                            mailService.sendGiftCardPurchaseMail(response._id);
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+response._id});
                                            res.end();
                                        }
                                        else {
                                            // update order status failure
                                            res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                            res.end();
                                        }
                                    });
                                }
                                else {
                                    // if order status != success
                                    res.writeHead(301, {Location: failureCallback+"?response=Payment "+capturedData.status});
                                    res.end();
                                }
                            }
                            else {
                                // if payment failure
                                res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                                res.end();
                            }
                        });
                    }
                    else {
                        res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid Payment Method');
            }
        }
        else {
            // invalid order
            res.send('Invalid Order');
        }
    });
}

exports.donation_paypal_status = (req, res) => {
    donationList.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.params.order_id), status: "inactive" }
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
            let donationDetails = response[0];
            let storeDetails = response[0].storeDetails[0];
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='PayPal');
            if(paymentMethod.length)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                capturePayPalOrder(paymentMethod[0], req.query.token).then((capturedOrder) => {
                    if(capturedOrder.result) {
                        let capturedData = capturedOrder.result;
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = donationDetails._id;
                        paymentData.payment_method = "PayPal";
                        paymentData.payment_status = req.params.status;
                        paymentData.payment_details = capturedData;
                        // payment details
                        paymentDetails.create(paymentData, function(err, response) {
                            // if payment success
                            if(req.params.status=="success") {
                                // COMPLETED
                                if(capturedData.status === 'COMPLETED') {
                                    // update donation status
                                    let paymentId = capturedData.purchase_units[0].payments.captures[0].id;
                                    donationList.findByIdAndUpdate(donationDetails._id,
                                    { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                        if(!err && response)
                                        {
                                            // send mail
                                            mailService.sendDonationMail(null, response._id);
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+response._id});
                                            res.end();
                                        }
                                        else {
                                            // update order status failure
                                            res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                            res.end();
                                        }
                                    });
                                }
                                else {
                                    // if order status != success
                                    res.writeHead(301, {Location: failureCallback+"?response=Payment "+capturedData.status});
                                    res.end();
                                }
                            }
                            else {
                                // if payment failure
                                res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                                res.end();
                            }
                        });
                    }
                    else {
                        res.writeHead(301, {Location: failureCallback+"?response=Payment Failure"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid Payment Method');
            }
        }
        else {
            // invalid order
            res.send('Invalid Order');
        }
    });
}

async function capturePayPalOrder(paypalConfig, orderToken) {
    let request = new paypal.orders.OrdersCaptureRequest(orderToken);
    request.requestBody({});
    let clientId = paypalConfig.config.client_id;
    let clientSecret = paypalConfig.config.client_secret;
    let environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    if(paypalConfig.mode=='sandbox') { environment = new paypal.core.SandboxEnvironment(clientId, clientSecret); }
    let client = new paypal.core.PayPalHttpClient(environment);
    const response = await client.execute(request);
    return response;
}
/** ### PAYPAL ### **/

/** SQUARE **/
exports.square_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Square');
            if(paymentMethod.length)
            {
                // for product
                if(req.body.order_type=='product') {
                    orderList.findOne({ _id: mongoose.Types.ObjectId(req.body.order_id) }, function(err, response) {
                        if(!err && response) {
                            let orderDetails = response;
                            if(orderDetails.status=='active') {
                                res.json({ status: true });
                            }
                            else {
                                let orderAmount = (commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))*1;
                                let payload = {
                                    source_id: req.body.nonce,
                                    amount_money: { amount: parseInt(orderAmount*100), currency: orderDetails.currency_type.country_code }
                                };
                                createSquareOrder(paymentMethod[0], payload).then((squareResponse) => {
                                    let paymentData = {};
                                    paymentData.store_id = storeDetails._id;
                                    paymentData.order_id = orderDetails._id;
                                    paymentData.payment_method = "Square";
                                    paymentData.payment_details = squareResponse.data;
                                    paymentDetails.create(paymentData, function(err, response) { });
                                    // payment status
                                    if(squareResponse.status) {
                                        let squarePayData = squareResponse.data;
                                        if(squarePayData.payment.status=='COMPLETED') {
                                            // clear customer cart
                                            if(!orderDetails.buy_now) {
                                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                            }
                                            // clear guest user cart
                                            if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                            }
                                            // update order status
                                            orderList.findByIdAndUpdate(orderDetails._id,
                                            { $set: { payment_success: true, "payment_details.payment_id": squarePayData.payment.id, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
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
                                                    res.json({ status: true });
                                                }
                                                else {
                                                    // update order status failure
                                                    res.json({ status: false, error: err, msg: 'Order Update Failure' });
                                                }
                                            });
                                        }
                                        else {
                                            // if payment status != success
                                            res.json({ status: false, msg: 'Payment '+squarePayData.payment.status });
                                        }
                                    }
                                    else {
                                        // payment failure
                                        res.json({ status: false, msg: squareResponse.data });
                                    }
                                });
                            }
                        }
                        else {
                            // if invalid order
                            res.json({ status: false, error: err, msg: 'Invalid Order' });
                        }
                    });
                }
                // for giftcard
                else if(req.body.order_type=='giftcard') {
                    couponCodes.findOne({ _id: mongoose.Types.ObjectId(req.body.order_id) }, function(err, response) {
                        if(!err && response) {
                            let couponDetails = response;
                            if(couponDetails.status=='active') {
                                res.json({ status: true });
                            }
                            else {
                                let orderAmount = (commonService.priceConvert(couponDetails.currency_type, couponDetails.price))*1;
                                let payload = {
                                    source_id: req.body.nonce,
                                    amount_money: { amount: parseInt(orderAmount*100), currency: couponDetails.currency_type.country_code }
                                };
                                createSquareOrder(paymentMethod[0], payload).then((squareResponse) => {
                                    console.log("-squareResponse", squareResponse)
                                    let paymentData = {};
                                    paymentData.store_id = storeDetails._id;
                                    paymentData.order_id = couponDetails._id;
                                    paymentData.payment_method = "Square";
                                    paymentData.payment_details = squareResponse.data;
                                    paymentDetails.create(paymentData, function(err, response) { });
                                    // payment status
                                    if(squareResponse.status) {
                                        let squarePayData = squareResponse.data;
                                        if(squarePayData.payment.status=='COMPLETED') {
                                            // update coupon status
                                            couponCodes.findByIdAndUpdate(couponDetails._id,
                                            { $set: { payment_success: true, "payment_details.payment_id": squarePayData.payment.id, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // send mail
                                                    mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                    res.json({ status: true });
                                                }
                                                else {
                                                    // update order status failure
                                                    res.json({ status: false, error: err, msg: 'Order Update Failure' });
                                                }
                                            });
                                        }
                                        else {
                                            // if payment status != success
                                            res.json({ status: false, msg: 'Payment '+squarePayData.payment.status });
                                        }
                                    }
                                    else {
                                        // payment failure
                                        res.json({ status: false, msg: squareResponse.data });
                                    }
                                });
                            }
                        }
                        else {
                            // if invalid order
                            res.json({ status: false, error: err, msg: 'Invalid Order' });
                        }
                    });
                }
                // for donation
                else if(req.body.order_type=='donation') {
                    donationList.findOne({ _id: mongoose.Types.ObjectId(req.body.order_id) }, function(err, response) {
                        if(!err && response) {
                            let donationDetails = response;
                            if(donationDetails.status=='active') {
                                res.json({ status: true });
                            }
                            else {
                                let payload = {
                                    source_id: req.body.nonce,
                                    amount_money: { amount: parseInt(donationDetails.price*100), currency: donationDetails.currency_type.country_code }
                                };
                                createSquareOrder(paymentMethod[0], payload).then((squareResponse) => {
                                    let paymentData = {};
                                    paymentData.store_id = storeDetails._id;
                                    paymentData.order_id = donationDetails._id;
                                    paymentData.payment_method = "Square";
                                    paymentData.payment_details = squareResponse.data;
                                    paymentDetails.create(paymentData, function(err, response) { });
                                    // payment status
                                    if(squareResponse.status) {
                                        let squarePayData = squareResponse.data;
                                        if(squarePayData.payment.status=='COMPLETED') {
                                            // update donation status
                                            donationList.findByIdAndUpdate(donationDetails._id,
                                            { $set: { payment_success: true, "payment_details.payment_id": squarePayData.payment.id, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // send mail
                                                    mailService.sendDonationMail(null, donationDetails._id);
                                                    res.json({ status: true });
                                                }
                                                else {
                                                    // update order status failure
                                                    res.json({ status: false, error: err, msg: 'Order Update Failure' });
                                                }
                                            });
                                        }
                                        else {
                                            // if payment status != success
                                            res.json({ status: false, msg: 'Payment '+squarePayData.payment.status });
                                        }
                                    }
                                    else {
                                        // payment failure
                                        res.json({ status: false, msg: squareResponse.data });
                                    }
                                });
                            }
                        }
                        else {
                            // if invalid order
                            res.json({ status: false, error: err, msg: 'Invalid Order' });
                        }
                    });
                }
                else {
                    // if invalid order type
                    res.json({ status: false, msg: 'Invalid Order' });
                }
            }
            else {
                // invalid payment method
                res.json({ status: false, msg: 'Invalid Payment Method' });
            }
        }
        else {
            // invalid store
            res.json({ status: false, error: err, msg: 'Invalid Store' });
        }
    });
}

async function createSquareOrder(squareConfig, payload) {
    let squareBase = 'https://connect.squareup.com';
    if(squareConfig.mode=='sandbox') { squareBase = 'https://connect.squareupsandbox.com'; }
    const defaultClient = squareConnect.ApiClient.instance;
    const oauth2 = defaultClient.authentications['oauth2'];
    oauth2.accessToken = squareConfig.config.access_token;
    defaultClient.basePath = squareBase;
    payload.idempotency_key = crypto.randomBytes(22).toString('hex');
    try {
        const payments_api = new squareConnect.PaymentsApi();
        const response = await payments_api.createPayment(payload);
        let respData = { 'status': true, 'data': response };
        return respData;
    } catch(error) {
        let errorList = JSON.parse(error.response.text);
        let errorData = { 'status': false, 'data': errorList.errors[0].detail };
        return errorData;
    }
}
/** ### SQUARE ### **/

/** FATOORAH **/
exports.fatoorah_initiate_pay = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Fatoorah');
            if(paymentMethod.length)
            {
                let initiateUrl = "https://api.myfatoorah.com/v2/InitiatePayment";
                if(paymentMethod[0].mode=='sandbox') { initiateUrl = "https://apitest.myfatoorah.com/v2/InitiatePayment"; }
                let orderAmount = Number(commonService.priceConvert(req.body.currency_type, req.body.price));
                let currencyType = req.body.currency_type.country_code;
                let options = {
                    method: 'POST', url: initiateUrl,
                    headers: { Accept: 'application/json', Authorization: 'Bearer '+paymentMethod[0].config.token, 'Content-Type': 'application/json' },
                    body: { InvoiceAmount: orderAmount, CurrencyIso: currencyType },
                    json: true
                };
                request(options, function (err, response, body) 
                {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.IsSuccess) {
                            res.json({ status: true, data: respData.Data });
                        }
                        else {
                            if(respData.ValidationErrors && respData.ValidationErrors.length) {
                                res.json({ status: false, error: respData, message: respData.ValidationErrors[0].Error });
                            }
                            else {
                                res.json({ status: false, error: respData, message: "Payment initiation error" });
                            }
                        }
                    }
                    else {
                        res.json({ status: false, error: err, message: "Payment initiation error" });
                    }
                });
            }
            else {
                res.json({ status: false, message: "Invalid payment method" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid store" });
        }
    });
}

exports.fatoorah_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Fatoorah');
            if(paymentMethod.length && req.query.paymentId)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                let payStatusUrl = "https://api.myfatoorah.com/v2/GetPaymentStatus";
                if(paymentMethod[0].mode=='sandbox') { payStatusUrl = "https://apitest.myfatoorah.com/v2/GetPaymentStatus"; }
                let options = {
                    method: 'POST', url: payStatusUrl,
                    headers: { Accept: 'application/json', Authorization: 'Bearer '+paymentMethod[0].config.token, 'Content-Type': 'application/json' },
                    body: { Key: req.query.paymentId, KeyType: "PaymentId" },
                    json: true
                };
                request(options, function (err, response, body) 
                {
                    if(!err && response.body) {
                        let paymentRespData = response.body;
                        if(paymentRespData.IsSuccess) {
                            let orderData = JSON.parse(paymentRespData.Data.UserDefinedField);
                            let orderType = orderData.order_type;
                            let orderId = orderData.order_id;
                            let paymentId = req.query.paymentId;
                            // payment details
                            let paymentData = {};
                            paymentData.store_id = storeDetails._id;
                            paymentData.order_id = orderId;
                            paymentData.payment_method = "Fatoorah";
                            paymentData.payment_details = paymentRespData.Data;
                            // COMPLETED
                            if(paymentRespData.Data.InvoiceStatus=='Paid') {
                                // for product
                                if(orderType=='product') {
                                    orderList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let orderDetails = response;
                                            if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                            if(orderDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // clear customer cart
                                                if(!orderDetails.buy_now) {
                                                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                                }
                                                // clear guest user cart
                                                if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                    guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                                }
                                                // invoice number
                                                let invoiceNum = "";
                                                if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                                }
                                                validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                                    // update order status
                                                    orderList.findByIdAndUpdate(orderDetails._id,
                                                    { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                        if(!err && response)
                                                        {
                                                            // update next invoice no
                                                            if(storeDetails.invoice_status) {
                                                                let incCount = 1;
                                                                if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                            // redirect to user application
                                                            res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                            res.end();
                                                        }
                                                        else {
                                                            // update order status failure
                                                            res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                            res.end();
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                // for giftcard
                                else if(orderType=='giftcard') {
                                    couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let couponDetails = response;
                                            // invoice number
                                            let invoiceNum = "";
                                            if(storeDetails.invoice_status) {
                                                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                            }
                                            if(couponDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // update coupon status
                                                couponCodes.findByIdAndUpdate(couponDetails._id,
                                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // update next invoice no
                                                        if(invoiceNum) {
                                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                        }
                                                        // send mail
                                                        mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                // for donation
                                else if(orderType=='donation') {
                                    donationList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let donationDetails = response;
                                            if(donationDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // update donation status
                                                donationList.findByIdAndUpdate(donationDetails._id,
                                                { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // send mail
                                                        mailService.sendDonationMail(null, donationDetails._id);
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                else {
                                    // if invalid order type
                                    res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                    res.end();
                                }
                            }
                            else {
                                paymentDetails.create(paymentData, function(err, response) { });
                                // if order status != success
                                res.writeHead(301, {Location: failureCallback+"?response=Payment "+paymentRespData.Data.InvoiceStatus});
                                res.end();
                            }
                        }
                        else {
                            // if payment status failure
                            res.writeHead(301, {Location: failureCallback+"?response=Payment fetch error"});
                            res.end();
                        }
                    }
                    else {
                        // if invalid order
                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid payment method or paymentId missing');
            }
        }
        else {
            // invalid store
            res.send('Invalid Store');
        }
    });
}
/** ### FATOORAH ### **/

/** TELR **/
exports.telr_payment_status = (req, res) => {
    if(req.params.order_type=='product') {
        orderList.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.params.order_id) } },
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
                let orderDetails = response[0];
                if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                let storeDetails = response[0].storeDetails[0];
                let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Telr');
                if(paymentMethod.length)
                {
                    let successCallback = storeDetails.base_url+"/checkout/order-summary";
                    let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                    if(orderDetails.status=='active') {
                        // redirect to user application
                        res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                        res.end();
                    }
                    else {
                        checkTelrStatus(paymentMethod[0].config, orderDetails.payment_details.order_id).then((telrData) => {
                            // payment details
                            let paymentData = {};
                            paymentData.store_id = storeDetails._id;
                            paymentData.order_id = orderDetails._id;
                            paymentData.payment_method = "Telr";
                            paymentData.payment_details = telrData;
                            paymentDetails.create(paymentData, function(err, response) { });
                            // Paid
                            if(telrData.status.text === 'Paid') {
                                // clear customer cart
                                if(!orderDetails.buy_now) {
                                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                }
                                // clear guest user cart
                                if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                    guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                }
                                // invoice number
                                let invoiceNum = "";
                                if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                }
                                validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                    // update order status
                                    orderList.findByIdAndUpdate(orderDetails._id,
                                    { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": telrData.transaction.ref, status: "active" } }, function(err, response) {
                                        if(!err && response)
                                        {
                                            // update next invoice no
                                            if(storeDetails.invoice_status) {
                                                let incCount = 1;
                                                if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                            res.end();
                                        }
                                        else {
                                            // update order status failure
                                            res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                            res.end();
                                        }
                                    });
                                });
                            }
                            else {
                                // if order status != success
                                res.writeHead(301, {Location: failureCallback+"?response=Payment "+telrData.status.text});
                                res.end();
                            }
                        })
                        .catch((errMsg) => {
                            // telr error
                            res.writeHead(301, {Location: failureCallback+"?response="+errMsg});
                            res.end();
                        });
                    }
                }
                else {
                    // invalid payment method
                    res.send('Invalid Payment Method');
                }
            }
            else {
                // invalid order
                res.send('Invalid Order');
            }
        });
    }
    else if(req.params.order_type=='giftcard') {
        couponCodes.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.params.order_id) } },
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
                let couponDetails = response[0];
                let storeDetails = response[0].storeDetails[0];
                let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Telr');
                if(paymentMethod.length)
                {
                    let successCallback = storeDetails.base_url+"/checkout/order-summary";
                    let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                    if(couponDetails.status=='active') {
                        // redirect to user application
                        res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                        res.end();
                    }
                    else {
                        checkTelrStatus(paymentMethod[0].config, couponDetails.payment_details.order_id).then((telrData) => {
                            // payment details
                            let paymentData = {};
                            paymentData.store_id = storeDetails._id;
                            paymentData.order_id = couponDetails._id;
                            paymentData.payment_method = "Telr";
                            paymentData.payment_details = telrData;
                            paymentDetails.create(paymentData, function(err, response) { });
                            // Paid
                            if(telrData.status.text === 'Paid') {
                                // invoice number
                                let invoiceNum = "";
                                if(storeDetails.invoice_status) {
                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                }
                                // update coupon status
                                couponCodes.findByIdAndUpdate(couponDetails._id,
                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": telrData.transaction.ref, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // update next invoice no
                                        if(invoiceNum) {
                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                        }
                                        // send mail
                                        mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                        // redirect to user application
                                        res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                        res.end();
                                    }
                                    else {
                                        // update order status failure
                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                        res.end();
                                    }
                                });
                            }
                            else {
                                // if order status != success
                                res.writeHead(301, {Location: failureCallback+"?response=Payment "+telrData.status.text});
                                res.end();
                            }
                        })
                        .catch((errMsg) => {
                            // telr error
                            res.writeHead(301, {Location: failureCallback+"?response="+errMsg});
                            res.end();
                        });
                    }
                }
                else {
                    // invalid payment method
                    res.send('Invalid Payment Method');
                }
            }
            else {
                // invalid order
                res.send('Invalid Order');
            }
        });
    }
    else if(req.params.order_type=='donation') {
        donationList.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.params.order_id) } },
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
                let donationDetails = response[0];
                let storeDetails = response[0].storeDetails[0];
                let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Telr');
                if(paymentMethod.length)
                {
                    let successCallback = storeDetails.base_url+"/checkout/order-summary";
                    let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                    if(donationDetails.status=='active') {
                        // redirect to user application
                        res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                        res.end();
                    }
                    else {
                        checkTelrStatus(paymentMethod[0].config, donationDetails.payment_details.order_id).then((telrData) => {
                            // payment details
                            let paymentData = {};
                            paymentData.store_id = storeDetails._id;
                            paymentData.order_id = donationDetails._id;
                            paymentData.payment_method = "Telr";
                            paymentData.payment_details = telrData;
                            paymentDetails.create(paymentData, function(err, response) { });
                            // Paid
                            if(telrData.status.text === 'Paid') {
                                // update donation status
                                donationList.findByIdAndUpdate(donationDetails._id,
                                { $set: { payment_success: true, "payment_details.payment_id": telrData.transaction.ref, status: "active" } }, function(err, response) {
                                    if(!err && response)
                                    {
                                        // send mail
                                        mailService.sendDonationMail(null, donationDetails._id);
                                        // redirect to user application
                                        res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                        res.end();
                                    }
                                    else {
                                        // update order status failure
                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                        res.end();
                                    }
                                });
                            }
                            else {
                                // if order status != success
                                res.writeHead(301, {Location: failureCallback+"?response=Payment "+telrData.status.text});
                                res.end();
                            }
                        })
                        .catch((errMsg) => {
                            // telr error
                            res.writeHead(301, {Location: failureCallback+"?response="+errMsg});
                            res.end();
                        });
                    }
                }
                else {
                    // invalid payment method
                    res.send('Invalid Payment Method');
                }
            }
            else {
                // invalid order
                res.send('Invalid Order');
            }
        });
    }
    else {
        res.send('Invalid Order Type');
    }
}

function checkTelrStatus(config, refNum) {
    return new Promise((resolve, reject) => {
        let payFormData = {
            'ivp_method': 'check', 'ivp_store': config.ivp_store,
            'ivp_authkey': config.key, 'order_ref': refNum 
        }
        let options = {
            'method': 'POST', 'url': 'https://secure.telr.com/gateway/order.json',
            'headers': {}, formData: payFormData, json: true
        };
        request(options, function(err, response) {
            let respData = response.body;
            if(!err && respData) {
                if(!respData.error) {
                    if(respData.order) { resolve(respData.order); }
                    else { reject('Invalid payment data'); }
                }                   
                else { reject(respData.error.message); }
            }
            else { reject('Payment status error'); }
        });
    });
}
/** ### TELR ### **/

/** FOLOOSI **/
exports.foloosi_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Foloosi');
            if(paymentMethod.length && req.query.transaction_id)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                let options = {
                    method: 'GET', url: "http://foloosi.com/api/v1/api/transaction-detail/"+req.query.transaction_id,
                    headers: { Accept: 'application/json', secret_key: paymentMethod[0].config.secret_key, 'Content-Type': 'application/json' }
                };
                request(options, function (err, response, body) {
                    if(!err && response.body) {
                        let foloosiData = JSON.parse(response.body);
                        if(foloosiData.data) {
                            let orderType = foloosiData.data.optional1;
                            let orderId = foloosiData.data.optional2;
                            let paymentOrderId = foloosiData.data.transaction_no;
                            let paymentId = foloosiData.data.payment_transaction_id;
                            // payment details
                            let paymentData = {};
                            paymentData.store_id = storeDetails._id;
                            paymentData.order_id = orderId;
                            paymentData.payment_method = "Foloosi";
                            paymentData.payment_details = foloosiData.data;
                            // payment status
                            if(foloosiData.data.status == 'success') {
                                // for product
                                if(orderType=='product') {
                                    orderList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let orderDetails = response;
                                            if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                            if(orderDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // clear customer cart
                                                if(!orderDetails.buy_now) {
                                                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                                }
                                                // clear guest user cart
                                                if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                    guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                                }
                                                // invoice number
                                                let invoiceNum = "";
                                                if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                                }
                                                validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                                    // update order status
                                                    orderList.findByIdAndUpdate(orderDetails._id,
                                                    { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.order_id": paymentOrderId, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                        if(!err && response)
                                                        {
                                                            // update next invoice no
                                                            if(storeDetails.invoice_status) {
                                                                let incCount = 1;
                                                                if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                            // redirect to user application
                                                            res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                            res.end();
                                                        }
                                                        else {
                                                            // update order status failure
                                                            res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                            res.end();
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                // for giftcard
                                else if(orderType=='giftcard') {
                                    couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let couponDetails = response;
                                            // invoice number
                                            let invoiceNum = "";
                                            if(storeDetails.invoice_status) {
                                                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                            }
                                            if(couponDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // update coupon status
                                                couponCodes.findByIdAndUpdate(couponDetails._id,
                                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.order_id": paymentOrderId, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // update next invoice no
                                                        if(invoiceNum) {
                                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                        }
                                                        // send mail
                                                        mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                // for donation
                                else if(orderType=='donation') {
                                    donationList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let donationDetails = response;
                                            if(donationDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // update donation status
                                                donationList.findByIdAndUpdate(donationDetails._id,
                                                { $set: { payment_success: true, "payment_details.order_id": paymentOrderId, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // send mail
                                                        mailService.sendDonationMail(null, donationDetails._id);
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=donation&order_id="+donationDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                else {
                                    // if invalid order type
                                    res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                    res.end();
                                }
                            }
                            else {
                                paymentDetails.create(paymentData, function(err, response) { });
                                // if order status != success
                                res.writeHead(301, {Location: failureCallback+"?response=Payment "+foloosiData.data.status});
                                res.end();
                            }
                        }
                        else {
                            res.writeHead(301, {Location: failureCallback+"?response="+foloosiData.message});
                            res.end();
                        }
                    }
                    else {
                        res.writeHead(301, {Location: failureCallback+"?response=Payment fetch error"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid payment method or paymentId missing');
            }
        }
        else {
            // invalid store
            res.send('Invalid Store');
        }
    });
}
/** ### FOLOOSI ### **/

/** FLUTTER WAVE **/
exports.fw_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Flutterwave');
            if(paymentMethod.length && req.query.transaction_id)
            {
                let successCallback = storeDetails.base_url+"/checkout/order-summary";
                let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                let options = {
                    method: 'GET', url: "https://api.flutterwave.com/v3/transactions/"+req.query.transaction_id+"/verify",
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+paymentMethod[0].config.token },
                    json: true
                };
                request(options, function (err, response, body)
                {
                    if(!err && response.statusCode == 200) {
                        let orderData = body.data;
                        let paymentId = orderData.id;
                        let orderType = orderData.meta.order_type;
                        let orderId = orderData.meta.order_id;
                        // payment details
                        let paymentData = {};
                        paymentData.store_id = storeDetails._id;
                        paymentData.order_id = orderId;
                        paymentData.payment_method = paymentMethod[0].name;
                        paymentData.payment_details = orderData;
                        // COMPLETED
                        if(orderData.status === 'successful') {
                            // for product
                            if(orderType=='product') {
                                orderList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let orderDetails = response;
                                        if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                        if(orderDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // clear customer cart
                                            if(!orderDetails.buy_now) {
                                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                            }
                                            // clear guest user cart
                                            if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                            }
                                            // invoice number
                                            let invoiceNum = "";
                                            if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                            }
                                            validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                                // update order status
                                                orderList.findByIdAndUpdate(orderDetails._id,
                                                { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // ERP
                                                        let erpDetails = storeDetails.erp_details;
                                                        if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                            if(orderDetails.order_by=='user') {
                                                                customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                                                    if(!err && response) {
                                                                        orderDetails.customer_email = response.email;
                                                                        let erpData = {
                                                                            erp_config: erpDetails.config,
                                                                            store_id: storeDetails._id, event_type: 'place_order',
                                                                            user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                        }
                                                                        erpService.ambar(erpData);
                                                                    }
                                                                });
                                                            }
                                                            else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                                orderDetails.customer_email = orderDetails.guest_email;
                                                                let erpData = {
                                                                    erp_config: erpDetails.config,
                                                                    store_id: storeDetails._id, event_type: 'place_order',
                                                                    user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                }
                                                                erpService.ambar(erpData);
                                                            }
                                                        }
                                                        // update next invoice no
                                                        if(storeDetails.invoice_status) {
                                                            let incCount = 1;
                                                            if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            // for giftcard
                            else if(orderType=='giftcard') {
                                couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let couponDetails = response;
                                        // invoice number
                                        let invoiceNum = "";
                                        if(storeDetails.invoice_status) {
                                            invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                        }
                                        if(couponDetails.status=='active') {
                                            // redirect to user application
                                            res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                            res.end();
                                        }
                                        else {
                                            paymentDetails.create(paymentData, function(err, response) { });
                                            // update coupon status
                                            couponCodes.findByIdAndUpdate(couponDetails._id,
                                            { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                if(!err && response)
                                                {
                                                    // update next invoice no
                                                    if(invoiceNum) {
                                                        store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                    }
                                                    // send mail
                                                    mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                    // redirect to user application
                                                    res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                    res.end();
                                                }
                                                else {
                                                    // update order status failure
                                                    res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                    res.end();
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                        res.end();
                                    }
                                });
                            }
                            else {
                                // if invalid order type
                                res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                res.end();
                            }
                        }
                        else {
                            paymentDetails.create(paymentData, function(err, response) { });
                            // if order status != success
                            res.writeHead(301, {Location: failureCallback+"?response=Payment "+orderData.status});
                            res.end();
                        }
                    }
                    else {
                        // if payment failed
                        res.writeHead(301, {Location: failureCallback+"?response=Payment Failed"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid payment method or paymentId missing');
            }
        }
        else {
            // invalid store
            res.send('Invalid Store');
        }
    });
}
/** ### FLUTTER WAVE ### **/

/** BILLBOX **/
exports.billbox_payment_status = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Billbox');
            if(paymentMethod.length && req.query.cust_ref) {
                if(req.query.transac_id)
                {
                    let successCallback = storeDetails.base_url+"/checkout/order-summary";
                    let failureCallback = storeDetails.base_url+"/checkout/payment-failure";
                    let payConfig = paymentMethod[0].config;
                    let reqUrl = "https://bbposapi.doersops.com/webpos/checkPaymentStatus";
                    if(paymentMethod[0].mode=="production") {
                        reqUrl = "https://posapi.usebillbox.com/webpos/checkPaymentStatus";
                    }
                    let jsonData = {
                        requestId: req.query.cust_ref, appReference: payConfig.app_ref,
                        secret: payConfig.secret, transactionId: req.query.transac_id
                    };
                    let reqOptions = {
                        method: 'POST', url: reqUrl,
                        headers: { 'Content-Type': 'application/json', 'appId': payConfig.app_id },
                        body: jsonData, json: true
                    };
                    request(reqOptions, function (err, response, body)
                    {
                        if(!err && response.statusCode == 200) {
                            let orderData = body.result;
                            let paymentId = orderData.orderId;
                            let orderType = orderData.orderId.split("-")[1];
                            let orderId = orderData.orderId.split("-")[0];
                            // payment details
                            let paymentData = {};
                            paymentData.store_id = storeDetails._id;
                            paymentData.order_id = orderId;
                            paymentData.payment_method = paymentMethod[0].name;
                            paymentData.payment_details = orderData;
                            // COMPLETED
                            if(orderData.status === 'CONFIRMED') {
                                // for product
                                if(orderType=='product') {
                                    orderList.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let orderDetails = response;
                                            if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
                                            if(orderDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // clear customer cart
                                                if(!orderDetails.buy_now) {
                                                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                                                }
                                                // clear guest user cart
                                                if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                    guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
                                                }
                                                // invoice number
                                                let invoiceNum = "";
                                                if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                                                    invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                                }
                                                validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                                                    // update order status
                                                    orderList.findByIdAndUpdate(orderDetails._id,
                                                    { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                        if(!err && response)
                                                        {
                                                            // ERP
                                                            let erpDetails = storeDetails.erp_details;
                                                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                                if(orderDetails.order_by=='user') {
                                                                    customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                                                        if(!err && response) {
                                                                            orderDetails.customer_email = response.email;
                                                                            let erpData = {
                                                                                erp_config: erpDetails.config,
                                                                                store_id: storeDetails._id, event_type: 'place_order',
                                                                                user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                            }
                                                                            erpService.ambar(erpData);
                                                                        }
                                                                    });
                                                                }
                                                                else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                                                    orderDetails.customer_email = orderDetails.guest_email;
                                                                    let erpData = {
                                                                        erp_config: erpDetails.config,
                                                                        store_id: storeDetails._id, event_type: 'place_order',
                                                                        user_agent: req.get('User-Agent'), order_details: orderDetails
                                                                    }
                                                                    erpService.ambar(erpData);
                                                                }
                                                            }
                                                            // update next invoice no
                                                            if(storeDetails.invoice_status) {
                                                                let incCount = 1;
                                                                if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                                                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
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
                                                            // redirect to user application
                                                            res.writeHead(301, {Location: successCallback+"?type=product&order_id="+orderDetails._id});
                                                            res.end();
                                                        }
                                                        else {
                                                            // update order status failure
                                                            res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                            res.end();
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                // for giftcard
                                else if(orderType=='giftcard') {
                                    couponCodes.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                        if(!err && response) {
                                            let couponDetails = response;
                                            // invoice number
                                            let invoiceNum = "";
                                            if(storeDetails.invoice_status) {
                                                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
                                            }
                                            if(couponDetails.status=='active') {
                                                // redirect to user application
                                                res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                res.end();
                                            }
                                            else {
                                                paymentDetails.create(paymentData, function(err, response) { });
                                                // update coupon status
                                                couponCodes.findByIdAndUpdate(couponDetails._id,
                                                { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        // update next invoice no
                                                        if(invoiceNum) {
                                                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                        }
                                                        // send mail
                                                        mailService.sendGiftCardPurchaseMail(couponDetails._id);
                                                        // redirect to user application
                                                        res.writeHead(301, {Location: successCallback+"?type=giftcard&order_id="+couponDetails._id});
                                                        res.end();
                                                    }
                                                    else {
                                                        // update order status failure
                                                        res.writeHead(301, {Location: failureCallback+"?response=Order Update Failure"});
                                                        res.end();
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            // if invalid order
                                            res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                            res.end();
                                        }
                                    });
                                }
                                else {
                                    // if invalid order type
                                    res.writeHead(301, {Location: failureCallback+"?response=Invalid Order"});
                                    res.end();
                                }
                            }
                            else {
                                paymentDetails.create(paymentData, function(err, response) { });
                                // if order status != success
                                res.writeHead(301, {Location: failureCallback+"?response=Payment "+orderData.status});
                                res.end();
                            }
                        }
                        else {
                            // if payment failed
                            res.writeHead(301, {Location: failureCallback+"?response=Payment Failed"});
                            res.end();
                        }
                    });
                }
                else {
                    res.writeHead(301, {Location: storeDetails.base_url});
                    res.end();
                }
            }
            else {
                // invalid payment method
                res.send('Invalid payment method or paymentId missing');
            }
        }
        else {
            // invalid store
            res.send('Invalid Store');
        }
    });
}
/** ### BILLBOX ### **/

/** Gpay or Bank Transfer **/
exports.update_order_payment = (req, res) => {
    orderList.aggregate([
        { $match : {
            _id: mongoose.Types.ObjectId(req.body.order_id), store_id: mongoose.Types.ObjectId(req.query.store_id),
            status: "inactive", $or: [
                { "payment_details.name": 'Gpay' },
                { "payment_details.name": 'Bank Payment' }
            ]
        } },
        { $lookup:
            {
               from: 'stores',
               localField: 'store_id',
               foreignField: '_id',
               as: 'storeDetails'
            }
        }
    ], function(err, response) {
        if(!err && response[0]) {
            let orderDetails = response[0];
            if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
            let storeDetails = orderDetails.storeDetails[0];
            // clear customer cart
            if(!orderDetails.buy_now) {
                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
            }
            // clear guest user cart
            if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
            }
            // invoice number
            let invoiceNum = "";
            if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
            }
            validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                // update order status
                orderList.findByIdAndUpdate(orderDetails._id,
                { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: false, "payment_details.payment_id": req.body.payment_id, status: "active" } }, function(err, response) {
                    if(!err && response)
                    {
                        // ERP
                        let erpDetails = storeDetails.erp_details;
                        if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                            if(orderDetails.order_by=='user') {
                                customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                    if(!err && response) {
                                        orderDetails.customer_email = response.email;
                                        let erpData = {
                                            erp_config: erpDetails.config,
                                            store_id: storeDetails._id, event_type: 'place_order',
                                            user_agent: req.get('User-Agent'), order_details: orderDetails
                                        }
                                        erpService.ambar(erpData);
                                    }
                                });
                            }
                            else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                orderDetails.customer_email = orderDetails.guest_email;
                                let erpData = {
                                    erp_config: erpDetails.config,
                                    store_id: storeDetails._id, event_type: 'place_order',
                                    user_agent: req.get('User-Agent'), order_details: orderDetails
                                }
                                erpService.ambar(erpData);
                            }
                        }
                        // update next invoice no
                        if(storeDetails.invoice_status) {
                            let incCount = 1;
                            if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
                        }
                        // decrease product stock
                        stockService.decProductStock(orderDetails.item_list);
                        // decrease coupon balance
                        if(orderDetails.coupon_list.length) { stockService.updateCouponBalance(orderDetails); }
                        // update offer redeem count
                        if(orderDetails.offer_details) { stockService.incOfferRedeemCount(orderDetails.offer_details); }
                        // order placed mail
                        mailService.sendOrderReceivedMail(null, orderDetails._id);
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, message: 'Order Update Failure' }); }
                });
            });
        }
        else { res.json({ status: false, message: 'Invalid Order' }); }
    });
}
/** ### Gpay or Bank Transfer ### **/