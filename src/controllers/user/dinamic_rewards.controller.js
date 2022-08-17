"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const dinamicRewards = require("../../models/dinamic_rewards.model");
const createPayment = require("../../../services/create_payment.service");
const commonService = require("../../../services/common.service");

exports.create = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            req.body.customer_id = req.id;
            req.body.store_id = req.query.store_id;
            req.body.order_number = commonService.orderNumber();
            dinamicRewards.create(req.body, function(err, response) {
                if(!err && response) {
                    let orderDetails = response;
                    // create payment
                    if(orderDetails.payment_details.name=="Razorpay")
                    {
                        createPayment.createRazorpayForDinamicOffer(orderDetails, function(err, response) {
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
                    res.json({ status: false, error: err, message: "Unable to create offer" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid store" });
        }
    });
}

exports.list = (req, res) => {
    if(req.query._id) {
        dinamicRewards.findOne({ _id: mongoose.Types.ObjectId(req.query._id), status: "active" }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        dinamicRewards.find({ customer_id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

