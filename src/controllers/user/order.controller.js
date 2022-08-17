"use strict";
const mongoose = require('mongoose');
const request = require('request');
const urlencode = require('urlencode');
const customer = require("../../models/customer.model");
const orderList = require("../../models/order_list.model");
const offer = require("../../models/offer_codes.model");
const store = require("../../models/store.model");
const shipping = require("../../models/shipping_methods.model");
const currencyList = require("../../models/currency_list.model");
const orderSession = require("../../models/order_session.model");
const mailService = require("../../../services/mail.service");
const createPayment = require("../../../services/create_payment.service");
const commonService = require("../../../services/common.service");
const stockService = require("../../../services/stock.service");
const erpService = require("../../../services/erp.service");
const validationService = require("../../../services/validation.service");

// create order(v1) without payment
exports.create_order_wo_payment = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), version: 1 }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
                if(!err && response)
                {
                    let customerDetails = response;
                    req.body.customer_id = req.id;
                    req.body.customer_name = customerDetails.name;
                    req.body.order_number = commonService.orderNumber();
                    if(customerDetails.unique_id) {
                        req.body.order_number = req.body.order_number+'-'+customerDetails.unique_id;
                    }
                    req.body.status = "active";
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
                            // clear customer cart
                            if(!orderDetails.buy_now) {
                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
                            }
                            // unset checkout details
                            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.customer_id) },
                            { $unset: { checkout_details: "", cod_otp: "", cod_otp_request_on: "" } }, function(err, response) { });
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
                else { res.json({ status: false, message: "Invalid user" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });    
}

