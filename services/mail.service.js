const mongoose = require('mongoose');
const request = require('request');
const nodemailer = require('nodemailer');
const dateFormat = require('dateformat');
const orderSession = require("../src/models/order_session.model");
const couponCodes = require("../src/models/coupon_codes.model");
const orderList = require("../src/models/order_list.model");
const quotList = require("../src/models/quotation.model");
const quickOrders = require("../src/models/quick_orders.model");
const donationList = require("../src/models/donation_list.model");
const vendor = require("../src/models/vendor.model");
const setupConfig = require('../config/setup.config');
const mailTemp = require('../config/mail-templates');
const commonService = require("../services/common.service");
const notifyService = require("../services/notify.service");
const _this = this;

/** admin mail **/
exports.sendMailFromAdmin = function(jsonData, callback) {

    jsonData = JSON.stringify(jsonData);
    jsonData = JSON.parse(jsonData);
    let mailConfig = jsonData.config;
    let transporter = nodemailer.createTransport(mailConfig.transporter);
    let mailOptions = {
        from: mailConfig.send_from,
        to: jsonData.sendTo,
        subject: jsonData.subject,
        html: jsonData.body
    };
    if(jsonData.cc_mail) { mailOptions.cc = jsonData.cc_mail; }
    if(jsonData.attachments) { mailOptions.attachments = jsonData.attachments; }

    transporter.sendMail(mailOptions, (err, info) => {
        if(!err && info) { callback(null, info); }
        else { callback(err, 'Mail send failed'); }
    });

}

/** store mail **/
exports.sendMailFromStore = function(jsonData, callback) {

    jsonData = JSON.stringify(jsonData);
    jsonData = JSON.parse(jsonData);
    let mailConfig = jsonData.config;
    if(!mailConfig.send_from) {
        mailConfig.send_from = jsonData.store_name+" <"+mailConfig.transporter.auth.user+">";
    }
    let transporter = nodemailer.createTransport(mailConfig.transporter);
    let mailOptions = {
        from: mailConfig.send_from,
        to: jsonData.sendTo,
        subject: jsonData.subject,
        html: jsonData.body
    };
    if(jsonData.cc_mail) { mailOptions.cc = jsonData.cc_mail; }
    if(jsonData.attachments) { mailOptions.attachments = jsonData.attachments; }

    transporter.sendMail(mailOptions, (err, info) => {
        if(!err && info) { callback(null, info); }
        else { callback(err, 'Mail send failed'); }
    });

}

/** quotation mail **/
exports.sendQuotPlacedMail = function(customerEmail, quotId) {
    return new Promise((resolve, reject) => {
        quotList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(quotId) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.quot_by=="guest") { customerDetails = { name: orderDetails.company_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = orderDetails.storeDetails[0];
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                let filePath = setupConfig.mail_base+storeDetails._id+'/quote_placed.html';
                request.get(filePath, function (err, response, body) {
                    if(!err && response.statusCode == 200) {
                        let bodyContent = body;
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##quote_number##", orderDetails.quot_number);
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: "We have received your request with Quote ID: "+orderDetails.quot_number,
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        // if mail specified
                        if(customerEmail) { sendData.sendTo = customerEmail; }
                        // send mail
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    }
                    else {
                        reject("Invalid email template");
                    }
                });
            }
            else {
                reject("Invalid quotation");
            }
        });
    });
}

exports.sendQuotRevisionMail = function(customerEmail, quotId) {
    return new Promise((resolve, reject) => {
        quotList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(quotId) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.quot_by=="guest") { customerDetails = { name: orderDetails.company_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = orderDetails.storeDetails[0];
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = "";
                for(let item of orderDetails.item_list) {
                    itemList += createQuotItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                }
                // shipping address
                let shippingAddress = orderDetails.company_address.name+"<br>"+orderDetails.company_address.address;
                if(orderDetails.company_address.city || orderDetails.company_address.state || orderDetails.company_address.pincode) {
                    shippingAddress += "<br>";
                    if(orderDetails.company_address.city) { shippingAddress += orderDetails.company_address.city+", "; }
                    if(orderDetails.company_address.state) { shippingAddress += orderDetails.company_address.state+", "; }
                    if(orderDetails.company_address.pincode) { shippingAddress += orderDetails.company_address.pincode+", "; }
                    shippingAddress = shippingAddress.slice(0, -2);
                }
                shippingAddress += "<br>"+orderDetails.company_address.country+"<br>"+orderDetails.company_address.dial_code+"&nbsp;"+orderDetails.company_address.mobile;
                let approveLink = setupConfig.api_base+'store_details/quote_request/approve/'+orderDetails.store_id+'/'+orderDetails._id;
                let revisionLink = setupConfig.api_base+'store_details/quote_request/revision/'+orderDetails.store_id+'/'+orderDetails._id;
                let filePath = setupConfig.mail_base+storeDetails._id+'/quote_processed.html';
                request.get(filePath, function (err, response, body) {
                    if(!err && response.statusCode == 200) {
                        let bodyContent = body;
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##quote_number##", orderDetails.quot_number);
                        bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                        bodyContent = bodyContent.replace("##item_list##", itemList);
                        bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                        bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                        bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                        bodyContent = bodyContent.replace("##approve_link##", approveLink);
                        bodyContent = bodyContent.replace("##revision_link##", revisionLink);
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: "We have processed your request with Quote ID: "+orderDetails.quot_number,
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        // if mail specified
                        if(customerEmail) { sendData.sendTo = customerEmail; }
                        // send mail
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    }
                    else {
                        reject("Invalid email template");
                    }
                });
            }
            else {
                reject("Invalid quotation");
            }
        });
    });
}

exports.sendQuotCompletedMail = function(customerEmail, quotId) {
    return new Promise((resolve, reject) => {
        quotList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(quotId) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.quot_by=="guest") { customerDetails = { name: orderDetails.company_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = orderDetails.storeDetails[0];
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = "";
                for(let item of orderDetails.item_list) {
                    itemList += createQuotItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                }
                // shipping address
                let shippingAddress = orderDetails.company_address.name+"<br>"+orderDetails.company_address.address;
                if(orderDetails.company_address.city || orderDetails.company_address.state || orderDetails.company_address.pincode) {
                    shippingAddress += "<br>";
                    if(orderDetails.company_address.city) { shippingAddress += orderDetails.company_address.city+", "; }
                    if(orderDetails.company_address.state) { shippingAddress += orderDetails.company_address.state+", "; }
                    if(orderDetails.company_address.pincode) { shippingAddress += orderDetails.company_address.pincode+", "; }
                    shippingAddress = shippingAddress.slice(0, -2);
                }
                shippingAddress += "<br>"+orderDetails.company_address.country+"<br>"+orderDetails.company_address.dial_code+"&nbsp;"+orderDetails.company_address.mobile;
                let filePath = setupConfig.mail_base+storeDetails._id+'/quote_finalised.html';
                request.get(filePath, function (err, response, body) {
                    if(!err && response.statusCode == 200) {
                        let bodyContent = body;
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##quote_number##", orderDetails.quot_number);
                        bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                        bodyContent = bodyContent.replace("##item_list##", itemList);
                        bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                        bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                        bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: "We have finalised your request with Quote ID: "+orderDetails.quot_number,
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        // if mail specified
                        if(customerEmail) { sendData.sendTo = customerEmail; }
                        // send mail
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    }
                    else { reject("Invalid email template"); }
                });
            }
            else { reject("Invalid quotation"); }
        });
    });
}

