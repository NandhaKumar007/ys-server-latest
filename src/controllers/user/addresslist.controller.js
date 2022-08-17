"use strict";
const mongoose = require('mongoose');
const customer = require("../../models/customer.model");
const commonService = require("../../../services/common.service");

exports.add = (req, res) => {
    if(req.login_type && req.body.customer_id) { req.id = req.body.customer_id; }
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let addressList = response.address_list;
            if(req.body.billing_address) {
                addressList.forEach((object) => {
                    object.billing_address = false;
                });
            }
            if(req.body.shipping_address) {
                addressList.forEach((object) => {
                    object.shipping_address = false;
                });
            }
            addressList.push(req.body);
            // add
            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
            { $set: { address_list: addressList } }, { new: true },
            function(err, response) {
                if(!err) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

exports.update = (req, res) => {
    if(req.login_type && req.body.customer_id) { req.id = req.body.customer_id; }
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let addressList = response.address_list;
            if(req.body.billing_address) {
                addressList.forEach((object) => {
                    object.billing_address = false;
                });
            }
            if(req.body.shipping_address) {
                addressList.forEach((object) => {
                    object.shipping_address = false;
                });
            }
            let index = addressList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                addressList[index] = req.body;
                // update
                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                { $set: { address_list: addressList } }, { new: true },
                function(err, response) {
                    if(!err) { res.json({ status: true, data: response }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid address", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

exports.remove = (req, res) => {
    if(req.login_type && req.body.customer_id) { req.id = req.body.customer_id; }
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let addressList = response.address_list;
            let index = addressList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                if(addressList.length > 1) {
                    if(req.body.billing_address || req.body.shipping_address) {
                        let updateIndex = 0;
                        if(index===0) { updateIndex = 1; }
                        // default billing
                        if(req.body.billing_address) {
                            addressList[updateIndex].billing_address = true;
                        }
                        // default shipping
                        if(req.body.shipping_address) {
                            addressList[updateIndex].shipping_address = true;
                        }
                        addressList.splice(index, 1);
                        // update
                        customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                        { $set: { address_list: addressList } }, { new: true },
                        function(err, response) {
                            if(!err) { res.json({ status: true, data: response }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                    else {
                        addressList.splice(index, 1);
                        // update
                        customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                        { $set: { address_list: addressList } }, { new: true },
                        function(err, response) {
                            if(!err) { res.json({ status: true, data: response }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                }
                else {
                    // update with empty list
                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                    { $set: { address_list: [] } }, { new: true },
                    function(err, response) {
                        if(!err) { res.json({ status: true, data: response }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
            }
            else {
                res.json({ status: false, error: "Invalid address", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}