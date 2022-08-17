"use strict";
const mongoose = require('mongoose');
const request = require('request');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const orderList = require('../src/models/order_list.model');
const couponList = require('../src/models/coupon_codes.model');
const donationList = require('../src/models/donation_list.model');
const paymentDetails = require("../src/models/payment_details.model");

/** Razorpay payment status (inactive orders) **/
exports.razorpayPaymentStatus = function(orderDetails, paymentConfig, orderType) {
    return new Promise((resolve, reject) => {
        let instance = new Razorpay(paymentConfig);
        instance.orders.fetch(orderDetails.payment_details.order_id, function(err, paymentData) {
            if(!err && paymentData) {
                // update order status
                if(orderType=='product') {
                    orderList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.status": paymentData.status } }, function(err, response) { });
                }
                else if(orderType=='giftcard') {
                    couponList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.status": paymentData.status } }, function(err, response) { });
                }
                else if(orderType=='donation') {
                    donationList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.status": paymentData.status } }, function(err, response) { });
                }
                // if order status success
                if(paymentData.status=='paid')
                {
                    let payDetails = {
                        store_id: orderDetails.store_id, order_id: orderDetails._id, payment_method: "Razorpay",
                        payment_status: 'manual-success', payment_details: paymentData
                    };
                    // payment details
                    paymentDetails.create(payDetails, function(err, response) {
                        resolve(paymentData);
                    });
                }
                else {
                    reject({ message: paymentData });
                }
            }
            else {
                reject({ error: err, message: 'Invalid Razorpay Order' });
            }
        });
    });
};

/** Razorpay payment status (inactive payments) **/
exports.razorpayPaymentStatusForYS = function(orderDetails, paymentConfig) {
    return new Promise((resolve, reject) => {
        let instance = new Razorpay(paymentConfig);
        instance.orders.fetch(orderDetails.payment_order_id, function(err, paymentData) {
            if(!err && paymentData) {
                // update order status
                // if(orderDetails.type=='client_signup') {
                //     ysClientPayments.findByIdAndUpdate(orderDetails._id, { $set: { payment_status: paymentData.status } }, function(err, response) { });
                // }
                // if order status success
                if(paymentData.status=='paid') {
                    resolve(paymentData);
                }
                else {
                    reject({ message: paymentData });
                }
            }
            else {
                reject({ error: err, message: 'Invalid Razorpay Order' });
            }
        });
    });
};

/** CCAvenue payment status (inactive orders) **/
exports.ccavenuePaymentStatus = function(orderDetails, paymentConfig, orderType) {
    return new Promise((resolve, reject) => {
        let encData = encrypt('|'+orderDetails.order_number+'|', paymentConfig.working_key);
        let params = 'enc_request='+encData+'&access_code='+paymentConfig.access_code+'&command=orderStatusTracker&request_type=STRING&response_type=JSON&version=1.2'
        request.post({ url: 'https://api.ccavenue.com/apis/servlet/DoWebTrans?'+params }, function (err, response, body) {
            // ccavenue response
            if(!err && body) {
                let bodyContent = body.split('&');
                if(bodyContent.length > 1)
                {
                    if(bodyContent[0]=="status=0")
                    {
                        let encResponse = bodyContent[1].replace("enc_response=", "");
                        let decryptData = decrypt(encResponse, paymentConfig.working_key);
                        let paymentData = JSON.parse(decryptData);
                        // update order status
                        if(orderType=='product') {
                            orderList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.status": paymentData.order_status } }, function(err, response) { });
                        }
                        else if(orderType=='giftcard') {
                            couponList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.status": paymentData.order_status } }, function(err, response) { });
                        }
                        else if(orderType=='donation') {
                            donationList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.status": paymentData.order_status } }, function(err, response) { });
                        }
                        // if order status success
                        if(paymentData.order_status=='Shipped' || paymentData.order_status=='Successful')
                        {
                            let payDetails = {
                                store_id: orderDetails.store_id, order_id: orderDetails._id, payment_method: "CCAvenue",
                                payment_status: 'manual-success', payment_details: paymentData
                            };
                            // payment details
                            paymentDetails.create(payDetails, function(err, response) {
                                resolve(paymentData);
                            });
                        }
                        else {
                            reject({ message: paymentData, msg_type: "decrypted data" });
                        }
                    }
                    else {
                        reject({ message: bodyContent[0], msg_type: "status!=0" });
                    }  
                }
                else {
                    reject({ message: body, msg_type: "cannot split" });
                }
            }
            else {
                reject({ message: err, msg_type: "ccavenue request error" });
            }
        });
    });
}

function encrypt(data, workingKey) {
    var m = crypto.createHash('md5');
    m.update(workingKey);
    var key = m.digest();
    var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';    
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    var encoded = cipher.update(data,'utf8','hex');
    encoded += cipher.final('hex');
    return encoded;
};

function decrypt(encText, workingKey) {
    var m = crypto.createHash('md5');
    m.update(workingKey)
    var key = m.digest();
    var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';    
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var decoded = decipher.update(encText,'hex','utf8');
    decoded += decipher.final('utf8');
    return decoded;
};
/** ## CCAvenue payment status ## **/