exports.sendQuotCancelledMail = function(customerEmail, quotId) {
    return new Promise((resolve, reject) => {
        quotList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(quotId) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.quot_by=="guest") { customerDetails = { name: orderDetails.company_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = orderDetails.storeDetails[0];
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                let filePath = setupConfig.mail_base+storeDetails._id+'/quote_cancelled.html';
                request.get(filePath, function (err, response, body) {
                    if(!err && response.statusCode == 200) {
                        let bodyContent = body;
                        let currentDate = dateFormat(new Date(orderDetails.created_on), "mmmm d yyyy");
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##quote_number##", orderDetails.quot_number);
                        bodyContent = bodyContent.replace("##quote_number##", orderDetails.quot_number);
                        bodyContent = bodyContent.replace("##order_date##", currentDate);
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: "Your request with Quote ID: "+orderDetails.quot_number+" has been cancelled",
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        // if mail specified
                        if(customerEmail) { sendData.sendTo = customerEmail; }
                        // send mail
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    }
                    else {
                        reject("Invalid email template");
                    }
                });
            }
            else {
                reject("Invalid quotation");
            }
        });
    });
}

/** product mail **/
exports.sendOrderReceivedMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = orderDetails.storeDetails[0];
                // close session
                orderSession.findOneAndUpdate({ session_id: orderDetails.session_id }, { $set: { status: 'completed' } }, function(err, response) { });
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = "";
                for(let item of orderDetails.item_list) {
                    itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                }
                if(orderDetails.order_type=='pickup') {
                    mailTemp.pickup_order_received(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/pickup_order_placed.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been received",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            if(!customerEmail) {
                                // push notification
                                if(storeDetails.device_token) {
                                    let allSubscriptions = [storeDetails.device_token];
                                    let webPayload = {
                                        title: "Yourstore",
                                        body: "You have a new order!"
                                    };
                                    notifyService.web(allSubscriptions, webPayload);
                                }
                                if(storeDetails.app_token) {
                                    let allSubscriptions = [storeDetails.app_token];
                                    let appPayload = {
                                        title: "You have received 1 new order!",
                                        body: "Click here to view the order.",
                                        redirect: "/orders/product/live/all"
                                    };
                                    notifyService.app(allSubscriptions, appPayload);
                                }
                                if(orderDetails.quick_order_id) {
                                    quickOrders.findByIdAndUpdate(orderDetails.quick_order_id, { $inc: { usage_count: 1 } }, function(err, response) { });
                                }
                            }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
                else if(orderDetails.order_type=='trial') {
                    resolve(true);
                }
                else {
                    // shipping address
                    let shippingAddress = orderDetails.shipping_address.name+"<br>"+orderDetails.shipping_address.address;
                    if(orderDetails.shipping_address.city || orderDetails.shipping_address.state || orderDetails.shipping_address.pincode) {
                        shippingAddress += "<br>";
                        if(orderDetails.shipping_address.city) { shippingAddress += orderDetails.shipping_address.city+", "; }
                        if(orderDetails.shipping_address.state) { shippingAddress += orderDetails.shipping_address.state+", "; }
                        if(orderDetails.shipping_address.pincode) { shippingAddress += orderDetails.shipping_address.pincode+", "; }
                        shippingAddress = shippingAddress.slice(0, -2);
                    }
                    shippingAddress += "<br>"+orderDetails.shipping_address.country+"<br>"+orderDetails.shipping_address.dial_code+"&nbsp;"+orderDetails.shipping_address.mobile;
                    // billing address
                    let billingAddress = "";
                    if(orderDetails.billing_address) {
                        billingAddress = orderDetails.billing_address.name+"<br>"+orderDetails.billing_address.address;
                        if(orderDetails.billing_address.city || orderDetails.billing_address.state || orderDetails.billing_address.pincode) {
                            billingAddress += "<br>";
                            if(orderDetails.billing_address.city) { billingAddress += orderDetails.billing_address.city+", "; }
                            if(orderDetails.billing_address.state) { billingAddress += orderDetails.billing_address.state+", "; }
                            if(orderDetails.billing_address.pincode) { billingAddress += orderDetails.billing_address.pincode+", "; }
                            billingAddress = billingAddress.slice(0, -2);
                        }
                        billingAddress += "<br>"+orderDetails.billing_address.country+"<br>"+orderDetails.billing_address.dial_code+"&nbsp;"+orderDetails.billing_address.mobile;
                    }
                    mailTemp.order_received(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/order_placed.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##billing_address##", billingAddress);
                            bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been received",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            if(!customerEmail) {
                                // push notification
                                if(storeDetails.device_token) {
                                    let allSubscriptions = [storeDetails.device_token];
                                    let webPayload = {
                                        title: "Yourstore",
                                        body: "You have a new order!"
                                    };
                                    notifyService.web(allSubscriptions, webPayload);
                                }
                                if(storeDetails.app_token) {
                                    let allSubscriptions = [storeDetails.app_token];
                                    let appPayload = {
                                        title: "You have received 1 new order!",
                                        body: "Click here to view the order.",
                                        redirect: "/orders/product/live/all"
                                    };
                                    notifyService.app(allSubscriptions, appPayload);
                                }
                                if(orderDetails.quick_order_id) {
                                    quickOrders.findByIdAndUpdate(orderDetails.quick_order_id, { $inc: { usage_count: 1 } }, function(err, response) { });
                                }
                            }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
            }
            else {
                reject("Invalid order");
            }
        });
    });
}

exports.sendOrderPlacedMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = orderDetails.storeDetails[0];
                // close session
                orderSession.findOneAndUpdate({ session_id: orderDetails.session_id }, { $set: { status: 'completed' } }, function(err, response) { });
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = "";
                for(let item of orderDetails.item_list) {
                    itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                }
                if(orderDetails.order_type=='pickup') {
                    mailTemp.pickup_order_placed(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/pickup_order_placed.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been placed",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            if(!customerEmail) {
                                // push notification
                                if(storeDetails.device_token) {
                                    let allSubscriptions = [storeDetails.device_token];
                                    let webPayload = {
                                        title: "Yourstore",
                                        body: "You have a new order!"
                                    };
                                    notifyService.web(allSubscriptions, webPayload);
                                }
                                if(storeDetails.app_token) {
                                    let allSubscriptions = [storeDetails.app_token];
                                    let appPayload = {
                                        title: "You have received 1 new order!",
                                        body: "Click here to view the order.",
                                        redirect: "/orders/product/live/all"
                                    };
                                    notifyService.app(allSubscriptions, appPayload);
                                }
                                if(orderDetails.quick_order_id) {
                                    quickOrders.findByIdAndUpdate(orderDetails.quick_order_id, { $inc: { usage_count: 1 } }, function(err, response) { });
                                }
                            }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
                else if(orderDetails.order_type=='trial') {
                    resolve(true);
                }
                else {
                    // shipping address
                    let shippingAddress = orderDetails.shipping_address.name+"<br>"+orderDetails.shipping_address.address;
                    if(orderDetails.shipping_address.city || orderDetails.shipping_address.state || orderDetails.shipping_address.pincode) {
                        shippingAddress += "<br>";
                        if(orderDetails.shipping_address.city) { shippingAddress += orderDetails.shipping_address.city+", "; }
                        if(orderDetails.shipping_address.state) { shippingAddress += orderDetails.shipping_address.state+", "; }
                        if(orderDetails.shipping_address.pincode) { shippingAddress += orderDetails.shipping_address.pincode+", "; }
                        shippingAddress = shippingAddress.slice(0, -2);
                    }
                    shippingAddress += "<br>"+orderDetails.shipping_address.country+"<br>"+orderDetails.shipping_address.dial_code+"&nbsp;"+orderDetails.shipping_address.mobile;
                    // billing address
                    let billingAddress = "";
                    if(orderDetails.billing_address) {
                        billingAddress = orderDetails.billing_address.name+"<br>"+orderDetails.billing_address.address;
                        if(orderDetails.billing_address.city || orderDetails.billing_address.state || orderDetails.billing_address.pincode) {
                            billingAddress += "<br>";
                            if(orderDetails.billing_address.city) { billingAddress += orderDetails.billing_address.city+", "; }
                            if(orderDetails.billing_address.state) { billingAddress += orderDetails.billing_address.state+", "; }
                            if(orderDetails.billing_address.pincode) { billingAddress += orderDetails.billing_address.pincode+", "; }
                            billingAddress = billingAddress.slice(0, -2);
                        }
                        billingAddress += "<br>"+orderDetails.billing_address.country+"<br>"+orderDetails.billing_address.dial_code+"&nbsp;"+orderDetails.billing_address.mobile;
                    }
                    mailTemp.order_placed(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/order_placed.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##billing_address##", billingAddress);
                            bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been placed",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            if(!customerEmail) {
                                // push notification
                                if(storeDetails.device_token) {
                                    let allSubscriptions = [storeDetails.device_token];
                                    let webPayload = {
                                        title: "Yourstore",
                                        body: "You have a new order!"
                                    };
                                    notifyService.web(allSubscriptions, webPayload);
                                }
                                if(storeDetails.app_token) {
                                    let allSubscriptions = [storeDetails.app_token];
                                    let appPayload = {
                                        title: "You have received 1 new order!",
                                        body: "Click here to view the order.",
                                        redirect: "/orders/product/live/all"
                                    };
                                    notifyService.app(allSubscriptions, appPayload);
                                }
                                if(orderDetails.quick_order_id) {
                                    quickOrders.findByIdAndUpdate(orderDetails.quick_order_id, { $inc: { usage_count: 1 } }, function(err, response) { });
                                }
                            }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
            }
            else {
                reject("Invalid order");
            }
        });
    });
}

