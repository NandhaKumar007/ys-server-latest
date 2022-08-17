"use strict";
const mongoose = require('mongoose');
const productFeatures = require("../../models/product_features.model");

exports.list = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { tag_list: 1 }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.tag_list.filter(obj => obj.status=="active") }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    if(req.login_type=='vendor') {
        res.json({ status: false, message: "Permission Denied" });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response)
            {
                let tagList = response.tag_list;
                let index = tagList.findIndex(object => object.name==req.body.name && object.status=="active");
                if(index==-1)
                {
                    // inc rank
                    tagList.forEach((object) => {
                        if(req.body.rank<=object.rank && object.status=='active') {
                            object.rank = object.rank+1;
                        }
                    });
                    // add
                    tagList.push(req.body);
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { tag_list: tagList } }, { new: true }, function(err, response) {
                        if(!err) { res.json({ status: true, list: response.tag_list.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "Tag name already exists" });
                }
            }
            else {
                res.json({ status: false, error: err, message: "Invalid login" });
            }
        });
    }
}

exports.update = (req, res) => {
    if(req.body.vendor_id) {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), "tag_list._id": mongoose.Types.ObjectId(req.body._id) },
        { tag_list: 1 }, function(err, response) {
            if(!err && response) {
                let tIndex = response.tag_list.findIndex(obj => obj._id==req.body._id);
                let tagDetails = response.tag_list[tIndex];
                let vIndex = tagDetails.vendor_list.findIndex(obj => obj.vendor_id==req.body.vendor_id);
                if(vIndex!=-1) {
                    let fieldName = 'tag_list.'+tIndex+'.vendor_list.'+vIndex+'.option_list';
                    productFeatures.findOneAndUpdate(
                        { store_id: mongoose.Types.ObjectId(req.id) },
                        { '$set': { [fieldName]: req.body.option_list } }, { new: true },
                    function(err, response) {
                        if(!err && response) {
                            res.json({ status: true, list: response.tag_list.filter(obj => obj.status=="active") });
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else {
                    let tagData = { vendor_id: req.body.vendor_id, option_list: req.body.option_list };
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "tag_list._id": mongoose.Types.ObjectId(req.body._id) },
                    { $push: { "tag_list.$.vendor_list": tagData } }, { new: true }, function(err, response) {
                        if(!err && response) {
                            res.json({ status: true, list: response.tag_list.filter(obj => obj.status=="active") })
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
            }
            else { res.json({ status: false, error: err, message: "Invalid tag" }); }
        });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { tag_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let tagList = response.tag_list;
                if(req.body.prev_rank < req.body.rank)
                {
                    // dec rank
                    tagList.forEach((object) => {
                        if(req.body.prev_rank<object.rank && req.body.rank>=object.rank && object.status=='active') {
                            object.rank = object.rank-1;
                        }
                    });
                }
                else if(req.body.prev_rank > req.body.rank)
                {
                    // inc rank
                    tagList.forEach((object) => {
                        if(req.body.prev_rank>object.rank && req.body.rank<=object.rank && object.status=='active') {
                            object.rank = object.rank+1;
                        }
                    });
                }
                let index = tagList.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    // update
                    tagList[index] = req.body;
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { tag_list: tagList } }, { new: true }, function(err, response) {
                        if(!err) { res.json({ status: true, list: response.tag_list.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
                else { res.json({ status: false, error: "Invalid tag", message: "Failure" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid login" }); }
        });
    }
}

exports.soft_remove = (req, res) => {
    if(req.login_type=='vendor') {
        res.json({ status: false, message: "Permission Denied" });
    }
    else {
        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { tag_list: 1 }, function(err, response) {
            if(!err && response)
            {
                let tagList = response.tag_list;
                // dec rank
                tagList.forEach((object) => {
                    if(req.body.rank<object.rank && object.status=='active') {
                        object.rank = object.rank-1;
                    }
                });
                let index = tagList.findIndex(object => object._id == req.body._id);
                if(index != -1) {
                    tagList[index].status = "inactive";
                    tagList[index].rank = 0;
                    // update
                    productFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { tag_list: tagList } }, { new: true }, function(err, response) {
                        if(!err) { res.json({ status: true, list: response.tag_list.filter(obj => obj.status=="active") }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else {
                    res.json({ status: false, error: "Invalid tag", message: "Failure" });
                }
            }
            else {
                res.json({ status: false, error: err, message: "Invalid login" });
            }
        });
    }
}