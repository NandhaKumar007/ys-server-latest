"use strict";
const mongoose = require('mongoose');
const customer = require("../../models/customer.model");
const quotation = require("../../models/quotation.model");
const mailService = require("../../../services/mail.service");
const commonService = require("../../../services/common.service");

exports.create = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            req.body.customer_id = customerDetails._id;
            req.body.customer_name = customerDetails.name;
            req.body.quot_number = commonService.orderNumber();
            if(customerDetails.unique_id) {
                req.body.quot_number = req.body.quot_number+'-'+customerDetails.unique_id;
            }
            req.body.status = "active";
            quotation.create(req.body, function(err, response) {
                if(!err && response)
                {
                    let orderDetails = response;
                    // unset checkout details
                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerDetails._id) },
                    { $set: { cart_list: [] }, $unset: { checkout_details: "" } }, function(err, response) { });
                    // quotation placed mail
                    mailService.sendQuotPlacedMail(null, orderDetails._id);
                    // response
                    let sendData = { order_type: "quotation", order_id: orderDetails._id };
                    res.json({ status: true, data: sendData });
                }
                else { res.json({ status: false, error: err, message: "Unable to create quotation" }); }
            });
        }
        else { res.json({ status: false, message: "Invalid user" }); }
    });
}

// quotation list & details
exports.details = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let customerDetails = response;
            if(req.query.order_id)
            {
                quotation.findOne({
                    _id: mongoose.Types.ObjectId(req.query.order_id), store_id: mongoose.Types.ObjectId(customerDetails.store_id),
                    customer_id: mongoose.Types.ObjectId(req.id)
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
                let queryParams = {};
                // live orders
                if(req.query.type=='live') {
                    queryParams = {
                        store_id: mongoose.Types.ObjectId(customerDetails.store_id), customer_id: mongoose.Types.ObjectId(req.id),
                        status: 'active', quot_status: { $in: [ 'placed', 'processing' ] }
                    };
                }
                // confirmed orders
                else if(req.query.type=='confirmed') {
                    queryParams = {
                        store_id: mongoose.Types.ObjectId(customerDetails.store_id), customer_id: mongoose.Types.ObjectId(req.id),
                        status: 'active', quot_status: 'confirmed'
                    };
                }
                // cancelled
                else {
                    queryParams = {
                        store_id: mongoose.Types.ObjectId(customerDetails.store_id), customer_id: mongoose.Types.ObjectId(req.id),
                        status: 'active', quot_status: 'cancelled'
                    };
                }
                quotation.aggregate([
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
        }
        else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
}