exports.sendOrderPlacedMailToVendor = function(orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let storeDetails = orderDetails.storeDetails[0];
                let vendorIds = [];
                orderDetails.vendor_list.forEach(obj => {
                    vendorIds.push(mongoose.Types.ObjectId(obj.vendor_id));
                });
                vendor.find({ _id: { $in: vendorIds } }, function(err, response) {
                    if(!err && response && response.length) {
                        let vendorList = response;
                        let mailConfig = setupConfig.mail_config;
                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                        mailTemp.order_placed_vendor(storeDetails).then((body) => {
                            let bodyContent = body;
                            let filePath = setupConfig.mail_base+storeDetails._id+'/order_placed_vendor.html';
                            request.get(filePath, function (err, response, body) {
                                if(!err && response.statusCode == 200) { bodyContent = body; }
                                // build item list
                                for(let vendor of orderDetails.vendor_list) {
                                    let vendorIndex = vendorList.findIndex(obj => String(obj._id)==String(vendor.vendor_id));
                                    if(vendorIndex!=-1) {
                                        let vendorDetails = vendorList[vendorIndex];
                                        let itemList = "";
                                        for(let item of orderDetails.item_list) {
                                            if(String(item.vendor_id)==String(vendorDetails._id)) {
                                                itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                                            }
                                        }
                                        let mailContent = bodyContent;
                                        mailContent = mailContent.replace("##vendor_name##", vendorDetails.company_details.name);
                                        mailContent = mailContent.replace("##item_list##", itemList);
                                        mailContent = mailContent.replace("##copy_year##", new Date().getFullYear());
                                        let sendData = {
                                            store_name: storeDetails.name,
                                            config: mailConfig,
                                            sendTo: vendorDetails.email,
                                            subject: "You have received an order with order ID: "+orderDetails.order_number+" from "+storeDetails.name+".",
                                            body: mailContent
                                        };
                                        // send mail
                                        _this.sendMailFromStore(sendData, function(err, response) {
                                            if(!err && response) { resolve(true); }
                                            else { reject("Email send failed"); }
                                        });
                                    }
                                    else { resolve(true); }
                                }
                            });
                        });
                    }
                    else { resolve(true); }
                });
            }
            else { reject("Invalid order"); }
        });
    });
}

exports.sendOrderConfirmedMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = "";
                for(let item of orderDetails.item_list) {
                    itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                }
                let currentDate = dateFormat(new Date(orderDetails.confirmed_on), "mmmm d yyyy")+' at '+dateFormat(new Date(orderDetails.confirmed_on), "h:MM:ss TT");
                if(orderDetails.order_type=='pickup') {
                    mailTemp.pickup_order_confirmed(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/pickup_order_confirmed.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_date##", currentDate);
                            bodyContent = bodyContent.replace("##pickup_date##", orderDetails.shipping_method.delivery_date);
                            bodyContent = bodyContent.replace("##pickup_time##", orderDetails.shipping_method.delivery_time);
                            bodyContent = bodyContent.replace("##pickup_loc_name##", orderDetails.shipping_address.name);
                            bodyContent = bodyContent.replace("##pickup_loc_addr##", orderDetails.shipping_address.address);
                            bodyContent = bodyContent.replace("##pickup_loc_url##", orderDetails.shipping_address.location_url);
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been confirmed",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
                else if(orderDetails.order_type=='trial') {
                    resolve(true);
                }
                else {
                    // shipping address
                    let shippingAddress = orderDetails.shipping_address.name+"<br>"+orderDetails.shipping_address.address;
                    if(orderDetails.shipping_address.city || orderDetails.shipping_address.state || orderDetails.shipping_address.pincode) {
                        shippingAddress += "<br>";
                        if(orderDetails.shipping_address.city) { shippingAddress += orderDetails.shipping_address.city+", "; }
                        if(orderDetails.shipping_address.state) { shippingAddress += orderDetails.shipping_address.state+", "; }
                        if(orderDetails.shipping_address.pincode) { shippingAddress += orderDetails.shipping_address.pincode+", "; }
                        shippingAddress = shippingAddress.slice(0, -2);
                    }
                    shippingAddress += "<br>"+orderDetails.shipping_address.country+"<br>"+orderDetails.shipping_address.dial_code+"&nbsp;"+orderDetails.shipping_address.mobile;
                    // billing address
                    let billingAddress = "";
                    if(orderDetails.billing_address) {
                        billingAddress = orderDetails.billing_address.name+"<br>"+orderDetails.billing_address.address;
                        if(orderDetails.billing_address.city || orderDetails.billing_address.state || orderDetails.billing_address.pincode) {
                            billingAddress += "<br>";
                            if(orderDetails.billing_address.city) { billingAddress += orderDetails.billing_address.city+", "; }
                            if(orderDetails.billing_address.state) { billingAddress += orderDetails.billing_address.state+", "; }
                            if(orderDetails.billing_address.pincode) { billingAddress += orderDetails.billing_address.pincode+", "; }
                            billingAddress = billingAddress.slice(0, -2);
                        }
                        billingAddress += "<br>"+orderDetails.billing_address.country+"<br>"+orderDetails.billing_address.dial_code+"&nbsp;"+orderDetails.billing_address.mobile;
                    }
                    mailTemp.order_confirmed(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/order_confirmed.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_date##", currentDate);
                            bodyContent = bodyContent.replace("##billing_address##", billingAddress);
                            bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been confirmed",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
            }
            else {
                reject("Invalid order");
            }
        });
    });
}

