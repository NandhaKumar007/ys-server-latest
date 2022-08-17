"use strict";
const mongoose = require('mongoose');
const policy = require("../../models/policies.model");

exports.details = (req, res) => {
    policy.findOne({ store_id: mongoose.Types.ObjectId(req.id), type: req.query.type }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.update = (req, res) => {
    req.body.updated_on = new Date();
    policy.findOne({ store_id: mongoose.Types.ObjectId(req.id), type: req.body.type }, function(err, response) {
        if(!err && response) {
            // update
            policy.findByIdAndUpdate(response._id, { $set: req.body }, function(err, response) {
                if(!err && response) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else {
            // insert
            req.body.store_id = req.id;
            policy.create(req.body, function(err, response) {
                if(!err, response) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Unable to update" }); }
            });
        }
    });
}