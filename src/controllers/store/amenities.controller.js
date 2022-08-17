"use strict";
const mongoose = require('mongoose');
const productFeatures = require("../../models/product_features.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.amenities.filter(obj => obj.status=="active") }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let amenityList = response.amenities;
            let index = amenityList.findIndex(object => object.name==req.body.name && object.status=="active");
            if(index==-1)
            {
                // inc rank
                amenityList.forEach((object) => {
                    if(req.body.rank<=object.rank && object.status=='active') {
                        object.rank = object.rank+1;
                    }
                });
                // add
                let rootPath = 'uploads/'+req.id+'/amenities';
                imgUploadService.singleFileUpload(req.body.image, rootPath, false, null).then((img) => {
                    if(img) { req.body.image = img; }
                    amenityList.push(req.body);
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { amenities: amenityList } }, { new: true }, function(err, response) {
                        if(!err) { res.json({ status: true, list: response.amenities.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                });
            }
            else {
                res.json({ status: false, error: err, message: "Name already exists" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.update = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let amenityList = response.amenities;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                amenityList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank && object.status=='active') {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                amenityList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank && object.status=='active') {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = amenityList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                // update
                if(req.body.img_change) {
                    let rootPath = 'uploads/'+req.id+'/amenities';
                    imgUploadService.singleFileUpload(req.body.image, rootPath, false, null).then((img) => {
                        if(img) { req.body.image = img; }
                        amenityList[index] = req.body;
                        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                        { $set: { amenities: amenityList } }, { new: true }, function(err, response) {
                            if(!err) { res.json({ status: true, list: response.amenities.filter(obj => obj.status=="active") }); }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    });
                }
                else {
                    amenityList[index] = req.body;
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { amenities: amenityList } }, { new: true }, function(err, response) {
                        if(!err) { res.json({ status: true, list: response.amenities.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
            }
            else {
                res.json({ status: false, error: "Invalid FAQ", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.soft_remove = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let amenityList = response.amenities;
            // dec rank
            amenityList.forEach((object) => {
                if(req.body.rank<object.rank && object.status=='active') {
                    object.rank = object.rank-1;
                }
            });
            let index = amenityList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                amenityList[index].status = "inactive";
                amenityList[index].rank = 0;
                // update
                productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { amenities: amenityList } }, { new: true }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.amenities.filter(obj => obj.status=="active") }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid FAQ", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}