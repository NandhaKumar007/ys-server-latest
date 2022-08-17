"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const appointmentServices = require("../../models/appointment_services.model");
const imgUploadService = require("../../../services/img_upload.service");

// CATEGORY
exports.category_list = (req, res) => {
    if(req.query.id) {
        appointmentServices.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        appointmentServices.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}

exports.add_category = (req, res) => {
    req.body.store_id = req.id;
    if(req.body.image) {
        let rootPath = 'uploads/'+req.id+'/appointment';
        imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
            req.body.image = img;
            appointmentServices.updateMany(
            { store_id: mongoose.Types.ObjectId(req.body.store_id), rank: { $gte: req.body.rank } },
            { $inc: { "rank": 1 } }, function(err, response) {
                appointmentServices.create(req.body, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        });
    }
    else {
        appointmentServices.updateMany(
        { store_id: mongoose.Types.ObjectId(req.body.store_id), rank: { $gte: req.body.rank } },
        { $inc: { "rank": 1 } }, function(err, response) {
            appointmentServices.create(req.body, function(err, response) {
                if(!err && response) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Unable to add" }); }
            });
        });
    }
}

exports.update_category = (req, res) => {
    if(req.body.img_change) {
        // remove existing img
        if(req.body.exist_image) {
            fs.unlink(req.body.exist_image, function (err) { });
            let smallImg = req.body.exist_image.split(".");
            if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
        }
        // upload new img
        let rootPath = 'uploads/'+req.id+'/appointment';
        imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
            req.body.image = img;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                appointmentServices.updateMany({ store_id: mongoose.Types.ObjectId(req.id),
                _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                { $inc: { "rank": -1 } }, function(err, response) {
                    // update
                    appointmentServices.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                    { $set: req.body }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Invalid category" }); }
                    });
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                appointmentServices.updateMany({ store_id: mongoose.Types.ObjectId(req.id),
                _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
                { $inc: { "rank": 1 } }, function(err, response) {
                    // update
                    appointmentServices.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                    { $set: req.body }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Invalid category" }); }
                    });
                });
            }
            else {
                // update
                appointmentServices.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: req.body }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Invalid category" }); }
                });
            }
        });
    }
    else {
        if(req.body.prev_rank < req.body.rank)
        {
            // dec rank
            appointmentServices.updateMany({ store_id: mongoose.Types.ObjectId(req.id),
            _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
            { $inc: { "rank": -1 } }, function(err, response) {
                // update
                appointmentServices.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: req.body }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Invalid category" }); }
                });
            });
        }
        else if(req.body.prev_rank > req.body.rank)
        {
            // inc rank
            appointmentServices.updateMany({ store_id: mongoose.Types.ObjectId(req.id),
            _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
            { $inc: { "rank": 1 } }, function(err, response) {
                // update
                appointmentServices.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: req.body }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Invalid category" }); }
                });
            });
        }
        else {
            // update
            appointmentServices.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
            { $set: req.body }, function(err, response) {
                if(!err) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: "Invalid category" }); }
            });
        }
    } 
}

exports.hard_remove_category = (req, res) => {
    // dec rank
    appointmentServices.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.rank } },
    { $inc: { "rank": -1 } }, function(err, response) {
        // update
        appointmentServices.findOneAndRemove({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
            if(!err) {
                if(req.body.image) {
                    fs.unlink(req.body.image, function (err) { });
                    let smallImg = req.body.image.split(".");
                    if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                }
                res.json({ status: true });
            }
            else { res.json({ status: false, error: err, message: "Invalid category" }); }
        });
    });
}

// SERVICES
exports.service_details = (req, res) => {
    appointmentServices.findOne({ store_id: mongoose.Types.ObjectId(req.id), "list._id": mongoose.Types.ObjectId(req.query._id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response.list.filter(object => object._id.toString() == req.query._id)[0] }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.add = (req, res) => {
    appointmentServices.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.category_id) }, function(err, response) {
        if(!err && response)
        {
            let serviceList = response.list;
            let rootPath = 'uploads/'+req.id+'/appointment';
            imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                req.body.image = img;
                // inc rank
                serviceList.forEach((object) => {
                    if(req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
                // add
                serviceList.push(req.body);
                appointmentServices.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.category_id) },
                { $set: { list: serviceList } }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid category" }); }
    });
}

exports.update = (req, res) => {
    appointmentServices.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.category_id) }, function(err, response) {
        if(!err && response)
        {
            let serviceList = response.list;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                serviceList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                serviceList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = serviceList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                serviceList[index] = req.body;
                if(req.body.img_change) {
                    // remove existing img
                    if(req.body.exist_image) {
                        fs.unlink(req.body.exist_image, function (err) { });
                        let smallImg = req.body.exist_image.split(".");
                        if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                    }
                    // upload new img
                    let rootPath = 'uploads/'+req.id+'/appointment';
                    imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                        serviceList[index].image = img;
                        appointmentServices.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.category_id) },
                        { $set: { list: serviceList } }, function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Unable to add" }); }
                        });
                    });
                }
                else {
                    appointmentServices.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.category_id) },
                    { $set: { list: serviceList } }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                }
            }
            else { res.json({ status: false, error: "Invalid Service", message: "Failure" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid category" }); }
    });
}

exports.hard_remove = (req, res) => {
    appointmentServices.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.category_id) }, function(err, response) {
        if(!err && response)
        {
            let serviceList = response.list;
            // dec rank
            serviceList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = serviceList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                serviceList.splice(index, 1);
                // update
                appointmentServices.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.category_id) },
                { $set: { list: serviceList } }, function(err, response) {
                    if(!err) {
                        if(req.body.image) {
                            fs.unlink(req.body.image, function (err) { });
                            let smallImg = req.body.image.split(".");
                            if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                        }
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid Service", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

