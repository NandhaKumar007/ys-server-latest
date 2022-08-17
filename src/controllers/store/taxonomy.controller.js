"use strict";
const mongoose = require('mongoose');
const productFeatures = require("../../models/product_features.model");

exports.list = (req, res) => {
    productFeatures.findOne({ store_id: req.id }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.taxonomy.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Invalid store" }); }
    });
}

exports.add = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $push: { taxonomy: req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.taxonomy.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Unable to add" }); }
    });
}

exports.update = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "taxonomy._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "taxonomy.$": req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.taxonomy.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.soft_remove = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "taxonomy._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "taxonomy.$.status": "inactive" } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.taxonomy.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}