// v1 order
exports.create_order = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), version: 1 }, function(err, response) {
        if(!err && response)
        {
            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, { $unset: { checkout_details: "" } }, function(err, response) {
                if(!err && response)
                {
                    let customerDetails = response;
                    // hold product
                    stockService.holdProductAndCoupon(req.body.unique_product_list, req.body.coupon_list).then(() => {
                        // if hold selected products
                        req.body.customer_id = req.id;
                        req.body.customer_name = customerDetails.name;
                        req.body.order_number = commonService.orderNumber();
                        if(customerDetails.unique_id) {
                            req.body.order_number = req.body.order_number+'-'+customerDetails.unique_id;
                        }
                        orderList.create(req.body, function(err, response) {
                            if(!err && response)
                            {
                                let orderDetails = response;
                                orderDetails.customer_email = customerDetails.email;
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
                                else if(orderDetails.payment_details.name=="Gpay" || orderDetails.payment_details.name=="Bank Payment")
                                {
                                    let sendData = {
                                        order_id: orderDetails._id,
                                        order_number: orderDetails.order_number,
                                        currency: orderDetails.currency_type.country_code,
                                        amount: Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))
                                    };
                                    res.json({ status: true, data: sendData });
                                }
                                else { res.json({ status: false, message: "Invalid payment method" }); }
                            }
                            else { res.json({ status: false, error: err, message: "Unable to place order" }); }
                        });
                    });
                }
                else { res.json({ status: false, message: "Invalid user" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

// for v2 order
exports.pickup_details = (req, res) => {
    if(req.body.sid) {
        customer.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.id), status: 'active' } },
            {
                $lookup: {
                    from: "store_permissions",
                    localField: "store_id",
                    foreignField: "store_id",
                    as: "storeProperties"
                }
            }
        ], function(err, response) {
            if(!err && response[0])
            {
                let customerDetails = response[0];
                let storeProperties = customerDetails.storeProperties[0];
                let qtyInfo = storeProperties.application_setting.min_qty;
                req.body.item_list = req.body.item_list.filter(el => el.quantity >= qtyInfo[el.unit]);
                if(req.body.item_list.length) {
                    req.body.store_id = customerDetails.store_id;
                    req.body.session_id = req.body.sid+'-'+customerDetails._id;
                    req.body.order_type = 'pickup';
                    // shipping method
                    if(!req.body.shipping_method) { req.body.shipping_method = {}; }
                    req.body.shipping_method._id = req.body.store_id;
                    req.body.shipping_method.delivery_method = true;
                    req.body.shipping_method.shipping_price = 0;
                    if(!req.body.quick_order_id) { req.body.quick_order_id = null; }
                    orderSession.findOne({ store_id: req.body.store_id, session_id: req.body.session_id, status: "active" }, function(err, response) {
                        if(!err && response) {
                            req.body.updated_on = new Date();
                            orderSession.findByIdAndUpdate(response._id, { $set: req.body }, { new: true }, function(err, response) {
                                if(!err && response) {
                                    res.json({ status: true, data: response });
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Unable to create session" });
                                }
                            });
                        }
                        else {
                            orderSession.create(req.body, function(err, response) {
                                if(!err && response) {
                                    res.json({ status: true, data: response });
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Unable to create session" });
                                }
                            });
                        }
                    });
                }
                else { res.json({ status: false, message: "No valid items found" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid user" }); }
        });
    }
    else { res.json({ status: false, message: "Session ID missing" }); }
}

exports.delivery_details = (req, res) => {
    if(req.body.sid) {
        customer.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.id), status: 'active' } },
            {
                $lookup: {
                    from: "store_permissions",
                    localField: "store_id",
                    foreignField: "store_id",
                    as: "storeProperties"
                }
            }
        ], function(err, response) {
            if(!err && response[0])
            {
                let customerDetails = response[0];
                let storeProperties = customerDetails.storeProperties[0];
                let qtyInfo = storeProperties.application_setting.min_qty;
                req.body.item_list = req.body.item_list.filter(el => el.quantity >= qtyInfo[el.unit]);
                if(req.body.item_list.length) {
                    req.body.store_id = customerDetails.store_id;
                    req.body.session_id = req.body.sid+'-'+customerDetails._id;
                    req.body.order_type = 'delivery';
                    // shipping method
                    if(!req.body.shipping_method) { req.body.shipping_method = {}; }
                    req.body.shipping_method.delivery_method = true;
                    if(!req.body.quick_order_id) { req.body.quick_order_id = null; }
                    orderSession.findOne({ store_id: req.body.store_id, session_id: req.body.session_id, status: "active" }, function(err, response) {
                        if(!err && response) {
                            req.body.updated_on = new Date();
                            orderSession.findByIdAndUpdate(response._id, { $set: req.body }, { new: true }, function(err, response) {
                                if(!err && response) {
                                    res.json({ status: true, data: response });
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Unable to create session" });
                                }
                            });
                        }
                        else {
                            orderSession.create(req.body, function(err, response) {
                                if(!err && response) {
                                    res.json({ status: true, data: response });
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Unable to create session" });
                                }
                            });
                        }
                    });
                }
                else { res.json({ status: false, message: "No valid items found" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid user" }); }
        });
    }
    else { res.json({ status: false, message: "Session ID missing" }); }
}

exports.shipping_details = (req, res) => {
    if(req.body.sid) {
        customer.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.id), status: 'active' } },
            {
                $lookup: {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "storeDetails"
                }
            },
            {
                $lookup: {
                    from: "store_permissions",
                    localField: "store_id",
                    foreignField: "store_id",
                    as: "storeProperties"
                }
            }
        ], function(err, response) {
            if(!err && response[0])
            {
                let customerDetails = response[0];
                let sessionId = req.body.sid+'-'+customerDetails._id;
                let storeDetails = customerDetails.storeDetails[0];
                let storeProperties = customerDetails.storeProperties[0];
                let checkoutSetting = storeProperties.checkout_setting;
                let qtyInfo = storeProperties.application_setting.min_qty;
                req.body.item_list = req.body.item_list.filter(el => el.quantity >= qtyInfo[el.unit]);
                if(req.body.item_list.length) {
                    let currencyDetails = storeDetails.currency_types.filter(obj => obj.country_code==req.body.currency_type)[0];
                    let addrIndex = customerDetails.address_list.findIndex(obj =>obj._id==req.body.shipping_address);
                    if(addrIndex!=-1) {
                        let shippingAddress = customerDetails.address_list[addrIndex];
                        let shippingType = 'Domestic';
                        if(shippingAddress.country!=storeDetails.country) { shippingType = 'International'; }
                        let queryParams = { store_id: mongoose.Types.ObjectId(req.body.store_id), shipping_type: shippingType, status: "active" };
                        if(req.body.shipping_id) {
                            queryParams = { _id: mongoose.Types.ObjectId(req.body.shipping_id), store_id: mongoose.Types.ObjectId(req.body.store_id), status: "active" };
                        }
                        shipping.find(queryParams, function(err, response) {
                            if(!err && response.length) {
                                let shippingMethodList = response;
                                let vIndex = req.body.item_list.findIndex(obj => obj.vendor_id);
                                if(shippingMethodList.length===1 || vIndex!=-1) {
                                    let shippingMethod = shippingMethodList[0];
                                    let modelList = customerDetails.model_list;
                                    orderSession.findOne({ store_id: storeDetails._id, session_id: sessionId, status: "active" }, function(err, response) {
                                        if(!err && response) {
                                            if(!storeDetails.additional_features.custom_model) { modelList = response.model_list; }
                                        }
                                        validationService.findCartSubTotal(storeDetails._id, currencyDetails, modelList, req.body.item_list, checkoutSetting).then((respData) => {
                                            if(respData.item_list.length) {
                                                if(respData.vendor_list.length) {
                                                    validationService.getVendorShippingPrice(respData.vendor_list, shippingMethodList, shippingAddress, currencyDetails).then((respInfo) => {
                                                        let sessionData = {
                                                            store_id: storeDetails._id, vendor_list: respInfo.vendor_list, session_id: sessionId, order_type: 'delivery', currency_type: req.body.currency_type,
                                                            item_list: req.body.item_list, shipping_method: respInfo.shipping_info, shipping_address: req.body.shipping_address, quick_order_id: null
                                                        };
                                                        if(req.body.quick_order_id) { sessionData.quick_order_id = req.body.quick_order_id; }
                                                        orderSession.findOne({ store_id: sessionData.store_id, session_id: sessionData.session_id, status: "active" }, function(err, response) {
                                                            if(!err && response) {
                                                                sessionData.updated_on = new Date();
                                                                orderSession.findByIdAndUpdate(response._id, { $set: sessionData }, { new: true }, function(err, response) {
                                                                    if(!err && response) { res.json({ status: true, data: response }); }
                                                                    else { res.json({ status: false, error: err, message: "Unable to create session" }); }
                                                                });
                                                            }
                                                            else {
                                                                orderSession.create(sessionData, function(err, response) {
                                                                    if(!err && response) { res.json({ status: true, data: response }); }
                                                                    else { res.json({ status: false, error: err, message: "Unable to create session" }); }
                                                                });
                                                            }
                                                        });
                                                    }).catch((errorMsg) => {
                                                        res.json({ status: false, message: errorMsg });
                                                    });
                                                }
                                                else {
                                                    validationService.getShippingPrice(shippingMethod, shippingAddress, respData.cart_weight, respData.sub_total).then((shippingData) => {
                                                        shippingData.shipping_price = commonService.CALC_AC(currencyDetails, shippingData.shipping_price);
                                                        let sessionData = {
                                                            store_id: storeDetails._id, vendor_list: respData.vendor_list, session_id: sessionId, order_type: 'delivery', currency_type: req.body.currency_type,
                                                            item_list: req.body.item_list, shipping_method: shippingData, shipping_address: req.body.shipping_address, quick_order_id: null
                                                        };
                                                        if(req.body.quick_order_id) { sessionData.quick_order_id = req.body.quick_order_id; }
                                                        orderSession.findOne({ store_id: sessionData.store_id, session_id: sessionData.session_id, status: "active" }, function(err, response) {
                                                            if(!err && response) {
                                                                sessionData.updated_on = new Date();
                                                                orderSession.findByIdAndUpdate(response._id, { $set: sessionData }, { new: true }, function(err, response) {
                                                                    if(!err && response) { res.json({ status: true, data: response }); }
                                                                    else { res.json({ status: false, error: err, message: "Unable to create session" }); }
                                                                });
                                                            }
                                                            else {
                                                                orderSession.create(sessionData, function(err, response) {
                                                                    if(!err && response) { res.json({ status: true, data: response }); }
                                                                    else { res.json({ status: false, error: err, message: "Unable to create session" }); }
                                                                });
                                                            }
                                                        });
                                                    }).catch((errorMsg) => {
                                                        res.json({ status: false, message: errorMsg });
                                                    });
                                                }
                                            }
                                            else { res.json({ status: false, message: "No valid items found" }); }
                                        });
                                    });
                                }
                                else { res.json({ status: false, message: "Multiple shipping exists" }); }
                            }
                            else { res.json({ status: false, error: err, message: "Shipping method doesn't exists" }); }
                        });
                    }
                    else { res.json({ status: false, message: "Address doesn't exists" }); }
                }
                else { res.json({ status: false, message: "No valid items found" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid user" }); }
        });
    }
    else { res.json({ status: false, message: "Session ID missing" }); }
}

exports.checkout_details = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            let storeId = customerDetails.store_id;
            let sessionId = req.query.sid+'-'+customerDetails._id;
            orderSession.findOne({ store_id: storeId, session_id: sessionId, status: "active" }, function(err, response) {
                if(!err && response) {
                    let orderSessionData = response;
                    getShippingInfo(orderSessionData).then((shippingData) => {
                        store.aggregate([
                            { $match: { _id: mongoose.Types.ObjectId(storeId), status: 'active' } },
                            {
                                $lookup: {
                                    from: "store_permissions",
                                    localField: "_id",
                                    foreignField: "store_id",
                                    as: "storeProperties"
                                }
                            }
                        ], function(err, response) {
                            if(!err && response[0])
                            {
                                let storeDetails = response[0];
                                let storeProperties = storeDetails.storeProperties[0];
                                let checkoutSetting = storeProperties.checkout_setting;
                                let currencyDetails = storeDetails.currency_types.filter(obj => obj.country_code==orderSessionData.currency_type)[0];
                                // quick order details
                                validationService.getQuickOrderDetails(storeDetails._id, orderSessionData).then((qoData) => {
                                    // shipping address
                                    let shippingAddress = "";
                                    if(orderSessionData.order_type=='pickup') {
                                        let addrIndex = storeProperties.branches.findIndex(obj =>obj._id==orderSessionData.shipping_address);
                                        if(addrIndex!=-1) { shippingAddress = storeProperties.branches[addrIndex]; }
                                    }
                                    else {
                                        let addrIndex = customerDetails.address_list.findIndex(obj =>obj._id==orderSessionData.shipping_address);
                                        if(addrIndex!=-1) { shippingAddress = customerDetails.address_list[addrIndex]; }
                                    }
                                    if(shippingAddress!='') {
                                        let modelList = customerDetails.model_list;
                                        if(!storeDetails.additional_features.custom_model) { modelList = orderSessionData.model_list; }
                                        validationService.findCartSubTotal(storeDetails._id, currencyDetails, modelList, orderSessionData.item_list, checkoutSetting).then((respData) => {
                                            respData.shipping_address = shippingAddress;
                                            respData.customer_name = customerDetails.name;
                                            respData.customer_email = customerDetails.email;
                                            if(customerDetails.dial_code) { respData.customer_dial_code = customerDetails.dial_code; }
                                            if(customerDetails.mobile) { respData.customer_mobile = customerDetails.mobile; }
                                            // packaging charges
                                            respData.packaging_charges = 0;
                                            if(storeDetails.packaging_charges && storeDetails.packaging_charges.value>0) {
                                                let packConfig = storeDetails.packaging_charges;
                                                if(packConfig.type=='percentage') {
                                                    respData.packaging_charges = Math.ceil(respData.selling_sub_total*(packConfig.value/100));
                                                    if(packConfig.min_package_amt > respData.packaging_charges) { respData.packaging_charges = packConfig.min_package_amt; }
                                                }
                                                else { respData.packaging_charges = commonService.CALC_AC(currencyDetails, packConfig.value); }
                                            }
                                            // billing address
                                            let addrIndex = customerDetails.address_list.findIndex(obj => obj.billing_address);
                                            if(addrIndex!=-1) { respData.billing_address = customerDetails.address_list[addrIndex]; }
                                            // quick order discount
                                            respData.manual_discount = 0;
                                            if(qoData) {
                                                respData.quick_order_id = qoData._id;
                                                if(qoData.disc_status && qoData.disc_config) {
                                                    let discConfig = qoData.disc_config;
                                                    if(discConfig.type=='amount') { respData.manual_discount = discConfig.value; }
                                                    else { respData.manual_discount = parseFloat((respData.sub_total*(discConfig.value/100)).toFixed(2)); }
                                                    if(respData.manual_discount > respData.sub_total) { respData.manual_discount = respData.sub_total; }
                                                }
                                            }
                                            respData.shipping_method = orderSessionData.shipping_method;
                                            respData.currency_type = orderSessionData.currency_type;
                                            respData.order_type = orderSessionData.order_type;
                                            respData.buy_now = orderSessionData.buy_now;
                                            respData.sm_details = shippingData;
                                            res.json({ status: true,  data: respData });
                                        });
                                    }
                                    else { res.json({ status: false, message: "Address doesn't exists" }); }
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Invalid Store" }); }
                        });
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid session" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

function getShippingInfo(orderSessionData) {
    return new Promise((resolve, reject) => {
        if(!orderSessionData.vendor_list.length && !orderSessionData.shipping_method.delivery_method) {
            shipping.findOne({ store_id: mongoose.Types.ObjectId(orderSessionData.store_id), _id: mongoose.Types.ObjectId(orderSessionData.shipping_method._id), status: "active" }, function(err, response) {
                let respData = {};
                if(!err && response) { respData = response; }
                resolve(respData);
            });
        }
        else resolve({});
    });
}

exports.calc_discount = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            let sessionId = req.body.sid+'-'+customerDetails._id;
            orderSession.findOne({ store_id: customerDetails.store_id, session_id: sessionId, status: "active" }, function(err, response) {
                if(!err && response) {
                    let orderSessionData = response;
                    req.body.shipping_address = orderSessionData.shipping_address;
                    req.body.currency_type = orderSessionData.currency_type;
                    req.body.item_list = orderSessionData.item_list;
                    req.body.shipping_method = orderSessionData.shipping_method;
                    if(req.body.coupon_list.length || req.body.offer_code) {
                        store.aggregate([
                            { $match: { _id: mongoose.Types.ObjectId(req.body.store_id), status: 'active' } },
                            {
                                $lookup: {
                                    from: "store_permissions",
                                    localField: "_id",
                                    foreignField: "store_id",
                                    as: "storeProperties"
                                }
                            }
                        ], function(err, response) {
                            if(!err && response[0])
                            {
                                let storeDetails = response[0];
                                let storeProperties = storeDetails.storeProperties[0];
                                let appSetting = storeProperties.application_setting;
                                let checkoutSetting = storeProperties.checkout_setting;
                                let currencyDetails = storeDetails.currency_types.filter(obj => obj.country_code==req.body.currency_type)[0];
                                // quick order details
                                validationService.getQuickOrderDetails(storeDetails._id, orderSessionData).then((qoData) => {
                                    // shipping address
                                    let shippingAddress = "";
                                    if(req.body.order_type=='pickup') {
                                        let addrIndex = storeProperties.branches.findIndex(obj =>obj._id==req.body.shipping_address);
                                        if(addrIndex!=-1) { shippingAddress = storeProperties.branches[addrIndex]; }
                                    }
                                    else {
                                        let addrIndex = customerDetails.address_list.findIndex(obj =>obj._id==req.body.shipping_address);
                                        if(addrIndex!=-1) { shippingAddress = customerDetails.address_list[addrIndex]; }
                                    }
                                    if(shippingAddress!="") {
                                        let modelList = customerDetails.model_list;
                                        if(!storeDetails.additional_features.custom_model) { modelList = orderSessionData.model_list; }
                                        validationService.findCartSubTotal(storeDetails._id, currencyDetails, modelList, req.body.item_list, checkoutSetting).then((respData) => {
                                            if(respData.item_list.length) {
                                                let orderData = {
                                                    store_id: storeDetails._id, item_list: respData.item_list, gift_wrapper: 0, packaging_charges: 0
                                                };
                                                // gift wrapper
                                                if(req.body.gift_status) {
                                                    orderData.gift_status = true;
                                                    if(appSetting.gift_wrapping_charges>0) {
                                                        orderData.gift_wrapper = commonService.CALC_AC(currencyDetails, appSetting.gift_wrapping_charges);
                                                    }
                                                }
                                                // packaging charges
                                                if(storeDetails.packaging_charges && storeDetails.packaging_charges.value>0) {
                                                    let packConfig = storeDetails.packaging_charges;
                                                    if(packConfig.type=='percentage') {
                                                        orderData.packaging_charges = Math.ceil(respData.selling_sub_total*(packConfig.value/100));
                                                        if(packConfig.min_package_amt > orderData.packaging_charges) { orderData.packaging_charges = packConfig.min_package_amt; }
                                                    }
                                                    else { orderData.packaging_charges = commonService.CALC_AC(currencyDetails, packConfig.value); }
                                                }
                                                // calc
                                                orderData.sub_total = respData.sub_total;
                                                orderData.shipping_method = req.body.shipping_method;
                                                orderData.shipping_cost = orderData.shipping_method.shipping_price;
                                                orderData.discount_amount = 0;
                                                orderData.grand_total = parseFloat(orderData.sub_total)+parseFloat(orderData.shipping_cost)+parseFloat(orderData.gift_wrapper)+parseFloat(orderData.packaging_charges);
                                                // quick order discount
                                                if(qoData && qoData.disc_status && qoData.disc_config) {
                                                    let discConfig = qoData.disc_config;
                                                    if(discConfig.type=='amount') { orderData.discount_amount = discConfig.value; }
                                                    else { orderData.discount_amount = parseFloat((orderData.sub_total*(discConfig.value/100)).toFixed(2)); }
                                                    if(orderData.discount_amount > orderData.sub_total) { orderData.discount_amount = orderData.sub_total; }
                                                }
                                                // offer code
                                                if(req.body.offer_code)
                                                {
                                                    let shippingType = 'international';
                                                    if(storeDetails.country==shippingAddress.country) { shippingType = 'domestic'; }
                                                    getOfferCodeDetails(storeDetails._id, customerDetails._id, req.body.offer_code).then((respOfferData) => {
                                                        if(respOfferData.status) {
                                                            let codeData = {
                                                                code_details: respOfferData.data, checkout_setting: checkoutSetting, shipping_type: shippingType, 
                                                                item_list: orderData.item_list, shipping_cost: orderData.shipping_cost, cart_qty: respData.cart_qty,
                                                                wo_disc_sub_total: (respData.wo_disc_sub_total*1)-(orderData.discount_amount*1)
                                                            }
                                                            if(codeData.wo_disc_sub_total<0) { codeData.wo_disc_sub_total = 0; }
                                                            validationService.calcOfferAmount(codeData).then((respOfferDetails) => {
                                                                if(respOfferDetails.status) {
                                                                    let offerAmt = respOfferDetails.amount;
                                                                    let remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                    if(offerAmt > remainingAmt) { offerAmt = remainingAmt; }
                                                                    orderData.discount_amount += offerAmt;
                                                                    remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                    if(remainingAmt > 0 && req.body.coupon_list.length) {
                                                                        validationService.processCouponList(req.body.store_id, req.body.coupon_list).then((updatedCouponList) => {
                                                                            let validIndex = updatedCouponList.findIndex(obj => obj.status=='valid');
                                                                            if(validIndex!=-1) {
                                                                                let gcList = validationService.calcGiftCardAmount(remainingAmt, updatedCouponList);
                                                                                res.json({ status: true, offer_amount: offerAmt, coupon_list: gcList });
                                                                            }
                                                                            else {
                                                                                res.json({ status: true, offer_amount: offerAmt, coupon_list: [] });
                                                                            }
                                                                        });
                                                                    }
                                                                    else { res.json({ status: true, offer_amount: offerAmt, coupon_list: [] }); }
                                                                }
                                                                else { res.json(respOfferDetails); }
                                                            });
                                                        }
                                                        else { res.json(respOfferData); }
                                                    });
                                                }
                                                else {
                                                    let remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                    if(remainingAmt > 0) {
                                                        validationService.processCouponList(req.body.store_id, req.body.coupon_list).then((updatedCouponList) => {
                                                            let validIndex = updatedCouponList.findIndex(obj => obj.status=='valid');
                                                            if(validIndex!=-1) {
                                                                let gcList = validationService.calcGiftCardAmount(remainingAmt, updatedCouponList);
                                                                res.json({ status: true,  offer_amount: 0, coupon_list: gcList });
                                                            }
                                                            else {
                                                                res.json({ status: true,  offer_amount: 0, coupon_list: [] });
                                                            }
                                                        });
                                                    }
                                                    else { res.json({ status: true,  offer_amount: 0, coupon_list: [] }); }
                                                }
                                            }
                                            else { res.json({ status: false, message: "No valid items found" }); }
                                        });
                                    }
                                    else { res.json({ status: false, message: "Address doesn't exists" }); }
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Invalid Store" }); }
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Invalid code" }); }
                }
                else { res.json({ status: false, error: err, message: "Invalid session" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.create_order_v2 = (req, res) => {
    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, { $unset: { checkout_details: "" } }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            let sessionId = req.body.sid+'-'+customerDetails._id;
            orderSession.findOne({ store_id: customerDetails.store_id, session_id: sessionId, status: "active" }, function(err, response) {
                if(!err && response) {
                    let orderSessionData = response;
                    req.body.buy_now = orderSessionData.buy_now;
                    req.body.order_type = orderSessionData.order_type;
                    req.body.shipping_address = orderSessionData.shipping_address;
                    req.body.currency_type = orderSessionData.currency_type;
                    req.body.item_list = orderSessionData.item_list;
                    if(!orderSessionData.vendor_list) { orderSessionData.vendor_list = []; }
                    // unique item list
                    let uniqueProductList = [];
                    req.body.item_list.forEach(x => {
                        let index = uniqueProductList.findIndex(obj => obj.product_id==x.product_id && JSON.stringify(obj.variant_types)==JSON.stringify(x.variant_types));
                        if(index!=-1) uniqueProductList[index].quantity += x.quantity;
                        else uniqueProductList.push({ product_id: x.product_id, quantity: x.quantity, unit: x.unit, variant_types: x.variant_types });
                    });
                    validationService.checkProductsAvailability(uniqueProductList).then((updatedItemList) => {
                        if(updatedItemList.findIndex(object => object.unavailable) == -1) {
                            // hold product
                            stockService.holdProductAndCoupon(uniqueProductList, req.body.coupon_list).then(() => {
                                // if hold selected products
                                currencyList.findOne({ name: req.body.currency_type }, function(err, response) {
                                    if(!err && response) {
                                        let liveCurrencyDetails = response;
                                        store.aggregate([
                                            { $match: { _id: mongoose.Types.ObjectId(customerDetails.store_id), status: 'active' } },
                                            {
                                                $lookup: {
                                                    from: "store_permissions",
                                                    localField: "_id",
                                                    foreignField: "store_id",
                                                    as: "storeProperties"
                                                }
                                            }
                                        ], function(err, response) {
                                            if(!err && response[0])
                                            {
                                                let storeDetails = response[0];
                                                let storeProperties = storeDetails.storeProperties[0];
                                                let appSetting = storeProperties.application_setting;
                                                let checkoutSetting = storeProperties.checkout_setting;
                                                let baseCurrency = storeDetails.currency_types.filter(obj => obj.default_currency)[0].country_code;
                                                let currencyData = {
                                                    country_code: req.body.currency_type,
                                                    html_code: liveCurrencyDetails.html_code,
                                                    country_inr_value: liveCurrencyDetails.rates[baseCurrency].toFixed(2)
                                                };
                                                let currencyDetails = storeDetails.currency_types.filter(obj => obj.country_code==req.body.currency_type)[0];
                                                // quick order details
                                                validationService.getQuickOrderDetails(storeDetails._id, orderSessionData).then((qoData) => {
                                                    // shipping address
                                                    let shippingAddress = "";
                                                    if(req.body.order_type=='pickup') {
                                                        let addrIndex = storeProperties.branches.findIndex(obj =>obj._id==req.body.shipping_address);
                                                        if(addrIndex!=-1) { shippingAddress = storeProperties.branches[addrIndex]; }
                                                    }
                                                    else {
                                                        let addrIndex = customerDetails.address_list.findIndex(obj =>obj._id==req.body.shipping_address);
                                                        if(addrIndex!=-1) { shippingAddress = customerDetails.address_list[addrIndex]; }
                                                    }
                                                    if(shippingAddress!="") {
                                                        let modelList = customerDetails.model_list;
                                                        if(!storeDetails.additional_features.custom_model) { modelList = orderSessionData.model_list; }
                                                        validationService.findCartSubTotal(storeDetails._id, currencyDetails, modelList, req.body.item_list, checkoutSetting).then((respData) => {
                                                            if(respData.item_list.length) {
                                                                let orderData = {
                                                                    store_id: storeDetails._id, customer_id: customerDetails._id, customer_name: customerDetails.name, payment_success: false,
                                                                    order_status: 'placed', status: 'inactive', order_by: 'user', order_type: req.body.order_type, item_list: respData.item_list,
                                                                    payment_details: req.body.payment_details, currency_type: currencyData, gift_wrapper: 0, packaging_charges: 0, coupon_list: [],
                                                                    shipping_address: shippingAddress, session_id: orderSessionData.session_id, shipping_method: orderSessionData.shipping_method,
                                                                    vendor_list: orderSessionData.vendor_list, cod_charges: 0, userAgent: req.get('User-Agent')
                                                                };
                                                                if(req.body.fatoorah_pay_id) {
                                                                    orderData.fatoorah_pay_id = req.body.fatoorah_pay_id;
                                                                }
                                                                if(req.body.buy_now) { orderData.buy_now = true; }
                                                                if(qoData) { orderData.quick_order_id = qoData._id; }
                                                                if(req.body.need_sample) { orderData.need_sample = true; }
                                                                if(req.body.order_note) { orderData.order_note = req.body.order_note; }
                                                                // billing address
                                                                let addrIndex = customerDetails.address_list.findIndex(obj => obj.billing_address);
                                                                if(addrIndex!=-1) {
                                                                    orderData.billing_address = customerDetails.address_list[addrIndex];
                                                                    if(req.body.payment_details && req.body.payment_details.name=='COD' && req.body.cod_mobile) {
                                                                        orderData.billing_address.mobile = req.body.cod_mobile;
                                                                    }
                                                                }
                                                                // gift wrapper
                                                                if(req.body.gift_status) {
                                                                    orderData.gift_status = true;
                                                                    if(appSetting.gift_wrapping_charges>0) {
                                                                        orderData.gwAmount = commonService.CALC_AC(currencyDetails, appSetting.gift_wrapping_charges);
                                                                        orderData.gift_wrapper = (orderData.gwAmount * respData.cart_qty);
                                                                    }
                                                                }
                                                                // packaging charges
                                                                if(storeDetails.packaging_charges && storeDetails.packaging_charges.value>0) {
                                                                    let packConfig = storeDetails.packaging_charges;
                                                                    if(packConfig.type=='percentage') {
                                                                        orderData.packaging_charges = Math.ceil(respData.selling_sub_total*(packConfig.value/100));
                                                                        if(packConfig.min_package_amt > orderData.packaging_charges) { orderData.packaging_charges = packConfig.min_package_amt; }
                                                                    }
                                                                    else { orderData.packaging_charges = commonService.CALC_AC(currencyDetails, packConfig.value); }
                                                                }
                                                                // calc
                                                                orderData.sub_total = respData.sub_total;
                                                                orderData.shipping_cost = orderData.shipping_method.shipping_price;
                                                                orderData.discount_amount = 0;
                                                                orderData.grand_total = parseFloat(orderData.sub_total)+parseFloat(orderData.shipping_cost)+parseFloat(orderData.gift_wrapper)+parseFloat(orderData.packaging_charges);
                                                                // quick order discount
                                                                if(qoData && qoData.disc_status && qoData.disc_config) {
                                                                    orderData.manual_discount = {};
                                                                    let discConfig = qoData.disc_config;
                                                                    if(discConfig.type=='amount') { orderData.discount_amount = discConfig.value; }
                                                                    else {
                                                                        orderData.discount_amount = parseFloat((orderData.sub_total*(discConfig.value/100)).toFixed(2));
                                                                        orderData.manual_discount.percentage = discConfig.value;
                                                                    }
                                                                    if(orderData.discount_amount > orderData.sub_total) { orderData.discount_amount = orderData.sub_total; }
                                                                    orderData.manual_discount.amount = orderData.discount_amount;
                                                                }
                                                                // calculate discount
                                                                if(req.body.coupon_list.length || req.body.offer_code) {
                                                                    let shippingType = 'international';
                                                                    if(storeDetails.country==orderData.shipping_address.country) { shippingType = 'domestic'; }
                                                                    // offer code
                                                                    if(req.body.offer_code)
                                                                    {
                                                                        getOfferCodeDetails(storeDetails._id, customerDetails._id, req.body.offer_code).then((respOfferData) => {
                                                                            if(respOfferData.status) {
                                                                                let codeData = {
                                                                                    code_details: respOfferData.data, checkout_setting: checkoutSetting, shipping_type: shippingType, 
                                                                                    item_list: orderData.item_list, shipping_cost: orderData.shipping_cost, cart_qty: respData.cart_qty,
                                                                                    wo_disc_sub_total: (respData.wo_disc_sub_total*1)-(orderData.discount_amount*1)
                                                                                }
                                                                                if(codeData.wo_disc_sub_total<0) { codeData.wo_disc_sub_total = 0; }
                                                                                validationService.calcOfferAmount(codeData).then((respOfferDetails) => {
                                                                                    if(respOfferDetails.status) {
                                                                                        orderData.offer_applied = true;
                                                                                        orderData.offer_details = {
                                                                                            id: codeData.code_details._id, code: codeData.code_details.code, price: respOfferDetails.amount
                                                                                        };
                                                                                        let offerAmt = respOfferDetails.amount;
                                                                                        let remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                                        if(offerAmt > remainingAmt) { offerAmt = remainingAmt; }
                                                                                        orderData.discount_amount += offerAmt;
                                                                                        remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                                        if(remainingAmt > 0) {
                                                                                            validationService.processCouponList(storeDetails._id, req.body.coupon_list).then((updatedCouponList) => {
                                                                                                let filterCouponList = updatedCouponList.filter(obj => obj.status=='valid');
                                                                                                if(filterCouponList.length) {
                                                                                                    orderData.coupon_list = validationService.calcGiftCardAmount(remainingAmt, filterCouponList);
                                                                                                    orderData.discount_amount += orderData.coupon_list.reduce((accumulator, currentValue) => {
                                                                                                        return accumulator + currentValue['price'];
                                                                                                    }, 0);
                                                                                                }
                                                                                                // create order
                                                                                                continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                                    res.json(orderResponse);
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            // create order
                                                                                            continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                                res.json(orderResponse);
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        let remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                                        if(remainingAmt > 0) {
                                                                                            validationService.processCouponList(storeDetails._id, req.body.coupon_list).then((updatedCouponList) => {
                                                                                                let filterCouponList = updatedCouponList.filter(obj => obj.status=='valid');
                                                                                                if(filterCouponList.length) {
                                                                                                    orderData.coupon_list = validationService.calcGiftCardAmount(remainingAmt, filterCouponList);
                                                                                                    orderData.discount_amount += orderData.coupon_list.reduce((accumulator, currentValue) => {
                                                                                                        return accumulator + currentValue['price'];
                                                                                                    }, 0);
                                                                                                }
                                                                                                // create order
                                                                                                continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                                    res.json(orderResponse);
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            // create order
                                                                                            continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                                res.json(orderResponse);
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }
                                                                            else {
                                                                                let remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                                if(remainingAmt > 0) {
                                                                                    validationService.processCouponList(storeDetails._id, req.body.coupon_list).then((updatedCouponList) => {
                                                                                        let filterCouponList = updatedCouponList.filter(obj => obj.status=='valid');
                                                                                        if(filterCouponList.length) {
                                                                                            orderData.coupon_list = validationService.calcGiftCardAmount(remainingAmt, filterCouponList);
                                                                                            orderData.discount_amount += orderData.coupon_list.reduce((accumulator, currentValue) => {
                                                                                                return accumulator + currentValue['price'];
                                                                                            }, 0);
                                                                                        }
                                                                                        // create order
                                                                                        continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                            res.json(orderResponse);
                                                                                        });
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    // create order
                                                                                    continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                        res.json(orderResponse);
                                                                                    });
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        let remainingAmt = orderData.grand_total - orderData.discount_amount;
                                                                        if(remainingAmt > 0) {
                                                                            validationService.processCouponList(storeDetails._id, req.body.coupon_list).then((updatedCouponList) => {
                                                                                let filterCouponList = updatedCouponList.filter(obj => obj.status=='valid');
                                                                                if(filterCouponList.length) {
                                                                                    orderData.coupon_list = validationService.calcGiftCardAmount(remainingAmt, filterCouponList);
                                                                                    orderData.discount_amount += orderData.coupon_list.reduce((accumulator, currentValue) => {
                                                                                        return accumulator + currentValue['price'];
                                                                                    }, 0);
                                                                                }
                                                                                // create order
                                                                                continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                    res.json(orderResponse);
                                                                                });
                                                                            });
                                                                        }
                                                                        else {
                                                                            // create order
                                                                            continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                                res.json(orderResponse);
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                                else {
                                                                    // create order
                                                                    continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList).then((orderResponse) => {
                                                                        res.json(orderResponse);
                                                                    });
                                                                }  
                                                            }
                                                            else { res.json({ status: false, message: "No valid items found" }); }
                                                        });
                                                    }
                                                    else { res.json({ status: false, message: "Address doesn't exists" }); }
                                                });
                                            }
                                            else { res.json({ status: false, error: err, message: "Invalid Store" }); }
                                        });
                                    }
                                    else { res.json({ status: false, error: err, message: "Invalid currency" }); }
                                });
                            });
                        }
                        else { res.json({ status: false, item_list: updatedItemList, message: "Some items not available" }); }
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid session" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

function continueOrderCreation(orderData, storeDetails, customerDetails, currencyDetails, uniqueProductList) {
    return new Promise((resolve, reject) => {
        if(!orderData.vendor_list) { orderData.vendor_list = []; }
        let payIndex = storeDetails.payment_types.findIndex(obj => obj.name==orderData.payment_details.name && obj.status=='active');
        if(!orderData.payment_details.name || payIndex!=-1) {
            orderData.final_price = orderData.grand_total - orderData.discount_amount;
            if(orderData.final_price>0 && orderData.payment_details.name && orderData.payment_details.name!='COD') {
                orderData.order_number = commonService.orderNumber();
                if(customerDetails.unique_id) {
                    orderData.order_number = orderData.order_number+'-'+customerDetails.unique_id;
                }
                validationService.setVendorOrdersInfo(null, orderData).then((updatedVendorList) => {
                    orderData.vendor_list = updatedVendorList;
                    orderList.create(orderData, function(err, response) {
                        if(!err && response)
                        {
                            let orderDetails = response;
                            orderDetails.customer_email = customerDetails.email;
                            if(orderDetails.payment_details.name=="Razorpay")
                            {
                                createPayment.createRazorpay(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
                                });
                            }
                            else if(orderDetails.payment_details.name=="PayPal")
                            {
                                createPayment.createPaypal(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
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
                                resolve({ status: true, data: sendData });
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
                                resolve({ status: true, data: sendData });
                            }
                            else if(orderDetails.payment_details.name=="Fatoorah")
                            {
                                orderDetails.fatoorah_pay_id = orderData.fatoorah_pay_id;
                                createPayment.createFatoorah(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Telr")
                            {
                                createPayment.createTelr(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Foloosi")
                            {
                                createPayment.createFoloosi(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Flutterwave")
                            {
                                createPayment.createFlutterwave(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Billbox")
                            {
                                createPayment.createBillbox(orderDetails, function(err, response) {
                                    if(!err && response) { resolve({ status: true, data: response }); }
                                    else { resolve({ status: false, error: err, message: response }); }
                                });
                            }
                            else if(orderDetails.payment_details.name=="Gpay" || orderDetails.payment_details.name=="Bank Payment")
                            {
                                let sendData = {
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: orderDetails.currency_type.country_code,
                                    amount: Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))
                                };
                                resolve({ status: true, data: sendData });
                            }
                            else { resolve({ status: false, message: "Invalid payment method" }); }
                        }
                        else { resolve({ status: false, error: err, message: "Unable to place order" }); }
                    });
                });
            }
            else {
                if(orderData.payment_details.name=='COD') {
                    let codConfig = storeDetails.payment_types[payIndex].cod_config;
                    orderData.cod_charges = commonService.CALC_AC(currencyDetails, codConfig.cod_charges);
                    orderData.grand_total += orderData.cod_charges;
                    orderData.final_price += orderData.cod_charges;
                }
                orderData.order_number = commonService.orderNumber();
                if(customerDetails.unique_id) {
                    orderData.order_number = orderData.order_number+'-'+customerDetails.unique_id;
                }
                orderData.status = "active";
                orderData.invoice_number = "";
                if(storeDetails.invoice_status && !orderData.vendor_list.length) {
                    orderData.invoice_number = commonService.invoiceNumber(storeDetails.invoice_config);
                }
                validationService.setVendorOrdersInfo(storeDetails, orderData).then((updatedVendorList) => {
                    orderData.vendor_list = updatedVendorList;
                    orderList.create(orderData, function(err, response) {
                        if(!err && response)
                        {
                            let orderDetails = response;
                            // ERP
                            let erpDetails = storeDetails.erp_details;
                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                orderDetails.customer_email = customerDetails.email;
                                let erpData = {
                                    erp_config: erpDetails.config,
                                    store_id: storeDetails._id, event_type: 'place_order',
                                    user_agent: orderData.userAgent, order_details: orderDetails
                                }
                                erpService.ambar(erpData);
                            }
                            // update next invoice no
                            if(storeDetails.invoice_status) {
                                let incCount = 1;
                                if(orderData.vendor_list.length) { incCount = orderData.vendor_list.length; }
                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
                            }
                            // clear customer cart
                            if(!orderDetails.buy_now) {
                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
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
                            resolve({ status: true, data: sendData });
                        }
                        else { resolve({ status: false, error: err, message: "Unable to place order" }); }
                    });
                });
            }
        }
        else { resolve({ status: false, message: "Invalid payment method" }); }
    });
}
// for v2 order end

exports.order_list = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response) {
            let queryParams = {};
            // live orders
            if(req.query.type=='live') {
                queryParams = {
                    store_id: mongoose.Types.ObjectId(response.store_id), customer_id: mongoose.Types.ObjectId(req.id), status: 'active',
                    $or: [
                        { order_status: { $in: [ 'placed', 'confirmed', 'dispatched' ] } },
                        { 'vendor_list.order_status': { $in: [ 'placed', 'confirmed', 'dispatched' ] } }
                    ]
                };
            }
            // completed orders
            else if(req.query.type=='completed') {
                queryParams = {
                    store_id: mongoose.Types.ObjectId(response.store_id), customer_id: mongoose.Types.ObjectId(req.id), status: 'active',
                    $or: [{ order_status: 'delivered' }, { 'vendor_list.order_status': 'delivered' }]
                };
            }
            // cancelled
            else {
                queryParams = {
                    store_id: mongoose.Types.ObjectId(response.store_id), customer_id: mongoose.Types.ObjectId(req.id), status: 'active',
                    $or: [{ order_status: 'cancelled' }, { 'vendor_list.order_status': 'cancelled' }]
                };
            }
            orderList.aggregate([
                { $match : queryParams },
                { $sort : { created_on : -1 } }
            ], function(err, response) {
                if(!err && response) {
                    res.json({ status: true, list: response });
                }
                else {
                    res.json({ status: false, error: err, message: "Failure" });
                }
            });
        }
        else {
            res.json({ status: false, message: "Invalid user" });
        }
    });
}

exports.order_details = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            if(req.query.order_id) {
                orderList.findOne({
                    _id: mongoose.Types.ObjectId(req.query.order_id), store_id: mongoose.Types.ObjectId(customerDetails.store_id),
                    customer_id: mongoose.Types.ObjectId(customerDetails._id)
                }, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, customer_details: customerDetails, data: response });
                    }
                    else {
                        res.json({ status: false, error: err, message: "Invalid order" });
                    }
                });
            }
            else {
                orderList.aggregate([
                    { $match : { store_id: mongoose.Types.ObjectId(customerDetails.store_id), customer_id: mongoose.Types.ObjectId(customerDetails._id), status: "active" } },
                    { $sort : { _id : -1 } },
                    { $limit : 1 }
                ], function(err, response) {
                    if(!err && response[0]) {
                        res.json({ status: true, customer_details: customerDetails, data: response[0] });
                    }
                    else {
                        res.json({ status: false, error: err, message: "Order not exists" });
                    }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
}

exports.cancel_order = (req, res) => {
    orderList.findOne({ _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }, function(err, response) {
        if(!err && response) {
            let orderDetails = response;
            orderDetails.item_list.forEach(obj => {
                if(!obj.item_status && req.body.item_list.indexOf(obj._id.toString()) != -1) {
                    obj.cancel_info = req.body.cancel_info;
                    obj.item_status = 'c_requested';
                }
            });
            orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
            { $set: { item_list: orderDetails.item_list } }, function(err, response) {
                if(!err) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Invalid order" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

// cod otp
exports.send_cod_otp = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id) }, function(err, response) {
        if(!err && response)
        {
            let codDetails = response.payment_types.filter(obj => obj.name=='COD');
            if(codDetails.length && req.body.mobile) {
                let smsConfig = codDetails[0].sms_config;
                if(smsConfig && smsConfig.provider=='24x7SMS') {
                    let otp = Math.floor(100000+Math.random()*999999);
                    let msgContent = smsConfig.msg_content.replace(/#OTP#/g, otp);
                    let smsOptions = {
                        method: 'get',
                        url: 'https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY='+smsConfig.api_key+'&MobileNo='+req.body.mobile+'&SenderID='+smsConfig.sender_id+'&Message='+urlencode(msgContent)+'&ServiceName='+smsConfig.service_name+'&DLTTemplateID='+smsConfig.template_id,
                    };
                    request(smsOptions, function (err, response) {
                        if(!err && response.statusCode == 200) {
                            if(response.body.indexOf('success')!=-1) {
                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) }, { $set: { cod_otp: otp, cod_otp_request_on: new Date() } }, function(err, response) {
                                    if(!err && response) { res.json({ status: true }); }
                                    else { res.json({ status: false, error: err, message: "OTP update error" }); }
                                });
                            }
                            else { res.json({ status: false, error: response.body, message: "Unable to send SMS" }); }
                        }
                        else { res.json({ status: false, error: err, message: "SMS gateway error" }); }
                    });
                }
                else { res.json({ status: false, message: "Invalid SMS provider" }); } 
            }
            else { res.json({ status: false, message: "COD or Mobile not exists" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid Store" }); }
    });
}

exports.validate_cod_otp = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), cod_otp: req.query.otp }, function(err, response) {
        if(!err && response) {
            // duration validation 15 minutes
            let timeStamp = ((response.cod_otp_request_on).getTime() + (15*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) { res.json({ status: true }); }
            else { res.json({ status: false, message: "OTP was expired" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid OTP" }); }
    });
}

function getOfferCodeDetails(storeId, customerId, code) {
    return new Promise((resolve, reject) => {
        let queryData = { store_id: mongoose.Types.ObjectId(storeId), code: code, status: "active", enable_status: true, valid_from: { $lte: new Date() } };
        offer.findOne(queryData, function(err, response) {
            if(!err && response) {
                let codeDetails = response;
                if(codeDetails.valid_to)
                {
                    if(new Date(codeDetails.valid_to) >= new Date())
                    {
                        if(codeDetails.restrict_usage) {
                            validationService.validateUsageRestriction(customerId, codeDetails).then((offerDetails) => {
                                resolve(offerDetails);
                            });
                        }
                        else {
                            if(codeDetails.onetime_usage) {
                                validationService.validateCustomerOffer(customerId, codeDetails).then((offerDetails) => {
                                    resolve(offerDetails);
                                });
                            }
                            else {
                                resolve({ status: true, data: codeDetails });
                            }
                        }
                    }
                    else {
                        resolve({ status: false, message: "Offer expired" });
                    }
                }
                else
                {
                    if(codeDetails.restrict_usage) {
                        validationService.validateUsageRestriction(customerId, codeDetails).then((offerDetails) => {
                            resolve(offerDetails);
                        });
                    }
                    else {
                        if(codeDetails.onetime_usage) {
                            validationService.validateCustomerOffer(customerId, codeDetails).then((offerDetails) => {
                                resolve(offerDetails);
                            });
                        }
                        else {
                            resolve({ status: true, data: codeDetails });
                        }
                    }
                }
            }
            else {
                resolve({ status: false, message: "Invalid code" });
            }
        });
    });
}