"use strict";
const mongoose = require('mongoose');
const productFeatures = require("../../models/product_features.model");

exports.list = (req, res) => {
    productFeatures.findOne({ store_id: req.id }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.tax_rates.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Invalid store" }); }
    });
}

exports.add = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let taxList = response.tax_rates;
            if(req.body.primary) {
                taxList.forEach((object) => { object.primary = false; });
            }
            taxList.push(req.body);
            // add
            productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
            { $set: { tax_rates: taxList } }, { new: true },
            function(err, response) {
                if(!err) { res.json({ status: true, list: response.tax_rates.filter(obj => obj.status=='active') }); }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

exports.update = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let taxList = response.tax_rates;
            if(req.body.primary) {
                taxList.forEach((object) => { object.primary = false; });
            }
            let index = taxList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                taxList[index] = req.body;
                // update
                productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { tax_rates: taxList } }, { new: true },
                function(err, response) {
                    if(!err) { res.json({ status: true, list: response.tax_rates.filter(obj => obj.status=='active') }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid tax", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

exports.soft_remove = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let taxList = response.tax_rates;
            let index = taxList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                if(req.body.primary) {
                    if(response.tax_rates.filter(obj => obj.status=='active').length > 1) {
                        let nxtPrimaryIndex = taxList.findIndex(obj => obj.status=='active' && obj._id!=req.body._id);
                        taxList[nxtPrimaryIndex].primary = true;
                        taxList[index].status = "inactive";
                        taxList[index].primary = false;
                        // update
                        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                        { $set: { tax_rates: taxList } }, { new: true },
                        function(err, response) {
                            if(!err) { res.json({ status: true, list: response.tax_rates.filter(obj => obj.status=='active') }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                    else {
                        // update (delete all tax rates)
                        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "tax_rates._id": mongoose.Types.ObjectId(req.body._id) },
                        { $set: { "tax_rates.$.primary": false, "tax_rates.$.status": "inactive" } }, { new: true }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response.tax_rates.filter(obj => obj.status=='active') }); }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                }
                else {
                    // update
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "tax_rates._id": mongoose.Types.ObjectId(req.body._id) },
                    { $set: { "tax_rates.$.status": "inactive" } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.tax_rates.filter(obj => obj.status=='active') }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
            }
            else {
                res.json({ status: false, error: "Invalid tax", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}