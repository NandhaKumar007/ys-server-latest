"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const store = require("../../models/store.model");
const sections = require("../../models/section.model");
const restoredSections = require("../../models/restored_section.model");
const storeService = require("../../../services/store.service");
const commonService = require("../../../services/common.service");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    sections.findOne({ _id: mongoose.Types.ObjectId(req.query.section_id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response.categories });
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.details = (req, res) => {
    sections.findOne({ _id: mongoose.Types.ObjectId(req.body.section_id), "categories._id": mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let category = response.categories.filter(object => object._id.toString()==req.body._id);
            if(category.length) {
                res.json({ status: true, data: category[0] });
            }
            else {
                res.json({ status: false, error: err, message: "Invalid category" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add = (req, res) => {
    sections.findOne({ _id: mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response)
        {
            let categoryList = response.categories;
            if(categoryList.findIndex(obj => obj.name==req.body.name) == -1) {
                // inc rank
                categoryList.forEach((object) => {
                    if(req.body.rank <= object.rank) {
                        object.rank = object.rank+1;
                    }
                });
                // add
                let pathName = response.name+"-"+req.body.name;
                let seoUrl = commonService.urlFormat(pathName);
                if(seoUrl) {
                    req.body.seo_status = true;
                    req.body.seo_details = {
                        page_url: seoUrl,
                        h1_tag: req.body.name.substring(0, 70),
                        page_title: req.body.name.substring(0, 70)
                    };
                }
                categoryList.push(req.body);
                sections.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.section_id) },
                { $set: { categories: categoryList } }, function(err, response) {
                    if(!err && response) {
                        storeService.updateStoreSitemap(req.id);
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: err, message: "Name already exists" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid section" });
        }
    });
}

exports.update = (req, res) => {
	sections.findOne({ _id: mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response)
        {
            let categoryList = response.categories;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                categoryList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                categoryList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = categoryList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                // seo details
                if(!req.body.seo_details) { req.body.seo_details = {}; }
                if(!req.body.seo_details.modified) {
                    let pathName = response.name+"-"+req.body.name;
                    let seoUrl = commonService.urlFormat(pathName);
                    if(seoUrl) {
                        req.body.seo_status = true;
                        req.body.seo_details.page_url = seoUrl;
                        req.body.seo_details.h1_tag = req.body.name.substring(0, 70);
                        req.body.seo_details.page_title = req.body.name.substring(0, 70);
                    }
                }
                // update
                if(req.body.img_change) {
                    if(req.body.exist_image) {
                        fs.unlink(req.body.exist_image, function (err) { });
                        let smallImg = req.body.exist_image.split(".");
                        if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                    }
                    let rootPath = 'uploads/'+req.id+'/category';
                    imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                        req.body.image = img;
                        categoryList[index] = req.body;
                        sections.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.section_id) },
                        { $set: { categories: categoryList } }, function(err, response) {
                            if(!err && response) {
                                storeService.updateStoreSitemap(req.id);
                                res.json({ status: true });
                            }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    });
                }
                else {
                    categoryList[index] = req.body;
                    sections.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.section_id) },
                    { $set: { categories: categoryList } }, function(err, response) {
                        if(!err && response) {
                            storeService.updateStoreSitemap(req.id);
                            res.json({ status: true });
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
            }
            else {
                res.json({ status: false, error: "Invalid category", message: "Failure" });
            }  
        }
        else {
            res.json({ status: false, error: err, message: "Invalid section" });
        }
    });
}

exports.soft_remove = (req, res) => {
	sections.findOne({ _id: mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response)
        {
            let categoryList = response.categories;
            // dec rank
            categoryList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = categoryList.findIndex(object => object._id == req.body._id);
            if(index != -1) {
                let restoreData = {
                    store_id: req.id, type: 'category', section_id: req.body.section_id,
                    category_id: req.body._id, details: categoryList[index]
                };
                categoryList.splice(index, 1);
                // update
                sections.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.section_id) },
                { $set: { categories: categoryList } }, function(err, response) {
                    if(!err && response) {
                        restoredSections.create(restoreData, function(err, response) {
                            storeService.updateStoreSitemap(req.id);
                            res.json({ status: true });
                        });
                    }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, error: "Invalid category", message: "Failure" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid section" });
        }
    });
}