exports.sendOrderDispatchedMail = function(customerEmail, orderId, groupId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = ""; let groupDetails = "";
                if(groupId) {
                    let groupIndex = orderDetails.item_groups.findIndex(obj => obj._id.toString()==groupId);
                    if(groupIndex!=-1) { groupDetails = orderDetails.item_groups[groupIndex]; }
                }
                for(let i=0; i<orderDetails.item_list.length; i++) {
                    if(groupDetails) {
                        if(groupDetails.items.indexOf(i)!=-1) {
                            itemList += createItemRow(orderDetails.item_list[i], orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                        }
                    }
                    else {
                        itemList += createItemRow(orderDetails.item_list[i], orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                    }
                }
                if(orderDetails.order_type=='pickup') {
                    mailTemp.pickup_order_dispatched(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/pickup_order_dispatched.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##pickup_loc_name##", orderDetails.shipping_address.name);
                            bodyContent = bodyContent.replace("##pickup_loc_addr##", orderDetails.shipping_address.address);
                            bodyContent = bodyContent.replace("##pickup_loc_url##", orderDetails.shipping_address.location_url);
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been ready",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
                else if(orderDetails.order_type=='trial') {
                    // shipping address
                    let shippingAddress = orderDetails.shipping_address.name+"<br>"+orderDetails.shipping_address.address;
                    if(orderDetails.shipping_address.city || orderDetails.shipping_address.state || orderDetails.shipping_address.pincode) {
                        shippingAddress += "<br>";
                        if(orderDetails.shipping_address.city) { shippingAddress += orderDetails.shipping_address.city+", "; }
                        if(orderDetails.shipping_address.state) { shippingAddress += orderDetails.shipping_address.state+", "; }
                        if(orderDetails.shipping_address.pincode) { shippingAddress += orderDetails.shipping_address.pincode+", "; }
                        shippingAddress = shippingAddress.slice(0, -2);
                    }
                    shippingAddress += "<br>"+orderDetails.shipping_address.country+"<br>"+orderDetails.shipping_address.dial_code+"&nbsp;"+orderDetails.shipping_address.mobile;
                    let filePath = setupConfig.mail_base+storeDetails._id+'/trial_order_dispatched.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                            // tracking details
                            if(orderDetails.shipping_method.delivery_method) {
                                bodyContent = bodyContent.replace("##tracking_style##", "display:none;");
                            }
                            else {
                                bodyContent = bodyContent.replace("##tracking_style##", "");
                                if(groupDetails) {
                                    bodyContent = bodyContent.replace("##carrier_name##", groupDetails.carrier_name);
                                    bodyContent = bodyContent.replace("##tracking_number##", groupDetails.tracking_number);
                                    bodyContent = bodyContent.replace("##tracking_link##", groupDetails.tracking_link);
                                }
                                else {
                                    bodyContent = bodyContent.replace("##carrier_name##", orderDetails.shipping_method.name);
                                    bodyContent = bodyContent.replace("##tracking_number##", orderDetails.shipping_method.tracking_number);
                                    bodyContent = bodyContent.replace("##tracking_link##", orderDetails.shipping_method.tracking_link);
                                }
                            }
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your TRY ON TEE has been dispatched",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        }
                        else { reject("Invalid email template"); }
                    });
                }
                else {
                    // shipping address
                    let shippingAddress = orderDetails.shipping_address.name+"<br>"+orderDetails.shipping_address.address;
                    if(orderDetails.shipping_address.city || orderDetails.shipping_address.state || orderDetails.shipping_address.pincode) {
                        shippingAddress += "<br>";
                        if(orderDetails.shipping_address.city) { shippingAddress += orderDetails.shipping_address.city+", "; }
                        if(orderDetails.shipping_address.state) { shippingAddress += orderDetails.shipping_address.state+", "; }
                        if(orderDetails.shipping_address.pincode) { shippingAddress += orderDetails.shipping_address.pincode+", "; }
                        shippingAddress = shippingAddress.slice(0, -2);
                    }
                    shippingAddress += "<br>"+orderDetails.shipping_address.country+"<br>"+orderDetails.shipping_address.dial_code+"&nbsp;"+orderDetails.shipping_address.mobile;
                    // billing address
                    let billingAddress = "";
                    if(orderDetails.billing_address) {
                        billingAddress = orderDetails.billing_address.name+"<br>"+orderDetails.billing_address.address;
                        if(orderDetails.billing_address.city || orderDetails.billing_address.state || orderDetails.billing_address.pincode) {
                            billingAddress += "<br>";
                            if(orderDetails.billing_address.city) { billingAddress += orderDetails.billing_address.city+", "; }
                            if(orderDetails.billing_address.state) { billingAddress += orderDetails.billing_address.state+", "; }
                            if(orderDetails.billing_address.pincode) { billingAddress += orderDetails.billing_address.pincode+", "; }
                            billingAddress = billingAddress.slice(0, -2);
                        }
                        billingAddress += "<br>"+orderDetails.billing_address.country+"<br>"+orderDetails.billing_address.dial_code+"&nbsp;"+orderDetails.billing_address.mobile;
                    }
                    mailTemp.order_dispatched(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/order_dispatched.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##billing_address##", billingAddress);
                            bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                            // tracking details
                            if(orderDetails.shipping_method.delivery_method) {
                                bodyContent = bodyContent.replace("##tracking_style##", "display:none;");
                            }
                            else {
                                bodyContent = bodyContent.replace("##tracking_style##", "");
                                if(groupDetails) {
                                    bodyContent = bodyContent.replace("##carrier_name##", groupDetails.carrier_name);
                                    bodyContent = bodyContent.replace("##tracking_number##", groupDetails.tracking_number);
                                    bodyContent = bodyContent.replace("##tracking_link##", groupDetails.tracking_link);
                                }
                                else {
                                    bodyContent = bodyContent.replace("##carrier_name##", orderDetails.shipping_method.name);
                                    bodyContent = bodyContent.replace("##tracking_number##", orderDetails.shipping_method.tracking_number);
                                    bodyContent = bodyContent.replace("##tracking_link##", orderDetails.shipping_method.tracking_link);
                                }
                            }
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // table body
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            if(groupDetails) {
                                bodyContent = bodyContent.replace("##tbody_style##", "display:none;");
                            }
                            else {
                                bodyContent = bodyContent.replace("##tbody_style##", "");
                                // cod charges
                                if(orderDetails.cod_charges > 0) {
                                    bodyContent = bodyContent.replace("##cod_style##", "");
                                    bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                                }
                                else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                                // gift wrapper charge
                                if(orderDetails.gift_wrapper > 0) {
                                    bodyContent = bodyContent.replace("##gw_style##", "");
                                    bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                                }
                                else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                                // packaging charges
                                if(orderDetails.packaging_charges > 0) {
                                    bodyContent = bodyContent.replace("##pack_style##", "");
                                    bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                                }
                                else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                                // discount
                                if(orderDetails.discount_amount > 0) {
                                    bodyContent = bodyContent.replace("##discount_style##", "");
                                    bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                                }
                                else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                                bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                                bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                                bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            }
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been dispatched",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
            }
            else {
                reject("Invalid order");
            }
        });
    });
}

