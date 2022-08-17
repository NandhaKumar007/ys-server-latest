"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const couponCodes = require("../../models/coupon_codes.model");
const mailService = require("../../../services/mail.service");
const commonService = require("../../../services/common.service");

exports.list = (req, res) => {
    couponCodes.aggregate([
        { $match : {
                store_id: mongoose.Types.ObjectId(req.id),
                status: { $ne: "inactive" },
                created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
            }
        },
        {
            $lookup: { from: "customers", localField: "customer_id", foreignField: "_id", as: "customerDetails" }
        }
    ], function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.details = (req, res) => {
    couponCodes.aggregate([
        { $match : {
                store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id)
            }
        },
        {
            $lookup: { from: "customers", localField: "customer_id", foreignField: "_id", as: "customerDetails" }
        }
    ], function(err, response) {
        if(!err && response[0]) {
            res.json({ status: true, data: response[0] });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let randomCode = commonService.giftCouponCode(12);
            req.body.code = randomCode.match(/.{1,4}/g).join("-");
            couponCodes.findOne({ store_id: mongoose.Types.ObjectId(req.id), code: req.body.code }, function(err, response) {
                if(!err && !response)
                {
                    req.body.store_id = req.id;
                    req.body.customer_id = req.id;
                    req.body.expiry_on = new Date().setMonth(new Date().getMonth() + parseFloat(req.body.gc_validity_in_month));
                    req.body.order_number = commonService.orderNumber();
                    req.body.balance = req.body.price;
                    req.body.invoice_number = "";
                    if(storeDetails.invoice_status) {
                        req.body.invoice_number = commonService.invoiceNumber(storeDetails.invoice_config);
                    }
                    couponCodes.create(req.body, function(err, response) {
                        if(!err, response) {
                            // update next invoice no
                            if(req.body.invoice_number) {
                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                            }
                            // send mail
                            mailService.sendGiftCardMail(response.to_email, response._id).then(result => {
                                res.json({ status: true });
                            }).catch(function(error) {
                                res.json({ status: false, message: error });
                            });
                        }
                        else {
                            res.json({ status: false, error: err, message: "Unable to create coupon" });
                        }
                    });
                }
                else {
                    res.json({ status: false, message: "Try again after sometime" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid store" });
        }
    });
}

exports.update = (req, res) => {
    couponCodes.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: req.body }, function(err, response) {
        if(!err && response) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.soft_remove = (req, res) => {
    couponCodes.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: { status: "deactivated" } }, function(err, response) {
        if(!err && response) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.resend_email = (req, res) => {
    couponCodes.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            mailService.sendGiftCardMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid coupon" });
        }
    });
}