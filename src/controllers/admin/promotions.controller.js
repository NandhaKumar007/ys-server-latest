const mongoose = require('mongoose');
const fs = require("fs");
const promotions = require('../../models/ys_promotions.model');
const imgUploadService = require('../../../services/img_upload.service');

exports.list = (req, res) => {
    promotions.find({}, function(err, response) {
        if(!err && response) { res.json({ status:true, list : response }); }
        else { res.json({ status:false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    let rootPath = 'uploads/yourstore/promotions'; let uploadImg = null;
    if(req.body.img_change) { uploadImg = req.body.image; }
    imgUploadService.singleFileUpload(uploadImg, rootPath, true, null).then((img) => {
        if(img) { req.body.image = img; }
        promotions.create(req.body, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Unable to add" }); }
        });
    });
}

exports.update = (req, res) => {
    promotions.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let promDetails = response;
            let rootPath = 'uploads/yourstore/promotions'; let uploadImg = null;
            if(req.body.img_change) { uploadImg = req.body.image; }
            if(req.body.prev_rank < req.body.rank) {
                promotions.updateMany({ rank: { $gt: req.body.prev_rank, $lte: req.body.rank } },
                { $inc: { rank: -1 } }, function(err, response) {
                    imgUploadService.singleFileUpload(uploadImg, rootPath, true, null).then((img) => {
                        if(img) {
                            if(promDetails.image) { fs.unlink(promDetails.image, function () { }); }
                            req.body.image = img;
                        }
                        promotions.findOneAndUpdate({ _id: req.body._id }, { $set: req.body }, function(err, response) {
                            if(!err && response) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Unable to update" }); }
                        });
                    });
                });
            }
            else if(req.body.prev_rank > req.body.rank) {
                promotions.updateMany({ rank: { $lt: req.body.prev_rank, $gte: req.body.rank } },
                { $inc: { rank: 1 } }, function(err, response) {
                    imgUploadService.singleFileUpload(uploadImg, rootPath, true, null).then((img) => {
                        if(img) {
                            if(promDetails.image) { fs.unlink(promDetails.image, function () { }); }
                            req.body.image = img;
                        }
                        promotions.findOneAndUpdate({ _id: req.body._id }, { $set: req.body }, function(err, response) {
                            if(!err && response) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Unable to update" }); }
                        });
                    });
                });
            }
            else {
                imgUploadService.singleFileUpload(uploadImg, rootPath, true, null).then((img) => {
                    if(img) {
                        if(promDetails.image) { fs.unlink(promDetails.image, function () { }); }
                        req.body.image = img;
                    }
                    promotions.findOneAndUpdate({ _id: req.body._id }, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Unable to update" }); }
                    });
                });
            }
        }
        else { res.json({ status: false, error: err, message: "Invalid promotion" }); }
    });
}


exports.hard_remove = (req, res) => {
    promotions.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let promDetails = response;
            promotions.updateMany({ rank: { $gt: req.body.rank } }, { $inc: { "rank": -1 } }, function(err, response) {
                promotions.findOneAndRemove({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
                    if(!err && response) {
                        if(promDetails.image) { fs.unlink(promDetails.image, function () { }); }
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid promotion" }); }
    });
}