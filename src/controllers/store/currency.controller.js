"use strict";
const mongoose = require('mongoose');
const currencyList = require("../../models/currency_list.model");
const store = require("../../models/store.model");
const live_currency = require("../../models/live_currency.model");

exports.common_details = (req, res) => {
    // country list
    currencyList.find({}, function(err, response) {
        let list = response;
        // live currencies
        live_currency.findOne({ base: req.query.country_code }, function(err, response) {
            res.json({ status: true, currency_list: list, live_currencies: response.rates });
        });
    });
}

exports.list = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.currency_types }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id), "currency_types.country_code": req.body.country_code }, function(err, response) {
        if(!err && !response)
        {
            store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
            { $push: { currency_types: req.body } }, { new: true }, function(err, response) {
                if(!err && response) { res.json({ status: true, list: response.currency_types }); }
                else { res.json({ status: false, error: err, message: "Unable to add" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Currency already exists" });
        }
    });
}

exports.update = (req, res) => {
    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id), "currency_types._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "currency_types.$": req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.currency_types }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.hard_remove = (req, res) => {
    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
    { $pull: { "currency_types" : { "_id": mongoose.Types.ObjectId(req.body._id) } } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.currency_types }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}