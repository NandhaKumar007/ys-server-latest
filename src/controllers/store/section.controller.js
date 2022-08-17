"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const sections = require("../../models/section.model");
const restoredSections = require("../../models/restored_section.model");
const storeService = require("../../../services/store.service");
const commonService = require("../../../services/common.service");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    sections.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.details = (req, res) => {
    sections.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add = (req, res) => {
	req.body.store_id = req.id;
	sections.findOne({ store_id: mongoose.Types.ObjectId(req.id), name: req.body.name }, function(err, response) {
        if(!err && !response)
        {
            // inc rank
            sections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gte: req.body.rank } },
            { $inc: { "rank": 1 } }, function(err, response) {
                let seoUrl = commonService.urlFormat(req.body.name);
                if(seoUrl) {
                    req.body.seo_status = true;
                    req.body.seo_details = {
                        page_url: seoUrl,
                        h1_tag: req.body.name.substring(0, 70),
                        page_title: req.body.name.substring(0, 70)
                    };
                }
                // add
                sections.create(req.body, function(err, response) {
                    if(!err && response) {
                        storeService.updateStoreSitemap(req.id);
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Name already exists" });
        }
    });
}

exports.update = (req, res) => {
    let rootPath = 'uploads/'+req.id+'/category';
	sections.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            if(!req.body.seo_details) { req.body.seo_details = {}; }
            if(!req.body.seo_details.modified) {
                let seoUrl = commonService.urlFormat(req.body.name);
                if(seoUrl) {
                    req.body.seo_status = true;
                    req.body.seo_details.page_url = seoUrl;
                    req.body.seo_details.h1_tag = req.body.name.substring(0, 70);
                    req.body.seo_details.page_title = req.body.name.substring(0, 70);
                }
            }
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                sections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                { $inc: { "rank": -1 } }, function(err, response) {
                    // update
                    if(req.body.img_change) {
                        // remove existing img
                        if(req.body.exist_image) {
                            fs.unlink(req.body.exist_image, function (err) { });
                            let smallImg = req.body.exist_image.split(".");
                            if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                        }
                        // upload new img
                        imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                            req.body.image = img;
                            sections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                                if(!err && response) {
                                    storeService.updateStoreSitemap(req.id);
                                    res.json({ status: true });
                                }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        });
                    }
                    else {
                        sections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                            if(!err && response) {
                                storeService.updateStoreSitemap(req.id);
                                res.json({ status: true });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                sections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
                { $inc: { "rank": 1 } }, function(err, response) {
                    // update
                    if(req.body.img_change) {
                        // remove existing img
                        if(req.body.exist_image) {
                            fs.unlink(req.body.exist_image, function (err) { });
                            let smallImg = req.body.exist_image.split(".");
                            if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                        }
                        // upload new img
                        imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                            req.body.image = img;
                            sections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                                if(!err && response) {
                                    storeService.updateStoreSitemap(req.id);
                                    res.json({ status: true });
                                }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        });
                    }
                    else {
                        sections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                            if(!err && response) {
                                storeService.updateStoreSitemap(req.id);
                                res.json({ status: true });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                });
            }
            else {
                // update
                if(req.body.img_change) {
                    // remove existing img
                    if(req.body.exist_image) {
                        fs.unlink(req.body.exist_image, function (err) { });
                        let smallImg = req.body.exist_image.split(".");
                        if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                    }
                    // upload new img
                    imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                        req.body.image = img;
                        sections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                            if(!err && response) {
                                storeService.updateStoreSitemap(req.id);
                                res.json({ status: true });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    });
                }
                else {
                    sections.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) {
                            storeService.updateStoreSitemap(req.id);
                            res.json({ status: true });
                        }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid section" });
        }
    });
}

exports.soft_remove = (req, res) => {
	sections.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            // dec rank
            sections.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.rank } },
            { $inc: { "rank": -1 } }, function(err, response) {
                // remove
                let restoreData = { store_id: req.id, type: 'section', section_id: req.body._id, details: req.body };
                sections.findOneAndRemove({ _id: req.body._id }, function(err, response) {
                    if(!err && response) {
                        restoredSections.create(restoreData, function(err, response) {
                            storeService.updateStoreSitemap(req.id);
                            res.json({ status: true });
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid section" });
        }
    });
}