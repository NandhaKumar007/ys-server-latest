"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const productFeatures = require("../../models/product_features.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.sizing_assistant.filter(obj => obj.status=="active") }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.details = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), "sizing_assistant._id": mongoose.Types.ObjectId(req.params.sizingId) }, function(err, response) {
        if(!err && response) {
            let filterList = response.sizing_assistant.filter(obj => obj._id.toString()==req.params.sizingId);
            if(filterList.length) { res.json({ status: true, data: filterList[0] }); }
            else { res.json({ status: false, error: "Not exists", message: "Failure" }); }
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $push: { sizing_assistant: req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.sizing_assistant.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Unable to add" }); }
    });
}

exports.update = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), "sizing_assistant._id": mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let rootPath = 'uploads/'+req.id+'/sizing';
            MultiFileUpload(req.body.assistant_types, rootPath).then((assistantList) => {
                req.body.assistant_types = assistantList;
                productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "sizing_assistant._id": mongoose.Types.ObjectId(req.body._id) },
                { $set: { "sizing_assistant.$": req.body } }, { new: true }, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response.sizing_assistant.filter(obj => obj.status=='active') }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.soft_remove = (req, res) => {
    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "sizing_assistant._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "sizing_assistant.$.status": "inactive" } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.sizing_assistant.filter(obj => obj.status=='active') }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

async function MultiFileUpload(assistantList, rootPath) {
    let customArray = [];
    for(let assistData of assistantList)
    {
        if(assistData.img_change) {
            assistData.image = await imgUploadService.singleFileUpload(assistData.image, rootPath, false, null);
        }
        let optionArray = [];
        let optionList = assistData.option_list;
        for(let optionData of optionList)
        {
            if(optionData.img_change) {
                optionData.image = await imgUploadService.singleFileUpload(optionData.image, rootPath, false, null);
            }
            optionArray.push(optionData);
        }
        assistData.option_list = optionArray; 
        customArray.push(assistData);
    }
    return customArray;
}