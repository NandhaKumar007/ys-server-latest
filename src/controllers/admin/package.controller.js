"use strict";
const mongoose = require('mongoose');
const ysPackages = require("../../models/ys_packages.model");

exports.list = (req, res) => {
    ysPackages.find({ status: 'active' }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    ysPackages.create(req.body, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Unable to add" }); }
    });
}

exports.update = (req, res) => {
    ysPackages.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: req.body }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.soft_remove = (req, res) => {
    ysPackages.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: { status: "inactive" } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}