exports.sendOrderDeliveredMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // build item list
                let itemList = "";
                for(let item of orderDetails.item_list) {
                    itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                }
                if(orderDetails.order_type=='pickup') {
                    mailTemp.pickup_order_delivered(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/pickup_order_delivered.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been delivered",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
                else if(orderDetails.order_type=='trial') {
                    let filePath = setupConfig.mail_base+storeDetails._id+'/trial_order_delivered.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your TRY ON TEE has been delivered",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        }
                        else { reject("Invalid email template"); }
                    });
                }
                else {
                    // shipping address
                    let shippingAddress = orderDetails.shipping_address.name+"<br>"+orderDetails.shipping_address.address;
                    if(orderDetails.shipping_address.city || orderDetails.shipping_address.state || orderDetails.shipping_address.pincode) {
                        shippingAddress += "<br>";
                        if(orderDetails.shipping_address.city) { shippingAddress += orderDetails.shipping_address.city+", "; }
                        if(orderDetails.shipping_address.state) { shippingAddress += orderDetails.shipping_address.state+", "; }
                        if(orderDetails.shipping_address.pincode) { shippingAddress += orderDetails.shipping_address.pincode+", "; }
                        shippingAddress = shippingAddress.slice(0, -2);
                    }
                    shippingAddress += "<br>"+orderDetails.shipping_address.country+"<br>"+orderDetails.shipping_address.dial_code+"&nbsp;"+orderDetails.shipping_address.mobile;
                    // billing address
                    let billingAddress = "";
                    if(orderDetails.billing_address) {
                        billingAddress = orderDetails.billing_address.name+"<br>"+orderDetails.billing_address.address;
                        if(orderDetails.billing_address.city || orderDetails.billing_address.state || orderDetails.billing_address.pincode) {
                            billingAddress += "<br>";
                            if(orderDetails.billing_address.city) { billingAddress += orderDetails.billing_address.city+", "; }
                            if(orderDetails.billing_address.state) { billingAddress += orderDetails.billing_address.state+", "; }
                            if(orderDetails.billing_address.pincode) { billingAddress += orderDetails.billing_address.pincode+", "; }
                            billingAddress = billingAddress.slice(0, -2);
                        }
                        billingAddress += "<br>"+orderDetails.billing_address.country+"<br>"+orderDetails.billing_address.dial_code+"&nbsp;"+orderDetails.billing_address.mobile;
                    }
                    mailTemp.order_delivered(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/order_delivered.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##billing_address##", billingAddress);
                            bodyContent = bodyContent.replace("##shipping_address##", shippingAddress);
                            // payment details
                            if(orderDetails.payment_details) {
                                bodyContent = bodyContent.replace("##payment_style##", "");
                                bodyContent = bodyContent.replace("##payment_method##", orderDetails.payment_details.name);
                            }
                            else { bodyContent = bodyContent.replace("##payment_style##", "display:none;"); }
                            // cod charges
                            if(orderDetails.cod_charges > 0) {
                                bodyContent = bodyContent.replace("##cod_style##", "");
                                bodyContent = bodyContent.replace("##cod_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.cod_charges));
                            }
                            else { bodyContent = bodyContent.replace("##cod_style##", "display:none;"); }
                            // gift wrapper charge
                            if(orderDetails.gift_wrapper > 0) {
                                bodyContent = bodyContent.replace("##gw_style##", "");
                                bodyContent = bodyContent.replace("##gw_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.gift_wrapper));
                            }
                            else { bodyContent = bodyContent.replace("##gw_style##", "display:none;"); }
                            // packaging charges
                            if(orderDetails.packaging_charges > 0) {
                                bodyContent = bodyContent.replace("##pack_style##", "");
                                bodyContent = bodyContent.replace("##pack_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.packaging_charges));
                            }
                            else { bodyContent = bodyContent.replace("##pack_style##", "display:none;"); }
                            // discount
                            if(orderDetails.discount_amount > 0) {
                                bodyContent = bodyContent.replace("##discount_style##", "");
                                bodyContent = bodyContent.replace("##discount_amount##", commonService.priceFormat(orderDetails.currency_type, orderDetails.discount_amount));
                            }
                            else { bodyContent = bodyContent.replace("##discount_style##", "display:none;"); }
                            bodyContent = bodyContent.replace("##item_list##", itemList);
                            bodyContent = bodyContent.replace("##sub_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.sub_total));
                            bodyContent = bodyContent.replace("##shipping_cost##", commonService.priceFormat(orderDetails.currency_type, orderDetails.shipping_cost));
                            bodyContent = bodyContent.replace("##grand_total##", commonService.priceFormat(orderDetails.currency_type, orderDetails.final_price));
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            if(orderDetails.shipping_method.delivery_method) {
                                bodyContent = bodyContent.replace("##tracking_style##", "display:none;");
                            }
                            else {
                                bodyContent = bodyContent.replace("##tracking_style##", "");
                                bodyContent = bodyContent.replace("##carrier_name##", orderDetails.shipping_method.name);
                                bodyContent = bodyContent.replace("##tracking_number##", orderDetails.shipping_method.tracking_number);
                                bodyContent = bodyContent.replace("##tracking_link##", orderDetails.shipping_method.tracking_link);
                            }
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been delivered",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
            }
            else {
                reject("Invalid order");
            }
        });
    });
}

exports.sendOrderReviewMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                let customerDetails = {};
                if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                else { customerDetails = orderDetails.customerDetails[0]; }
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                mailTemp.order_review(storeDetails).then((body) => {
                    let bodyContent = body;
                    let filePath = setupConfig.mail_base+storeDetails._id+'/order_review.html';
                    let reviewLink = storeDetails.base_url+'/order-review/'+orderDetails._id;
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) { bodyContent = body; }
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##review_link##", reviewLink);
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: "We’d love to hear from you about your recent order with us!",
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        // if mail specified
                        if(customerEmail) { sendData.sendTo = customerEmail; }
                        // send mail
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    });
                });
            }
            else {
                reject("Invalid order");
            }
        });
    });
}

exports.sendOrderCancelledMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        orderList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let orderDetails = response[0];
                if(orderDetails.order_type!='trial') {
                    let customerDetails = {};
                    if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                    else { customerDetails = orderDetails.customerDetails[0]; }
                    let storeDetails = response[0].storeDetails[0];
                    let mailConfig = setupConfig.mail_config;
                    if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                    let orderCreatedDate = dateFormat(new Date(orderDetails.created_on), "d mmm yyyy");
                    mailTemp.order_cancelled(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/order_cancelled.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                            bodyContent = bodyContent.replace("##order_date##", orderCreatedDate);
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your order with order ID: "+orderDetails.order_number+" has been cancelled",
                                body: bodyContent,
                                cc_mail: storeDetails.email
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                            // if mail specified
                            if(customerEmail) { sendData.sendTo = customerEmail; }
                            // send mail
                            _this.sendMailFromStore(sendData, function(err, response) {
                                if(!err && response) { resolve(true); }
                                else { reject("Email send failed"); }
                            });
                        });
                    });
                }
                else { resolve(true); }
            }
            else { reject("Invalid order"); }
        });
    });
}

exports.sendCustomizationConfirmationMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        resolve(true);
    });
}
/** product mail end **/

