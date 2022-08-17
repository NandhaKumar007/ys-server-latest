"use strict";
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const xlstojson = require("xls-to-json-lc");
const shipping = require("../../models/shipping_methods.model");

exports.list = (req, res) => {
    shipping.find({ store_id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, message: "No records found" })
        }
    });
}

exports.add = (req, res) => {
    let shippingDetails = JSON.parse(req.body.data);
    shipping.findOne({ store_id: mongoose.Types.ObjectId(shippingDetails.store_id), name: shippingDetails.name, status: "active" }, function(err, response) {
        if(!err && !response)
        {
            if(req.files) {
                // domestic zone upload
                let fileName = "uploads/excel/domes-zone-"+shippingDetails.store_id;
                domesZoneUpload(req.files.domesZoneFile, fileName).then((domesZoneResp) => {
                    shippingDetails.domes_zones = domesZoneResp;
                    // domestic rate multiplier
                    let fileName = "uploads/excel/domes-rate-"+shippingDetails.store_id;
                    rateUpload(req.files.domesRateFile, fileName).then((domesRateResp) => {
                        shippingDetails.domes_rate_multiplier = domesRateResp;
                        // international zone upload
                        let fileName = "uploads/excel/inter-zone-"+shippingDetails.store_id;
                        interZoneUpload(req.files.interZoneFile, fileName).then((interZoneResp) => {
                            shippingDetails.inter_zones = interZoneResp;
                            // international rate multiplier
                            let fileName = "uploads/excel/inter-rate-"+shippingDetails.store_id;
                            rateUpload(req.files.interRateFile, fileName).then((interRateResp) => {
                                shippingDetails.inter_rate_multiplier = interRateResp;
                                // create shipping method
                                shipping.create(shippingDetails, function(err, response) {
                                    if(!err && response) { res.json({ status: true }); }
                                    else { res.json({ status: false, error: err, message: "Failure" }); }
                                });
                            }).catch(function(error) {
                                res.json({ status: false, message: error });
                            });
                        }).catch(function(error) {
                            res.json({ status: false, message: error });
                        });
                    }).catch(function(error) {
                        res.json({ status: false, message: error });
                    });
                }).catch(function(error) {
                    res.json({ status: false, message: error });
                });
            }
            else {
                // create shipping method
                shipping.create(shippingDetails, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Shipping method already exists" });
        }
    });
}

exports.update = (req, res) => {
    let shippingDetails = JSON.parse(req.body.data);
    shipping.findOne({ _id: mongoose.Types.ObjectId(shippingDetails._id) }, function(err, response) {
        if(!err && response)
        {
            if(req.files) {
                // domestic zone upload
                let fileName = "uploads/excel/domes-zone-"+shippingDetails.store_id;
                domesZoneUpload(req.files.domesZoneFile, fileName).then((domesZoneResp) =>{
                    shippingDetails.domes_zones = domesZoneResp;
                    // domestic rate multiplier
                    let fileName = "uploads/excel/domes-rate-"+shippingDetails.store_id;
                    rateUpload(req.files.domesRateFile, fileName).then((domesRateResp) => {
                        shippingDetails.domes_rate_multiplier = domesRateResp;
                        // international zone upload
                        let fileName = "uploads/excel/inter-zone-"+shippingDetails.store_id;
                        interZoneUpload(req.files.interZoneFile, fileName).then((interZoneResp) => {
                            shippingDetails.inter_zones = interZoneResp;
                            // international rate multiplier
                            let fileName = "uploads/excel/inter-rate-"+shippingDetails.store_id;
                            rateUpload(req.files.interRateFile, fileName).then((interRateResp) => {
                                shippingDetails.inter_rate_multiplier = interRateResp;
                                // update shipping method
                                shipping.findOneAndUpdate({ _id: mongoose.Types.ObjectId(shippingDetails._id) },
                                    { $set: shippingDetails }, function(err, response) {
                                    if(!err && response) { res.json({ status: true }); }
                                    else { res.json({ status: false, error: err, message: "Failure" }); }
                                });
                            }).catch(function(error) {
                                res.json({ status: false, message: error });
                            });
                        }).catch(function(error) {
                            res.json({ status: false, message: error });
                        });
                    }).catch(function(error) {
                        res.json({ status: false, message: error });
                    });
                }).catch(function(error) {
                    res.json({ status: false, message: error });
                });
            }
            else {
                // update shipping method
                shipping.findOneAndUpdate({ _id: mongoose.Types.ObjectId(shippingDetails._id) },
                    { $set: shippingDetails }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid shipping method" })
        }
    });
}

exports.soft_remove = (req, res) => {
    shipping.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) },
        { $set: { "status": "inactive" } }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

function domesZoneUpload(file, name) {
    return new Promise((resolve, reject) => {
        if(file) {
            let filename = name+path.extname(file.name);
            file.mv(filename, function(err) {
                if(!err) {
                    xlstojson({ input: filename, output: null, lowerCaseHeaders: true }, function(err, list) {
                        for(let i=0; i<list.length; i++)
                        {
                            let stateList = [];
                            let sArray = list[i].states.split(",");
                            sArray.forEach(obj => { stateList.push(obj.trim()); });
                            list[i].states = stateList;
                        }
                        fs.unlinkSync(filename);
                        resolve(list);
                    });
                }
                else {
                    reject("Domestic zone csv upload error");
                }
            });
        }
        else {
            resolve([]);
        }
    });
}

function interZoneUpload(file, name) {
    return new Promise((resolve, reject) => {
        if(file) {
            let filename = name+path.extname(file.name);
            file.mv(filename, function(err) {
                if(!err) {
                    xlstojson({ input: filename, output: null, lowerCaseHeaders: true }, function(err, list) {
                        for(let i=0; i<list.length; i++)
                        {
                            let countryList = [];
                            let cArray = list[i].countries.split(",");
                            cArray.forEach(obj => { countryList.push(obj.trim()); });
                            list[i].countries = countryList;
                        }
                        fs.unlinkSync(filename);
                        resolve(list);
                    });
                }
                else {
                    reject("International zone csv upload error");
                }
            });
        }
        else {
            resolve([]);
        }
    });
}

function rateUpload(file, name) {
    return new Promise((resolve, reject) => {
        if(file) {
            let filename = name+path.extname(file.name);
            file.mv(filename, function(err) {
                if(!err) {
                    xlstojson({ input: filename, output: null, lowerCaseHeaders: true }, function(err, list) {
                        fs.unlinkSync(filename);
                        resolve(list);
                    });
                }
                else {
                    reject("Rate multiplier csv upload error");
                }
            });
        }
        else {
            resolve([]);
        }
    });
}