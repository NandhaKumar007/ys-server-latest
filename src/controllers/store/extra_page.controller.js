"use strict";
const mongoose = require('mongoose');
const extraPage = require("../../models/extra_page.model");

exports.list = (req, res) => {
    if(req.query._id) {
        extraPage.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query._id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        extraPage.find({ store_id: mongoose.Types.ObjectId(req.id) }, { content: 0 }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}

exports.add = (req, res) => {
    req.body.store_id = req.id;
    extraPage.create(req.body, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "Unable to add" }); }
    });
}

exports.update = (req, res) => {
    req.body.updated_on = new Date();
    extraPage.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.hard_remove = (req, res) => {
    extraPage.findOneAndRemove({ _id: req.body._id }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}