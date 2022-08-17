"use strict";
const mongoose = require('mongoose');
const collections = require("../../models/collection.model");

exports.list = (req, res) => {
    collections.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.details = (req, res) => {
    collections.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add = (req, res) => {
	req.body.store_id = req.id;
	collections.findOne({ store_id: mongoose.Types.ObjectId(req.id), name: req.body.name }, function(err, response) {
        if(!err && !response)
        {
            // inc rank
            collections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gte: req.body.rank } },
            { $inc: { "rank": 1 } }, function(err, response) {
                // add
                collections.create(req.body, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Name already exists" });
        }
    });
}

exports.update = (req, res) => {
	collections.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                collections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                { $inc: { "rank": -1 } }, function(err, response) {
                    // update
                    collections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                collections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
                { $inc: { "rank": 1 } }, function(err, response) {
                    // update
                    collections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else {
                // update
                collections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid collection" });
        }
    });
}

exports.soft_remove = (req, res) => {
	collections.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            // dec rank
            collections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.rank } },
            { $inc: { "rank": -1 } }, function(err, response) {
                // remove
                collections.findOneAndRemove({ _id: req.body._id }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid collection" });
        }
    });
}