/** vendor product mail **/
exports.sendVendorOrderConfirmedMail = function(customerEmail, vendorId, orderId) {
    return new Promise((resolve, reject) => {
        vendor.findOne({ _id: mongoose.Types.ObjectId(vendorId) }, function(err, response) {
            if(!err && response) {
                let vendorDetails = response;
                orderList.aggregate([
                    { $match:
                        { _id: mongoose.Types.ObjectId(orderId), "vendor_list.vendor_id": mongoose.Types.ObjectId(vendorDetails._id) }
                    },
                    { $lookup:
                        {
                           from: 'customers',
                           localField: 'customer_id',
                           foreignField: '_id',
                           as: 'customerDetails'
                        }
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
                    if(!err && response[0]) {
                        let orderDetails = response[0];
                        let customerDetails = {};
                        if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                        else { customerDetails = orderDetails.customerDetails[0]; }
                        let storeDetails = response[0].storeDetails[0];
                        let vendorOrderDetails = orderDetails.vendor_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id))[0];
                        let mailConfig = setupConfig.mail_config;
                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                        // build item list
                        orderDetails.item_list = orderDetails.item_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id));
                        let itemList = "";
                        for(let item of orderDetails.item_list) {
                            itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                        }
                        let currentDate = dateFormat(new Date(vendorOrderDetails.confirmed_on), "mmmm d yyyy")+' at '+dateFormat(new Date(vendorOrderDetails.confirmed_on), "h:MM:ss TT");
                        mailTemp.vendor_order_confirmed(storeDetails).then((body) => {
                            let bodyContent = body;
                            let filePath = setupConfig.mail_base+storeDetails._id+'/vendor_order_confirmed.html';
                            request.get(filePath, function (err, response, body) {
                                if(!err && response.statusCode == 200) { bodyContent = body; }
                                bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                                bodyContent = bodyContent.replace("##confirmed_date##", currentDate);
                                bodyContent = bodyContent.replace("##item_list##", itemList);
                                bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                                let sendData = {
                                    store_name: storeDetails.name,
                                    config: mailConfig,
                                    sendTo: customerDetails.email,
                                    subject: "Your order with order ID: "+orderDetails.order_number+" has been confirmed",
                                    body: bodyContent,
                                    cc_mail: storeDetails.email+", "+vendorDetails.email
                                };
                                if(storeDetails.mail_config.cc_mail) { sendData.sendTo = storeDetails.mail_config.cc_mail }
                                // if mail specified
                                if(customerEmail) { sendData.sendTo = customerEmail; }
                                // send mail
                                _this.sendMailFromStore(sendData, function(err, response) {
                                    if(!err && response) { resolve(true); }
                                    else { reject("Email send failed"); }
                                });
                            });
                        });
                    }
                    else {
                        reject("Invalid order");
                    }
                });
            }
            else { reject("Invalid vendor"); }
        });
    });
}

exports.sendVendorOrderDispatchedMail = function(customerEmail, vendorId, orderId) {
    return new Promise((resolve, reject) => {
        vendor.findOne({ _id: mongoose.Types.ObjectId(vendorId) }, function(err, response) {
            if(!err && response) {
                let vendorDetails = response;
                orderList.aggregate([
                    { $match:
                        { _id: mongoose.Types.ObjectId(orderId), "vendor_list.vendor_id": mongoose.Types.ObjectId(vendorDetails._id) }
                    },
                    { $lookup:
                        {
                           from: 'customers',
                           localField: 'customer_id',
                           foreignField: '_id',
                           as: 'customerDetails'
                        }
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
                    if(!err && response[0]) {
                        let orderDetails = response[0];
                        let customerDetails = {};
                        if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                        else { customerDetails = orderDetails.customerDetails[0]; }
                        let storeDetails = response[0].storeDetails[0];
                        let vendorOrderDetails = orderDetails.vendor_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id))[0];
                        let mailConfig = setupConfig.mail_config;
                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                        // build item list
                        orderDetails.item_list = orderDetails.item_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id));
                        let itemList = "";
                        for(let item of orderDetails.item_list) {
                            itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                        }
                        let currentDate = dateFormat(new Date(vendorOrderDetails.confirmed_on), "mmmm d yyyy")+' at '+dateFormat(new Date(vendorOrderDetails.confirmed_on), "h:MM:ss TT");
                        mailTemp.vendor_order_dispatched(storeDetails).then((body) => {
                            let bodyContent = body;
                            let filePath = setupConfig.mail_base+storeDetails._id+'/vendor_order_dispatched.html';
                            request.get(filePath, function (err, response, body) {
                                if(!err && response.statusCode == 200) { bodyContent = body; }
                                bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                                bodyContent = bodyContent.replace("##confirmed_date##", currentDate);
                                bodyContent = bodyContent.replace("##item_list##", itemList);
                                bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                                let sendData = {
                                    store_name: storeDetails.name,
                                    config: mailConfig,
                                    sendTo: customerDetails.email,
                                    subject: "Your order with order ID: "+orderDetails.order_number+" has been dispatched",
                                    body: bodyContent,
                                    cc_mail: storeDetails.email+", "+vendorDetails.email
                                };
                                if(storeDetails.mail_config.cc_mail) { sendData.sendTo = storeDetails.mail_config.cc_mail }
                                // if mail specified
                                if(customerEmail) { sendData.sendTo = customerEmail; }
                                // send mail
                                _this.sendMailFromStore(sendData, function(err, response) {
                                    if(!err && response) { resolve(true); }
                                    else { reject("Email send failed"); }
                                });
                            });
                        });
                    }
                    else {
                        reject("Invalid order");
                    }
                });
            }
            else { reject("Invalid vendor"); }
        });
    });
}

exports.sendVendorOrderDeliveredMail = function(customerEmail, vendorId, orderId) {
    return new Promise((resolve, reject) => {
        vendor.findOne({ _id: mongoose.Types.ObjectId(vendorId) }, function(err, response) {
            if(!err && response) {
                let vendorDetails = response;
                orderList.aggregate([
                    { $match:
                        { _id: mongoose.Types.ObjectId(orderId), "vendor_list.vendor_id": mongoose.Types.ObjectId(vendorDetails._id) }
                    },
                    { $lookup:
                        {
                           from: 'customers',
                           localField: 'customer_id',
                           foreignField: '_id',
                           as: 'customerDetails'
                        }
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
                    if(!err && response[0]) {
                        let orderDetails = response[0];
                        let customerDetails = {};
                        if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                        else { customerDetails = orderDetails.customerDetails[0]; }
                        let storeDetails = response[0].storeDetails[0];
                        let vendorOrderDetails = orderDetails.vendor_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id))[0];
                        let mailConfig = setupConfig.mail_config;
                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                        // build item list
                        orderDetails.item_list = orderDetails.item_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id));
                        let itemList = "";
                        for(let item of orderDetails.item_list) {
                            itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                        }
                        let currentDate = dateFormat(new Date(vendorOrderDetails.confirmed_on), "mmmm d yyyy")+' at '+dateFormat(new Date(vendorOrderDetails.confirmed_on), "h:MM:ss TT");
                        mailTemp.vendor_order_delivered(storeDetails).then((body) => {
                            let bodyContent = body;
                            let filePath = setupConfig.mail_base+storeDetails._id+'/vendor_order_delivered.html';
                            request.get(filePath, function (err, response, body) {
                                if(!err && response.statusCode == 200) { bodyContent = body; }
                                bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                                bodyContent = bodyContent.replace("##confirmed_date##", currentDate);
                                bodyContent = bodyContent.replace("##item_list##", itemList);
                                bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                                let sendData = {
                                    store_name: storeDetails.name,
                                    config: mailConfig,
                                    sendTo: customerDetails.email,
                                    subject: "Your order with order ID: "+orderDetails.order_number+" has been delivered",
                                    body: bodyContent,
                                    cc_mail: storeDetails.email+", "+vendorDetails.email
                                };
                                if(storeDetails.mail_config.cc_mail) { sendData.sendTo = storeDetails.mail_config.cc_mail }
                                // if mail specified
                                if(customerEmail) { sendData.sendTo = customerEmail; }
                                // send mail
                                _this.sendMailFromStore(sendData, function(err, response) {
                                    if(!err && response) { resolve(true); }
                                    else { reject("Email send failed"); }
                                });
                            });
                        });
                    }
                    else {
                        reject("Invalid order");
                    }
                });
            }
            else { reject("Invalid vendor"); }
        });
    });
}

