"use strict";
const mongoose = require('mongoose');
const quickOrders = require("../../models/quick_orders.model");

exports.list = (req, res) => {
    if(req.query.id) {
        quickOrders.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, data: response });
            }
            else {
                res.json({ status: false, error: err, message: "failure" });
            }
        });
    }
    else {
        quickOrders.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response });
            }
            else {
                res.json({ status: false, error: err, message: "failure" });
            }
        });
    }
}

exports.add = (req, res) => {
    req.body.store_id = req.id;
    quickOrders.create(req.body, function(err, response) {
        if(!err && response) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Unable to add" });
        }
    });
}

exports.update = (req, res) => {
    quickOrders.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: req.body }, function(err, response) {
        if(!err) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Unable to update" });
        }
    });
}

exports.hard_remove = (req, res) => {
    quickOrders.findOneAndRemove({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Unable to delete" });
        }
    });
}