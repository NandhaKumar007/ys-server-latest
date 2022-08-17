"use strict";
const mongoose = require('mongoose');
const vendorFeatures = require("../../models/vendor_features.model");
const productFeatures = require("../../models/product_features.model");

exports.list = (req, res) => {
    if(req.login_type=='vendor' || req.query.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.query.vendor_id) { vendorId = req.query.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { footnote_list: 1 }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
            else { res.json({ status: true, list: [] }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { footnote_list: 1 }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }  
}

exports.add = (req, res) => {
    if(req.login_type=='vendor' || req.body.vendor_id) {
        let vendorId = req.vendor_id;
        if(req.body.vendor_id) { vendorId = req.body.vendor_id; }
        vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId) },
        { footnote_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let footnoteList = response.footnote_list;
                let index = footnoteList.findIndex(object => object.name==req.body.name);
                if(index==-1)
                {
                    // inc rank
                    footnoteList.forEach((object) => {
                        if(req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                    // add
                    footnoteList.push(req.body);
                    vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                    { $set: { footnote_list: footnoteList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                }
                else { res.json({ status: false, error: err, message: "Name already exists" }); }
            }
            else {
                vendorFeatures.create({ store_id: req.id, _id: vendorId, footnote_list: [req.body] }, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { footnote_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let footnoteList = response.footnote_list;
                let index = footnoteList.findIndex(object => object.name==req.body.name);
                if(index==-1)
                {
                    // inc rank
                    footnoteList.forEach((object) => {
                        if(req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                    // add
                    footnoteList.push(req.body);
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { footnote_list: footnoteList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
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
        { footnote_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let footnoteList = response.footnote_list;
                if(req.body.prev_rank < req.body.rank)
                {
                    // dec rank
                    footnoteList.forEach((object) => {
                        if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                            object.rank = object.rank-1;
                        }
                    });
                }
                else if(req.body.prev_rank > req.body.rank)
                {
                    // inc rank
                    footnoteList.forEach((object) => {
                        if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                }
                let index = footnoteList.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    // update
                    footnoteList[index] = req.body;
                    vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                    { $set: { footnote_list: footnoteList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid note", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { footnote_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let footnoteList = response.footnote_list;
                if(req.body.prev_rank < req.body.rank)
                {
                    // dec rank
                    footnoteList.forEach((object) => {
                        if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                            object.rank = object.rank-1;
                        }
                    });
                }
                else if(req.body.prev_rank > req.body.rank)
                {
                    // inc rank
                    footnoteList.forEach((object) => {
                        if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                }
                let index = footnoteList.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    // update
                    footnoteList[index] = req.body;
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { footnote_list: footnoteList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid note", message: "Failure" }); }
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
        { footnote_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let footnoteList = response.footnote_list;
                // dec rank
                footnoteList.forEach((object) => {
                    if(req.body.rank<object.rank) {
                        object.rank = object.rank-1;
                    }
                });
                let index = footnoteList.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    footnoteList.splice(index, 1);
                    // update
                    vendorFeatures.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                    { $set: { footnote_list: footnoteList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid note", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { footnote_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let footnoteList = response.footnote_list;
                // dec rank
                footnoteList.forEach((object) => {
                    if(req.body.rank<object.rank) {
                        object.rank = object.rank-1;
                    }
                });
                let index = footnoteList.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    footnoteList.splice(index, 1);
                    // update
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { footnote_list: footnoteList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.footnote_list }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid note", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
}