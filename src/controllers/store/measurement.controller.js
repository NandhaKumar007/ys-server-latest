"use strict";
const mongoose = require('mongoose');
const vendorFeatures = require("../../models/vendor_features.model");
const productFeatures = require("../../models/product_features.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    if(req.login_type=='vendor' || req.query.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.query.vendor_id) { vendorId = req.query.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { measurement_set: 1 }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
            else { res.json({ status: true, list: [] }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { measurement_set: 1 }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

exports.add = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { measurement_set: 1 }, function(err, response) {
            if(!err && response) {
                let measurementSet = response.measurement_set;
                let index = measurementSet.findIndex(object => object.name==req.body.name);
                if(index==-1)
                {
                    // inc rank
                    measurementSet.forEach((object) => {
                        if(req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                    // add
                    let rootPath = 'uploads/'+req.id+'/measurements';
                    imgUploadService.singleFileUpload(req.body.image, rootPath, false, null).then((img) => {
                        req.body.image = img;
                        measurementSet.push(req.body);
                        vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                        { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    });
                }
                else { res.json({ status: false, error: err, message: "Name already exists" }); }
            }
            else {
                vendorFeatures.create({ store_id: req.id, _id: vendorId, measurement_set: [req.body] }, function(err, response) {
                    if(!err) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { measurement_set: 1 }, function(err, response) {
            if(!err && response) {
                let measurementSet = response.measurement_set;
                let index = measurementSet.findIndex(object => object.name==req.body.name);
                if(index==-1)
                {
                    // inc rank
                    measurementSet.forEach((object) => {
                        if(req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                    // add
                    let rootPath = 'uploads/'+req.id+'/measurements';
                    imgUploadService.singleFileUpload(req.body.image, rootPath, false, null).then((img) => {
                        req.body.image = img;
                        measurementSet.push(req.body);
                        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                        { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    });
                }
                else { res.json({ status: false, error: err, message: "Name already exists" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
}

exports.update = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { measurement_set: 1 }, function(err, response) {
            if(!err && response) {
                let measurementSet = response.measurement_set;
                if(req.body.prev_rank < req.body.rank)
                {
                    // dec rank
                    measurementSet.forEach((object) => {
                        if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                            object.rank = object.rank-1;
                        }
                    });
                }
                else if(req.body.prev_rank > req.body.rank)
                {
                    // inc rank
                    measurementSet.forEach((object) => {
                        if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                }
                let index = measurementSet.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    // update
                    if(req.body.img_change) {
                        let rootPath = 'uploads/'+req.id+'/measurements';
                        imgUploadService.singleFileUpload(req.body.image, rootPath, false, null).then((img) => {
                            req.body.image = img;
                            measurementSet[index] = req.body;
                            vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                            { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                                if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                                else { res.json({ status: false, error: err, message: "failure" }); }
                            });
                        });
                    }
                    else {
                        measurementSet[index] = req.body;
                        vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                        { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                }
                else { res.json({ status: false, error: "Invalid measurement-set", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { measurement_set: 1 }, function(err, response) {
            if(!err && response) {
                let measurementSet = response.measurement_set;
                if(req.body.prev_rank < req.body.rank)
                {
                    // dec rank
                    measurementSet.forEach((object) => {
                        if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                            object.rank = object.rank-1;
                        }
                    });
                }
                else if(req.body.prev_rank > req.body.rank)
                {
                    // inc rank
                    measurementSet.forEach((object) => {
                        if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                }
                let index = measurementSet.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    // update
                    if(req.body.img_change) {
                        let rootPath = 'uploads/'+req.id+'/measurements';
                        imgUploadService.singleFileUpload(req.body.image, rootPath, false, null).then((img) => {
                            req.body.image = img;
                            measurementSet[index] = req.body;
                            productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                            { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                                if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                                else { res.json({ status: false, error: err, message: "failure" }); }
                            });
                        });
                    }
                    else {
                        measurementSet[index] = req.body;
                        productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                        { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                }
                else { res.json({ status: false, error: "Invalid measurement-set", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
}

exports.soft_remove = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { measurement_set: 1 }, function(err, response) {
            if(!err && response) {
                let measurementSet = response.measurement_set;
                // dec rank
                measurementSet.forEach((object) => {
                    if(req.body.rank<object.rank) {
                        object.rank = object.rank-1;
                    }
                });
                let index = measurementSet.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    measurementSet[index].status = "inactive";
                    measurementSet[index].rank = 0;
                    // update
                    vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                    { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid measurement-set", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { measurement_set: 1 }, function(err, response) {
            if(!err && response) {
                let measurementSet = response.measurement_set;
                // dec rank
                measurementSet.forEach((object) => {
                    if(req.body.rank<object.rank) {
                        object.rank = object.rank-1;
                    }
                });
                let index = measurementSet.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    measurementSet[index].status = "inactive";
                    measurementSet[index].rank = 0;
                    // update
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { measurement_set: measurementSet } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.measurement_set.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid measurement-set", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
}