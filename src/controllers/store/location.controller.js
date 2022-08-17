"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const locations = require("../../models/locations.model");

exports.list = (req, res) => {
    locations.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    locations.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let locationList = response.location_list;
            // inc rank
            locationList.forEach((object) => {
                if(req.body.rank<=object.rank) {
                    object.rank = object.rank+1;
                }
            });
            // add
            locationList.push(req.body);
            locations.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
            { $set: { location_list: locationList } }, { new: true }, function(err, response) {
                if(!err && response) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "Unable to add" }); }
            });
        }
        else {
            locations.create({ store_id: req.id, location_list: [req.body] }, function(err, response) {
                if(!err && response) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "Unable to add" }); }
            });
        }
    });
}

exports.update = (req, res) => {
    locations.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let locationList = response.location_list;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                locationList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                locationList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = locationList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                // update
                locationList[index] = req.body;
                locations.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { location_list: locationList } }, { new: true }, function(err, response) {
                    if(!err && response) { res.json({ status: true, data: response }); }
                    else { res.json({ status: false, error: err, message: "Unable to update" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid location", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.update_config = (req, res) => {
    locations.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $set: req.body }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.soft_remove = (req, res) => {
    locations.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let locationList = response.location_list;
            // dec rank
            locationList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = locationList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                locationList.splice(index, 1);
                // update
                locations.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { location_list: locationList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, data: response }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid location", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}