exports.sendVendorOrderCancelledMail = function(customerEmail, vendorId, orderId) {
    return new Promise((resolve, reject) => {
        vendor.findOne({ _id: mongoose.Types.ObjectId(vendorId) }, function(err, response) {
            if(!err && response) {
                let vendorDetails = response;
                orderList.aggregate([
                    { $match:
                        { _id: mongoose.Types.ObjectId(orderId), "vendor_list.vendor_id": mongoose.Types.ObjectId(vendorDetails._id) }
                    },
                    { $lookup:
                        {
                           from: 'customers',
                           localField: 'customer_id',
                           foreignField: '_id',
                           as: 'customerDetails'
                        }
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
                    if(!err && response[0]) {
                        let orderDetails = response[0];
                        let customerDetails = {};
                        if(orderDetails.order_by=="guest") { customerDetails = { name: orderDetails.shipping_address.name, email: orderDetails.guest_email }; }
                        else { customerDetails = orderDetails.customerDetails[0]; }
                        let storeDetails = response[0].storeDetails[0];
                        let vendorOrderDetails = orderDetails.vendor_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id))[0];
                        let mailConfig = setupConfig.mail_config;
                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                        // build item list
                        orderDetails.item_list = orderDetails.item_list.filter(obj => String(obj.vendor_id)==String(vendorDetails._id));
                        let itemList = "";
                        for(let item of orderDetails.item_list) {
                            itemList += createItemRow(item, orderDetails.currency_type, storeDetails.mail_config.template_config.font_family, storeDetails._id);
                        }
                        let currentDate = dateFormat(new Date(vendorOrderDetails.confirmed_on), "mmmm d yyyy")+' at '+dateFormat(new Date(vendorOrderDetails.confirmed_on), "h:MM:ss TT");
                        mailTemp.vendor_order_cancelled(storeDetails).then((body) => {
                            let bodyContent = body;
                            let filePath = setupConfig.mail_base+storeDetails._id+'/vendor_order_cancelled.html';
                            request.get(filePath, function (err, response, body) {
                                if(!err && response.statusCode == 200) { bodyContent = body; }
                                bodyContent = bodyContent.replace("##order_number##", orderDetails.order_number);
                                bodyContent = bodyContent.replace("##confirmed_date##", currentDate);
                                bodyContent = bodyContent.replace("##item_list##", itemList);
                                bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                                let sendData = {
                                    store_name: storeDetails.name,
                                    config: mailConfig,
                                    sendTo: customerDetails.email,
                                    subject: "Your order with order ID: "+orderDetails.order_number+" has been cancelled",
                                    body: bodyContent,
                                    cc_mail: storeDetails.email+", "+vendorDetails.email
                                };
                                if(storeDetails.mail_config.cc_mail) { sendData.sendTo = storeDetails.mail_config.cc_mail }
                                // if mail specified
                                if(customerEmail) { sendData.sendTo = customerEmail; }
                                // send mail
                                _this.sendMailFromStore(sendData, function(err, response) {
                                    if(!err && response) { resolve(true); }
                                    else { reject("Email send failed"); }
                                });
                            });
                        });
                    }
                    else {
                        reject("Invalid order");
                    }
                });
            }
            else { reject("Invalid vendor"); }
        });
    });
}
/** vendor product mail end **/

/** giftcard mail **/
exports.sendGiftCardMail = function(email, couponId) {
    return new Promise((resolve, reject) => {
        couponCodes.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(couponId) }
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
            if(!err && response[0]) {
                let couponDetails = response[0];
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                let currentDate = dateFormat(new Date(couponDetails.created_on), "mmmm d yyyy")+' at '+dateFormat(new Date(couponDetails.created_on), "h:MM:ss TT");
                mailTemp.giftcard_coupon(storeDetails).then((body) => {
                    let bodyContent = body;
                    let filePath = setupConfig.mail_base+storeDetails._id+'/giftcard_coupon.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) { bodyContent = body; }
                        bodyContent = bodyContent.replace("##to_name##", couponDetails.to_name);
                        bodyContent = bodyContent.replace("##from_name##", couponDetails.from_name);
                        bodyContent = bodyContent.replace("##from_name##", couponDetails.from_name);
                        bodyContent = bodyContent.replace("##giftcard_img##", couponDetails.image);
                        bodyContent = bodyContent.replace("##coupon_price##", commonService.priceFormat(couponDetails.currency_type, couponDetails.price));
                        bodyContent = bodyContent.replace("##coupon_price##", commonService.priceFormat(couponDetails.currency_type, couponDetails.price));
                        bodyContent = bodyContent.replace("##coupon_code##", couponDetails.code);
                        bodyContent = bodyContent.replace("##current_date##", currentDate);
                        bodyContent = bodyContent.replace("##message##", couponDetails.message);
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: email,
                            subject: storeDetails.name+": Gift Card",
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    });
                });
            }
            else {
                reject("Invalid coupon");
            }
        });
    });
}

