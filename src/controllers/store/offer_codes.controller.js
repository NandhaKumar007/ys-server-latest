"use strict";
const mongoose = require('mongoose');
const offer = require("../../models/offer_codes.model");

exports.list = (req, res) => {
    offer.find({ store_id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.details = (req, res) => {
    offer.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.add = (req, res) => {
    offer.findOne({ store_id: mongoose.Types.ObjectId(req.id), code: req.body.code, status: "active" }, function(err, response) {
        if(!err && !response)
        {
            req.body.store_id = req.id;
            if(req.body.code_type=='auto_discount') {
                offer.findOne({ store_id: mongoose.Types.ObjectId(req.id), code_type: "auto_discount", status: "active", enable_status: true }, function(err, response) {
                    if(!err && !response) {
                        offer.create(req.body, function(err, response) {
                            if(!err, response) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Unable to create offer" }); }
                        });
                    }
                    else {
                        res.json({ status: false, message: "Active auto discount code already exists" });
                    }
                });
            }
            else {
                offer.create(req.body, function(err, response) {
                    if(!err, response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to create offer" }); }
                });
            }
        }
        else {
            res.json({ status: false, message: "Code already exists" });
        }
    });
}

exports.update = (req, res) => {
    req.body.updated_on = new Date();
    offer.findOne({ store_id: mongoose.Types.ObjectId(req.id), code: req.body.code, status: 'active', _id: { $ne: mongoose.Types.ObjectId(req.body._id) } }, function(err, response) {
        if(!err && !response)
        {
            if(req.body.code_type=='auto_discount') {
                offer.findOne({ store_id: mongoose.Types.ObjectId(req.id), code_type: "auto_discount", status: "active", enable_status: true, _id: { $ne: mongoose.Types.ObjectId(req.body._id) } }, function(err, response) {
                    if(!err && !response) {
                        offer.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                        { $set: req.body }, function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Invalid login" }); }
                        });
                    }
                    else {
                        res.json({ status: false, message: "Active auto discount code already exists" });
                    }
                });
            }
            else {
                offer.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: req.body }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Invalid login" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Code already exists" });
        }
    });
}

exports.soft_remove = (req, res) => {
    offer.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: { "status": "inactive" } }, function(err, response) {
        if(!err) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}