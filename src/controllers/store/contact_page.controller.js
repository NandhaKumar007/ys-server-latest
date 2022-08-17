"use strict";
const mongoose = require('mongoose');
const contactPage = require("../../models/contact_page.model");

exports.details = (req, res) => {
    contactPage.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
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
    contactPage.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            // update
            contactPage.findByIdAndUpdate(response._id, { $set: req.body }, function(err, response) {
                if(!err && response) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else {
            // insert
            req.body.store_id = req.id;
            contactPage.create(req.body, function(err, response) {
                if(!err, response) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Unable to update" }); }
            });
        }
    });
}