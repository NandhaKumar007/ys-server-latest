"use strict";
const mongoose = require('mongoose');
const ysFeatures = require("../../models/ys_features.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    ysFeatures.find({ status: 'active' }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.details = (req, res) => {
    ysFeatures.findOne({ _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    // upload images
    MultiFileUpload(req.body.image_list, 'uploads/yourstore/features').then((imgNameList) => {
        req.body.image_list = imgNameList;
        ysFeatures.create(req.body, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Unable to add" }); }
        });
    });
}

exports.update = (req, res) => {
    // upload images
    MultiFileUpload(req.body.image_list, 'uploads/yourstore/features').then((imgNameList) => {
        req.body.image_list = imgNameList;
        ysFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: req.body }, { new: true }, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    });
}

exports.soft_remove = (req, res) => {
    ysFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: { status: "inactive" } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

async function MultiFileUpload(imgList, rootPath) {
    let nameList = [];
    for(let i=0; i<imgList.length; i++)
    {
        if(imgList[i].img_change) {
            imgList[i].image = await imgUploadService.singleFileUpload(imgList[i].image, rootPath, false, null);
        }
        nameList.push(imgList[i]);
    }
    return nameList;
}