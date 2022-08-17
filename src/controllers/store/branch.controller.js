"use strict";
const mongoose = require('mongoose');
const storeProperties = require("../../models/store_properties.model");

exports.list = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.branches }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let locList = response.branches;
            let index = locList.findIndex(object => object.name==req.body.name);
            if(index==-1)
            {
                // inc rank
                locList.forEach((object) => {
                    if(req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
                // add
                locList.push(req.body);
                storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { branches: locList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.branches }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
            else {
                res.json({ status: false, error: err, message: "Name already exists" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.update = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let locList = response.branches;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                locList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                locList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = locList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                // update
                locList[index] = req.body;
                storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { branches: locList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.branches }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid Location", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.soft_remove = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let locList = response.branches;
            // dec rank
            locList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = locList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                locList.splice(index, 1);
                // update
                storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { branches: locList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.branches }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid Location", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}