"use strict";
const mongoose = require('mongoose');
const shipping = require("../../models/shipping_methods.model");
const delivery = require("../../models/delivery_methods.model");
const storeProperties = require("../../models/store_properties.model");

exports.list = (req, res) => {
    if(req.query.id) {
        shipping.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else if(req.query.vendor_id) {
        shipping.find({ store_id: mongoose.Types.ObjectId(req.id), vendor_id: mongoose.Types.ObjectId(req.query.vendor_id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        shipping.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

exports.details = (req, res) => {
    shipping.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    req.body.store_id = req.id;
    if(req.body.vendor_id) {
        shipping.findOne({ shipping_type: req.body.shipping_type, vendor_id: mongoose.Types.ObjectId(req.body.vendor_id) }, function(err, response) {
            if(!err && !response) {
                shipping.create(req.body, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
            else { res.json({ status: false, error: err, message: req.body.shipping_type+" Shipping already exists" }); }
        });
    }
    else {
        shipping.create(req.body, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Unable to add" }); }
        });
    }
}

exports.update = (req, res) => {
    shipping.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: req.body }, function(err, response) {
        if(!err) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Invalid login" }); }
    });
}

exports.hard_remove = (req, res) => {
    shipping.findOneAndRemove({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

/** delivery methods start **/
exports.delivery_details = (req, res) => {
    delivery.findOne({ store_id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "not found" }); }
    });
}

exports.update_delivery = (req, res) => {
    delivery.findOne({ store_id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
        if(!err && response)
        {
            delivery.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
            { $set: req.body }, { new: true }, function(err, response) {
                if(!err && response) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "Invalid login" }); }
            });
        }
        else {
            req.body.store_id = req.id;
            delivery.create(req.body, function(err, response) {
                if(!err && response) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "Unable to add" }); }
            });
        }
    });
}
/** delivery methods end **/

/** pincodes **/
exports.pincodes = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.pincodes }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.update_pincodes = (req, res) => {
    storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) }, { $set: { "pincodes": req.body.list } }, { new: true }, function(err, response) {
        if(!err) { res.json({ status: true, list: response.pincodes }); }
        else { res.json({ status: false, error: err, message: "Invalid login" }); }
    });
}
/** pincodes **/