"use strict";
const mongoose = require('mongoose');
const dinamicRewards = require("../../models/dinamic_rewards.model");

exports.list = (req, res) => {
    if(req.query.id) {
        dinamicRewards.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        dinamicRewards.find({ store_id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}