"use strict";
const { query } = require('express');
const mongoose = require('mongoose');
const layout = require("../../models/layout.model");
const storeFeatures = require("../../models/store_features.model");
const adOrders = require('../../models/ad_orders.model');
const vendor = require("../../models/vendor.model");
const commonService = require('../../../services/common.service');
const imgUploadService = require("../../../services/img_upload.service");
const vendor_wallet_mgmt = require("../../models/vendor_wallet_mgmt.model");

exports.list= (req, res)=>{
    let orderStatus = req.body.type;
    if(orderStatus=="all") { orderStatus = { $in: [ 'active', 'progress', 'completed' ] }; }

    adOrders.find({vendor_id: mongoose.Types.ObjectId(req.body.vendor_id), status: orderStatus, 
    created_on: {$gte: req.body.from_date, $lte: req.body.to_date} }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.add = (req, res) => {
    req.body.vendor_id = req.vendor_id;
    req.body.store_id = req.id;
    req.body.from = req.body.from_date;
    req.body.to = req.body.to_date;
    req.body.order_number = commonService.orderNumber();
    req.body.order_info = 'Ad Order';
    req.body.order_type = 'debit';
    layout.findOne({ _id: mongoose.Types.ObjectId(req.body.segment_id), store_id: mongoose.Types.ObjectId(req.id) }, function (err, response) {
        if (!err && response) {
            let adConfigValue = response.ad_config;
            vendor.findOne({store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.vendor_id), status: { $ne: 'deleted' }}, function(err, vendorResponse){
                if(!err && req.vendor_id){
                    let vendor_details = vendorResponse;                    
                adOrders.find({ status: {$ne:'cancelled'}, $or: [{ from: { $lte: req.body.from }, to: { $gte: req.body.from } }, { from: { $lte: req.body.to }, to: { $gte: req.body.to } }] }, function (err, adOrderResponse) {
                if (!err && adOrderResponse) {
                    if (adConfigValue.allocated_slots > adOrderResponse.length) {
                        if (adConfigValue.schedule_from && adConfigValue.schedule_to) {
                            // find disable days
                            findDisableDays(new Date(adConfigValue.schedule_from), new Date(adConfigValue.schedule_to)).then((disableDays) => {
                                storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function (err, ad_setting) {
                                    if (!err && ad_setting) {
                                        let normalDays = ad_setting.ad_config.normal_days;
                                        let peakDay = ad_setting.ad_config.peak_days;
                                        // find days count and selected days
                                        findDayCount(new Date(req.body.from_date), new Date(req.body.to_date), normalDays, peakDay).then((result) => {
                                            // calculating price
                                            calculation(disableDays, req.body, result, adConfigValue).then((totalPrice) => {
                                                if (totalPrice > 0) {
                                                    req.body.price = totalPrice;
                                                    if (req.body.price && req.body.price < vendor_details.wallet_balance) {
                                                        // add image
                                                        if (req.body.image) {
                                                            let newImage = null;
                                                            let rootPath = 'uploads/' + req.id + '/ad_orders';
                                                            if (req.body.img_change && req.body.image) { newImage = req.body.image; }
                                                            imgUploadService.singleFileUpload(newImage, rootPath, false, null).then((img) => {
                                                                if (img) { req.body.image = img }
                                                                vendor.findOneAndUpdate({store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.vendor_id), status: { $ne: 'deleted' }},{$inc: {wallet_balance: -req.body.price}}, function(err, response){
                                                                    if(!err && response){
                                                                        // create statement
                                                                        req.body.order_price = req.body.price;
                                                                        req.body.balance = vendor_details.wallet_balance;
                                                                        req.body.status = 'active';
                                                                        vendor_wallet_mgmt.create(req.body, function(err, response){ 
                                                                            if(!err && response){
                                                                            // add 
                                                                            adOrders.create(req.body, function (err, response) {
                                                                                if (!err && response) { res.json({ status: true }); }
                                                                                else { res.json({ status: false, error: err, message: "Unable to add" }); }
                                                                            });
                                                                            }else{ res.json({ status: false, error: err, message: "Unable to add" }); }
                                                                        })
                                                                        
                                                                    }else { res.json({ status: false, error: err, message: "Unable to add" }); }
                                                                })
                                                            });
                                                        } else {                                                            
                                                            vendor.findOneAndUpdate({store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.vendor_id), status: { $ne: 'deleted' }},{$inc: {wallet_balance: -req.body.price}}, function(err, response){
                                                                if(!err && response){
                                                                    req.body.order_price = req.body.price;
                                                                    req.body.balance = vendor_details.wallet_balance;
                                                                    req.body.status = 'active';
                                                                    vendor_wallet_mgmt.create(req.body, function(err, response){ 
                                                                        if(!err && response){
                                                                            // add 
                                                                            adOrders.create(req.body, function (err, response) {
                                                                                if (!err && response) { res.json({ status: true }); }
                                                                                else { res.json({ status: false, error: err, message: "Unable to add" }); }
                                                                            });
                                                                        }else{ res.json({ status: false, error: err, message: "Unable to add" }); }
                                                                    })
                                                                    
                                                                    
                                                                }else { res.json({ status: false, error: err, message: "Unable to add" }); }
                                                            })
                                                        }
                                                    } else { res.json({ status: false, error: err, message: "Price was not define" }); }
                                                } else { res.json({ status: false, error: err, message: "Selected days was not available" }); }
                                            });
                                        });
                                    } else { res.json({ status: false, error: err, message: "Failure" }); }
                                });
                            });
                        } else { res.json({ status: false, error: err, message: "Failure" }); }
                    } else { res.json({ status: false, error: err, message: "Slots was not available" }); }
                } else { res.json({ status: false, error: err, message: "Failure" }); }
                });
                }else{res.json({ status: false, error: err, message: "Failure" });}              
            });
            
        } else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.soft_remove=(req, res)=>{
    adOrders.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.body._id)}, {$set: {status:'cancelled'}}, function(err, response){
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}


// find disable days
async function findDisableDays(start, end) {
    let disabledDates = [];
    for (var dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        disabledDates.push(new Date(dt));
    }
    return disabledDates;
}

// find days count and selected days
async function findDayCount(start, end, normalDay, peakDay) {
    let totalNday = 0;
    let totalPday = 0;
    let selectedDays = [];
    for (var dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        let dayCode = dt.getDay();
        if (normalDay.indexOf(dayCode) != -1) totalNday++;
        if (peakDay.indexOf(dayCode) != -1) totalPday++;
        selectedDays.push(new Date(dt))
    }
    return { selectedDays: selectedDays, totalNday: totalNday, totalPday: totalPday };
}

// price calculating 
async function calculation(disableDays, dates, price, adConfigValue) {
    let tot_price = 0;
    let calculation = false;
    for (let y of disableDays) {
        if (new Date(dates.from_date) < y && new Date(dates.to_date) > y) {
            calculation = false;
            break;
        } else { calculation = true }
    }
    if (calculation) { tot_price = (price.totalNday * adConfigValue.normal_price) + (price.totalPday * adConfigValue.peak_price); }
    return tot_price
}