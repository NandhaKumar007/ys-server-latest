"use strict";
const mongoose = require('mongoose');
const vendorFeatures = require("../../models/vendor_features.model");
const productFeatures = require("../../models/product_features.model");
const e = require('cors');

exports.list = (req, res) => {
    if(req.login_type=='vendor' || req.query.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.query.vendor_id) { vendorId = req.query.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { size_chart: 1 }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, list: [] }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { size_chart: 1 }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, error: err, message: "Invalid store" }); }
        });
    }
    
}

exports.add = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { size_chart: 1 }, function(err, response) {
            if(!err && response) {
                vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                { $push: { size_chart: req.body } }, { new: true }, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
                    }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
            else {
                vendorFeatures.create({ store_id: req.id, _id: vendorId, size_chart: [req.body] }, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
                    }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
        });
    }
    else {
        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
        { $push: { size_chart: req.body } }, { new: true }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, error: err, message: "Unable to add" }); }
        });
    }
    
}

exports.update = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOneAndUpdate({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId),
            "size_chart._id": mongoose.Types.ObjectId(req.body._id)
        },
        { $set: { "size_chart.$": req.body } }, { new: true }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "size_chart._id": mongoose.Types.ObjectId(req.body._id) },
        { $set: { "size_chart.$": req.body } }, { new: true }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }  
}

exports.soft_remove = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOneAndUpdate({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId),
            "size_chart._id": mongoose.Types.ObjectId(req.body._id)
        },
        { $set: { "size_chart.$.status": "inactive" } }, { new: true }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "size_chart._id": mongoose.Types.ObjectId(req.body._id) },
        { $set: { "size_chart.$.status": "inactive" } }, { new: true }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response.size_chart.filter(obj => obj.status=='active') });
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}