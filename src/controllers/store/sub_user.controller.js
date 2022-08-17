"use strict";
const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);
const store = require("../../models/store.model");
const storeFeatures = require("../../models/store_features.model");

exports.list = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.sub_users }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            // check users limit
            if(req.body.max_limit>response.sub_users.length)
            {
                if(req.body.email) {
                    req.body.email = req.body.email.trim();
                    req.body.email = req.body.email.toLowerCase();
                }
                store.findOne({ email: req.body.email }, function(err, response) {
                    if(!err && !response)
                    {
                        storeFeatures.findOne({ "sub_users.email": req.body.email }, function(err, response) {
                            if(!err && !response)
                            {
                                req.body.session_key = new Date().valueOf();
                                req.body.password = bcrypt.hashSync(req.body.password, saltRounds);
                                storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                                    { $push: { sub_users: req.body } }, { new: true }, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, list: response.sub_users });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: "Failure" });
                                    }
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Email already exists" });
                            }
                        });
                    }
                    else {
                        res.json({ status: false, error: err, message: "Email already exists" });
                    }
                });
            }
            else {
                res.json({ status: false, message: "Maximum "+req.body.max_limit+" users only allowed" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.update = (req, res) => {
    storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "sub_users._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "sub_users.$": req.body } }, { new: true }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response.sub_users });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.hard_remove = (req, res) => {
    storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $pull: { "sub_users" : { "_id": mongoose.Types.ObjectId(req.body._id) } } }, { new: true }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response.sub_users });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.update_pwd = (req, res) => {
    let new_pwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
    storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "sub_users._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "sub_users.$.password": new_pwd, "sub_users.$.session_key": new Date().valueOf() } }, { new: true }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response.sub_users });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}