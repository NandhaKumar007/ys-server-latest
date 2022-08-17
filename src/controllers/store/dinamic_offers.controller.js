"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const dinamicOffers = require("../../models/dinamic_offers.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    if(req.query._id) {
        dinamicOffers.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) {
                let offerIndex = response.offer_list.findIndex(obj => obj._id==req.query._id);
                if(offerIndex!=-1) { res.json({ status: true, data: response.offer_list[offerIndex] }); }
                else { res.json({ status: false, message: "Offer doesn't exists" }); }
            }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        dinamicOffers.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response.offer_list }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

exports.add = (req, res) => {
    if(!req.body.price) { req.body.price = 0; }
    dinamicOffers.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let offerList = response.offer_list;
            let index = offerList.findIndex(object => object.sku==req.body.sku);
            if(index==-1)
            {
                let rootPath = 'uploads/'+req.id+'/dinamic-offers';
                MultiFileUpload(req.body.image_list, rootPath).then((imgNameList) => {
                    req.body.image_list = imgNameList;
                    dinamicOffers.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $push: { offer_list: req.body } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.offer_list }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                });
            }
            else {
                res.json({ status: false, error: err, message: "SKU already exists" });
            }
        }
        else {
            let rootPath = 'uploads/'+req.id+'/dinamic-offers';
            MultiFileUpload(req.body.image_list, rootPath).then((imgNameList) => {
                req.body.image_list = imgNameList;
                dinamicOffers.create({ store_id: req.id, offer_list: [req.body] }, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response.offer_list }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
    });
}

exports.update = (req, res) => {
    if(!req.body.price) { req.body.price = 0; }
    dinamicOffers.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let skuIndex = response.offer_list.findIndex(obj => obj.sku==req.body.sku && obj._id.toString()!=req.body._id);
            if(skuIndex==-1) {
                // remove existing img
                if(req.body.exist_image) {
                    fs.unlink(req.body.exist_image, function (err) { });
                    let smallImg = req.body.exist_image.split(".");
                    if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                }
                // upload new img
                let rootPath = 'uploads/'+req.id+'/dinamic-offers';
                MultiFileUpload(req.body.image_list, rootPath).then((imgNameList) => {
                    req.body.image_list = imgNameList;
                    dinamicOffers.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "offer_list._id": mongoose.Types.ObjectId(req.body._id) },
                    { $set: { "offer_list.$": req.body } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.offer_list }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else {
                res.json({ status: false, message: "SKU already exists" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.hard_remove = (req, res) => {
    dinamicOffers.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let offerList = response.offer_list;
            let cardIndex = offerList.findIndex(obj => obj._id.toString()==req.body._id);
            dinamicOffers.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
            { $pull: { "offer_list" : { "_id": mongoose.Types.ObjectId(req.body._id) } } }, { new: true }, function(err, response) {
                if(!err && response) {
                    // remove existing img
                    if(cardIndex!=-1) { unlinkProductImages(offerList[cardIndex].image_list).then((respData) => { }); }
                    res.json({ status: true, list: response.offer_list });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

async function MultiFileUpload(imgList, rootPath) {
    let nameList = [];
    for(let i=0; i<imgList.length; i++)
    {
        if(imgList[i].img_change) {
            imgList[i].image = await imgUploadService.singleFileUpload(imgList[i].image, rootPath, true, null);
        }
        nameList.push(imgList[i]);
    }
    return nameList;
}

function unlinkProductImages(imgList) {
    return new Promise((resolve, reject) => {
        for(let i=0; i<imgList.length; i++)
        {
            if(imgList[i].image && imgList[i].image.indexOf('uploads/yourstore/')==-1) {
                fs.unlink(imgList[i].image, function (err) { });
                let smallImg = imgList[i].image.split(".");
                if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
            }
        }
        resolve(true);
    });
}