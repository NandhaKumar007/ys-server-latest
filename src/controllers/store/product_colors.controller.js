"use strict";
const mongoose = require('mongoose');
const productFeatures = require("../../models/product_features.model");

exports.list = (req, res) => {
    productFeatures.findOne({ store_id: req.id }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.color_list }); }
        else { res.json({ status: false, error: err, message: "Invalid store" }); }
    });
}

exports.add = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $push: { color_list: req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.color_list }); }
        else { res.json({ status: false, error: err, message: "Unable to add" }); }
    });
}

exports.update = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "color_list._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "color_list.$": req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.color_list }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.soft_remove = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $pull: { "color_list" : { _id: mongoose.Types.ObjectId(req.body._id) } } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.color_list }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}