"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");

exports.list = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.payment_types }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let payList = response.payment_types;
            // inc rank
            payList.forEach((object) => {
                if(req.body.rank<=object.rank) {
                    object.rank = object.rank+1;
                }
            });
            // add
            payList.push(req.body);
            store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
            { $set: { payment_types: payList } }, { new: true }, function(err, response) {
                if(!err) { res.json({ status: true, list: response.payment_types }); }
                else { res.json({ status: false, error: err, message: "Unable to add" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.update = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let payList = response.payment_types;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                payList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                payList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = payList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                // update
                payList[index] = req.body;
                store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                { $set: { payment_types: payList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.payment_types }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid payment gateway", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.soft_remove = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let payList = response.payment_types;
            // dec rank
            payList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = payList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                payList.splice(index, 1);
                // update
                store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                { $set: { payment_types: payList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.payment_types }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid FAQ", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}