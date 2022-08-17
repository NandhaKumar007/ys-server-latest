"use strict";
const mongoose = require('mongoose');
const customer = require("../../models/customer.model");
const donationList = require("../../models/donation_list.model");
const createPayment = require("../../../services/create_payment.service");
const commonService = require("../../../services/common.service");

exports.create = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
        	req.body.store_id = customerDetails.store_id;
            req.body.customer_id = req.id;
            req.body.order_number = commonService.orderNumber();
            if(customerDetails.unique_id) {
                req.body.order_number = req.body.order_number+'-'+customerDetails.unique_id;
            }
            donationList.create(req.body, function(err, response) {
                if(!err && response) {
                    let orderDetails = response;
                    orderDetails.customer_name = customerDetails.name;
                    orderDetails.customer_email = customerDetails.email;
                    // create payment
                    if(orderDetails.payment_details.name=="Razorpay")
                    {
                        createPayment.createRazorpayForDonation(orderDetails, function(err, response) {
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
                        createPayment.createPaypalForDonation(orderDetails, function(err, response) {
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
                            order_type: "donation",
                            payment_method: 'CCAvenue',
                            order_details: orderDetails,
                            order_id: orderDetails._id,
                            order_number: orderDetails.order_number,
                            currency: orderDetails.currency_type.country_code,
                            amount: Number(orderDetails.price)
                        };
                        res.json({ status: true, data: sendData });
                    }
                    else if(orderDetails.payment_details.name=="Square")
                    {
                        let sendData = {
                            order_type: "donation",
                            payment_method: 'Square',
                            order_id: orderDetails._id,
                            order_number: orderDetails.order_number,
                            currency: orderDetails.currency_type.country_code,
                            amount: Number(orderDetails.price)
                        };
                        res.json({ status: true, data: sendData });
                    }
                    else if(orderDetails.payment_details.name=="Fatoorah")
                    {
                        orderDetails.fatoorah_pay_id = req.body.fatoorah_pay_id;
                        createPayment.createFatoorahForDonation(orderDetails, function(err, response) {
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
                        createPayment.createTelrForDonation(orderDetails, function(err, response) {
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
                        createPayment.createFoloosiForDonation(orderDetails, function(err, response) {
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
                    res.json({ status: false, error: err, message: "Unable to create order" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
}

exports.details = (req, res) => {
    donationList.findOne({ customer_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.order_id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        } else {
            res.json({ status: false, message: "Invalid user" });
        }
    });
}