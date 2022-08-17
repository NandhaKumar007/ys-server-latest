"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const discounts = require("../../models/discounts.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    discounts.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    discounts.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let discountList = response.discount_list;
            // inc rank
            discountList.forEach((object) => {
                if(req.body.rank<=object.rank) {
                    object.rank = object.rank+1;
                }
            });
            // add
            let rootPath = 'uploads/'+req.id+'/discounts';
            imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                req.body.image = img;
                discountList.push(req.body);
                discounts.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { discount_list: discountList } }, { new: true }, function(err, response) {
                    if(!err && response) { res.json({ status: true, data: response }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
        else {
            let rootPath = 'uploads/'+req.id+'/discounts';
            imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                req.body.image = img;
                discounts.create({ store_id: req.id, discount_list: [req.body] }, function(err, response) {
                    if(!err && response) { res.json({ status: true, data: response }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
    });
}

exports.update = (req, res) => {
    discounts.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let discountList = response.discount_list;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                discountList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                discountList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = discountList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                // update
                let rootPath = 'uploads/'+req.id+'/discounts';
                if(req.body.img_change) {
                    let existingImg = discountList[index].image;
                    imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                        req.body.image = img;
                        discountList[index] = req.body;
                        discounts.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                        { $set: { discount_list: discountList } }, { new: true }, function(err, response) {
                            if(!err && response) {
                                // remove existing img
                                if(existingImg) {
                                    fs.unlink(existingImg, function (err) { });
                                    let smallImg = existingImg.split(".");
                                    if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                                }
                                res.json({ status: true, data: response });
                            }
                            else { res.json({ status: false, error: err, message: "Unable to update" }); }
                        });
                    });
                }
                else {
                    discountList[index] = req.body;
                    discounts.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { discount_list: discountList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, data: response }); }
                        else { res.json({ status: false, error: err, message: "Unable to update" }); }
                    });
                }
            }
            else {
                res.json({ status: false, error: "Invalid discount", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.update_config = (req, res) => {
    discounts.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $set: req.body }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.soft_remove = (req, res) => {
    discounts.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let discountList = response.discount_list;
            // dec rank
            discountList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = discountList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                let existingImg = discountList[index].image;
                discountList.splice(index, 1);
                // update
                discounts.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { discount_list: discountList } }, { new: true }, function(err, response) {
                    if(!err) {
                        // remove existing img
                        if(existingImg) {
                            fs.unlink(existingImg, function (err) { });
                            let smallImg = existingImg.split(".");
                            if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                        }
                        res.json({ status: true, data: response });
                    }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid discount", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}