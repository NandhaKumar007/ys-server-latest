"use strict";
const mongoose = require('mongoose');
const layout = require("../../models/layout.model");
const storeFeatures = require("../../models/store_features.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.ad_setting = (req, res) => {
    if(req.body.ad_config) {
        storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
        { $set: { ad_config: req.body.ad_config } }, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { ad_config: 1 }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response.ad_config }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

exports.add = (req, res) => {
    layout.findOne({store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.type) }, function(err, response) {
        if(!err && response) {
            let layoutDetails = response;
            let newImage = null;
            let rootPath = 'uploads/'+req.id+'/ads';
            if(req.body.img_change && req.body.image) { newImage = req.body.image; }
            imgUploadService.singleFileUpload(newImage, rootPath, false, null).then((img) => {
                if(img) { req.body.image = img; }
                layout.findOneAndUpdate({ _id: mongoose.Types.ObjectId(layoutDetails._id) },
                { $set: { ad_status: 'active', ad_config: req.body } }, function(err, response) {
                    if(!err && response) { res.json({status: true}); }
                    else { res.json({status: false, error: err, message: "Failure"}); }
                });
            });
        }
        else { res.json({status: false, error: err, message: "Invalid Segment"}); }
    });
}

exports.update = (req, res) => {
    layout.findOne({store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let layoutDetails = response;
            if(req.body.change_status) {
                let newStatus = "active";
                if(layoutDetails.ad_status=='active') { newStatus = "inactive"; }
                layout.findOneAndUpdate({ _id: mongoose.Types.ObjectId(layoutDetails._id) },
                { $set: { ad_status: newStatus } }, function(err, response) {
                    if(!err && response) { res.json({status: true}); }
                    else { res.json({status: false, error: err, message: "Failure"}); }
                });
            }
            else {
                let newImage = null;
                let rootPath = 'uploads/'+req.id+'/ads';
                if(req.body.img_change && req.body.image) { newImage = req.body.image; }
                imgUploadService.singleFileUpload(newImage, rootPath, false, null).then((img) => {
                    if(img) { req.body.image = img; }
                    layout.findOneAndUpdate({ _id: mongoose.Types.ObjectId(layoutDetails._id) },
                    { $set: { ad_config: req.body } }, function(err, response) {
                        if(!err && response) { res.json({status: true}); }
                        else { res.json({status: false, error: err, message: "Failure"}); }
                    });
                });
            }
        }
        else { res.json({status: false, error: err, message: "Invalid Segment"}); }
    });
}

exports.hard_remove = (req, res) => {
    layout.findOne({store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let layoutDetails = response;
            layout.findOneAndUpdate({ _id: mongoose.Types.ObjectId(layoutDetails._id) },
            { $unset: { ad_status: "", ad_config: "" } }, function(err, response) {
                if(!err && response) { res.json({status: true}); }
                else { res.json({status: false, error: err, message: "Failure"}); }
            });
        }
        else { res.json({status: false, error: err, message: "Invalid Segment"}); }
    });
}