exports.sendGiftCardPurchaseMail = function(couponId) {
    return new Promise((resolve, reject) => {
        couponCodes.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(couponId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let couponDetails = response[0];
                let customerDetails = response[0].customerDetails[0];
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                let currentDate = dateFormat(new Date(couponDetails.created_on), "mmmm d yyyy")+' at '+dateFormat(new Date(couponDetails.created_on), "h:MM:ss TT");
                // purchase mail
                mailTemp.giftcard_purchased(storeDetails).then((body) => {
                    let bodyContent = body;
                    let filePath = setupConfig.mail_base+storeDetails._id+'/giftcard_purchased.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) { bodyContent = body; }
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##coupon_price##", commonService.priceFormat(couponDetails.currency_type, couponDetails.price));
                        bodyContent = bodyContent.replace("##to_name##", couponDetails.to_name);
                        bodyContent = bodyContent.replace("##current_date##", currentDate);
                        bodyContent = bodyContent.replace("##coupon_price##", commonService.priceFormat(couponDetails.currency_type, couponDetails.price));
                        bodyContent = bodyContent.replace("##to_name##", couponDetails.to_name);
                        bodyContent = bodyContent.replace("##message##", couponDetails.message);
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: storeDetails.name+": Gift Card",
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        _this.sendMailFromStore(sendData, function(err, response) {
                            // coupon code mail
                            mailTemp.giftcard_coupon(storeDetails).then((body) => {
                                let bodyContent = body;
                                let filePath = setupConfig.mail_base+storeDetails._id+'/giftcard_coupon.html';
                                request.get(filePath, function (err, response, body) {
                                    if(!err && response.statusCode == 200) { bodyContent = body; }
                                    bodyContent = bodyContent.replace("##to_name##", couponDetails.to_name);
                                    bodyContent = bodyContent.replace("##from_name##", couponDetails.from_name);
                                    bodyContent = bodyContent.replace("##coupon_price##", commonService.priceFormat(couponDetails.currency_type, couponDetails.price));
                                    bodyContent = bodyContent.replace("##coupon_price##", commonService.priceFormat(couponDetails.currency_type, couponDetails.price));
                                    bodyContent = bodyContent.replace("##coupon_code##", couponDetails.code);
                                    bodyContent = bodyContent.replace("##current_date##", currentDate);
                                    bodyContent = bodyContent.replace("##message##", couponDetails.message);
                                    bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                                    let sendData = {
                                        store_name: storeDetails.name,
                                        config: mailConfig,
                                        sendTo: couponDetails.to_email,
                                        subject: storeDetails.name+": Gift Card",
                                        body: bodyContent,
                                        cc_mail: storeDetails.email
                                    };
                                    if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                                    _this.sendMailFromStore(sendData, function(err, response) {
                                        resolve(true);
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else {
                reject("Invalid coupon");
            }
        });
    });
}
/** giftcard mail end **/

/** donation mail **/
exports.sendDonationMail = function(customerEmail, orderId) {
    return new Promise((resolve, reject) => {
        donationList.aggregate([
            { $match:
                { _id: mongoose.Types.ObjectId(orderId) }
            },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
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
            if(!err && response[0]) {
                let donationDetails = response[0];
                let customerDetails = response[0].customerDetails[0];
                let storeDetails = response[0].storeDetails[0];
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                let currentDate = dateFormat(new Date(donationDetails.created_on), "mmmm d yyyy")+' at '+dateFormat(new Date(donationDetails.created_on), "h:MM:ss TT");
                mailTemp.donation(storeDetails).then((body) => {
                    let bodyContent = body;
                    let filePath = setupConfig.mail_base+storeDetails._id+'/donation.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) { bodyContent = body; }
                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                        bodyContent = bodyContent.replace("##current_date##", currentDate);
                        bodyContent = bodyContent.replace("##donation_amount##", commonService.priceFormat(donationDetails.currency_type, donationDetails.price));
                        bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                        let sendData = {
                            store_name: storeDetails.name,
                            config: mailConfig,
                            sendTo: customerDetails.email,
                            subject: storeDetails.name+": We Have Received a Donation from You, Thank You!",
                            body: bodyContent,
                            cc_mail: storeDetails.email
                        };
                        if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                        // if mail specified
                        if(customerEmail) { sendData.sendTo = customerEmail; }
                        // send mail
                        _this.sendMailFromStore(sendData, function(err, response) {
                            if(!err && response) { resolve(true); }
                            else { reject("Email send failed"); }
                        });
                    });
                });
            }
            else {
                reject("Invalid coupon");
            }
        });
    });
}

function createQuotItemRow(productDetails, currencyType, fontFamily, storeId) {
    let proData = "";
    proData += "<tr style='vertical-align:top;'>";
    proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left:20px;'>"+
    productDetails.name;
    // variants
    if(productDetails.variant_status && productDetails.variant_types.length) {
        let variantTypes = productDetails.variant_types;
        for(let j=0; j<variantTypes.length; j++) {
            proData += "<p style='margin:0; padding-left:10px; font-size:0.875rem; font-weight:500; color:#000;'>";
            proData += "<strong>"+variantTypes[j].name+":</strong> "+variantTypes[j].value+"</p>";
        }
    }
    // addons
    if(productDetails.addon_status && productDetails.selected_addon) {
        proData += "<p style='margin:0; padding-left:10px; font-size:0.875rem; font-weight:500; color:#000;'>";
        proData += "<strong>Addons:</strong> "+productDetails.selected_addon.name+"</p>";
    }
    proData += "</td>";
    proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 40px;'>"+productDetails.quantity+"</td>";
    proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 40px;'>"+commonService.priceFormat(currencyType, productDetails.final_price)+"</td>";
    proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 40px;'>"+commonService.priceFormat(currencyType, productDetails.revised_final_price)+"</td>";
    proData += "</tr>";
    return proData;
}

function createItemRow(productDetails, currencyType, fontFamily, storeId) {
    let proData = "";
    if(storeId=='607a6edd0e7a3b69278c05ea') {
        proData += "<tr style='vertical-align:top;'>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left:0px;'>"+
        productDetails.name;
        // variants
        if(productDetails.variant_status && productDetails.variant_types.length) {
            let variantTypes = productDetails.variant_types;
            for(let j=0; j<variantTypes.length; j++) {
                proData += "<p style='margin:0; padding-left:10px; font-size:0.875rem; font-weight:500; color:#000;'>";
                proData += "<strong>"+variantTypes[j].name+":</strong> "+variantTypes[j].value+"</p>";
            }
        }
        // addons
        if(productDetails.addon_status && productDetails.selected_addon) {
            proData += "<p style='margin:0; padding-left:10px; font-size:0.875rem; font-weight:500; color:#000;'>";
            proData += "<strong>Addons:</strong> "+productDetails.selected_addon.name+"</p>";
        }
        proData += "</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 1.5rem;'>"+productDetails.sku+"</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 1.5rem;'>"+commonService.priceFormat(currencyType, productDetails.final_price)+"</td>";
    }
    else if(storeId=='5fbcac07fd6ce3538c2cf355') {
        proData += "<tr style='vertical-align:top; word-break: break-all;word-wrap: break-word;'>";
        proData += "<td colspan='4' style='font-family:"+fontFamily+"!important; border-bottom:0px solid #f2f2f2; color:#000; font-size:9px; padding-top:10px; font-weight:400; line-height:1.5rem; padding-left:20px;'>"+
        productDetails.name;
        // variants
        if(productDetails.variant_status && productDetails.variant_types.length) {
            let variantTypes = productDetails.variant_types;
            for(let j=0; j<variantTypes.length; j++) {
                proData += "<p style='margin:0; padding-left:10px; font-size:9px; font-weight:400; color:#000;'>";
                proData += "<strong>"+variantTypes[j].name+":</strong> "+variantTypes[j].value+"</p>";
            }
        }
        // addons
        if(productDetails.addon_status && productDetails.selected_addon) {
            proData += "<p style='margin:0; padding-left:10px; font-size:9px; font-weight:400; color:#000;'>";
            proData += "<strong>Addons:</strong> "+productDetails.selected_addon.name;
            if(productDetails.customization_status && productDetails.customized_model) {
                proData += " - "+productDetails.customized_model.name;
            }
            proData += "</p>";
        }
        proData += "</td></tr>";
        proData += "<tr style='vertical-align:top; word-break: break-all;word-wrap: break-word;'><td>&nbsp;</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:9px; padding-top:0px; font-weight:400; line-height:1.5rem; padding-left: 32px;'>"+productDetails.sku+"</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:9px; padding-top:0px; font-weight:400; line-height:1.5rem; padding-left: 32px;'>"+productDetails.quantity+"</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:9px; padding-top:0px; font-weight:400; line-height:1.5rem; padding-left: 32px;'>"+commonService.priceFormat(currencyType, productDetails.final_price)+"</td>";
    }
    else {
        proData += "<tr style='vertical-align:top;'>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left:20px;'>"+
        productDetails.name;
        // variants
        if(productDetails.variant_status && productDetails.variant_types.length) {
            let variantTypes = productDetails.variant_types;
            for(let j=0; j<variantTypes.length; j++) {
                proData += "<p style='margin:0; padding-left:10px; font-size:0.875rem; font-weight:500; color:#000;'>";
                proData += "<strong>"+variantTypes[j].name+":</strong> "+variantTypes[j].value+"</p>";
            }
        }
        // addons
        if(productDetails.addon_status && productDetails.selected_addon) {
            proData += "<p style='margin:0; padding-left:10px; font-size:0.875rem; font-weight:500; color:#000;'>";
            proData += "<strong>Addons:</strong> "+productDetails.selected_addon.name+"</p>";
        }
        proData += "</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 40px;'>"+productDetails.sku+"</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 40px;'>"+productDetails.quantity+"</td>";
        proData += "<td style='font-family:"+fontFamily+"!important; border-bottom:1px solid #f2f2f2; color:#000; font-size:1rem; padding-top:10px; font-weight:500; line-height:2rem; padding-left: 40px;'>"+commonService.priceFormat(currencyType, productDetails.final_price)+"</td>";
    }
    proData += "</tr>";
    return proData;
}