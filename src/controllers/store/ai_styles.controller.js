"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const storeFeatures = require("../../models/store_features.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.details = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response.ai_styles });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.update = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let rootPath = 'uploads/'+req.id+'/ai-styles';
            MultiFileUpload(req.body.ai_styles, rootPath).then((styleList) => {
                req.body.ai_styles = styleList;
                storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { ai_styles: styleList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, data: response.ai_styles }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

async function MultiFileUpload(styleList, rootPath) {
    let customArray = [];
    for(let i=0; i<styleList.length; i++)
    {
        let optionArray = [];
        let optionList = styleList[i].option_list;
        for(let j=0; j<optionList.length; j++)
        {
            if(optionList[j].img_change) {
                optionList[j].image = await imgUploadService.singleFileUpload(optionList[j].image, rootPath, false, null);
            }
            optionArray.push(optionList[j]);
        }
        styleList[i].option_list = optionArray; 
        customArray.push(styleList[i]);
    }
    return customArray;
}