"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const layout = require("../../models/layout.model");
const storeFeatures = require("../../models/store_features.model");
const storeService = require("../../../services/store.service");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    if(req.query.layout_id) {
        layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.layout_id) }, function(err, response) {
            if(!err && response) {
                let respData = { status: true, data: response };
                if(req.query.adsetting) {
                    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { ad_config: 1 }, function(err, response) {
                        if(!err && response) {
                            respData.ad_setting = response.ad_config;
                            res.json(respData);
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json(respData); }
            }
            else { res.json({ status: false, error: err, message: "Invalid Segment" }); }
        });
    }
    else {
        layout.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response });
            }
            else {
                res.json({ status: false, error: err, message: "Invalid User" });
            }
        });
    }
}

exports.add = (req, res) => {
    layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), name: req.body.name }, function(err, response) {
        if(!err && !response)
        {
            req.body.store_id = req.id;
            if(req.body.type=='highlights' || req.body.type=='instagram' || req.body.type=='blogs') {
                layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), type: req.body.type }, function(err, response) {
                    if(!err && !response)
                    {
                        // inc rank
                        layout.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gte: req.body.rank } },
                        { $inc: { "rank": 1 } }, function(err, response) {
                            // add
                            layout.create(req.body, function(err, response) {
                                if(!err && response) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Unable to add" }); }
                            });
                        });
                    }
                    else {
                        let sType = req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1);
                        res.json({ status: false, error: err, message: sType+" already exists" });
                    }
                });
            }
            else {
                // inc rank
                layout.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gte: req.body.rank } },
                { $inc: { "rank": 1 } }, function(err, response) {
                    // add
                    layout.create(req.body, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                });
            }
        }
        else { res.json({ status: false, error: err, message: "Segment name already exists" }); }
    });
}

exports.update = (req, res) => {
    delete req.body.ad_status; delete req.body.ad_config;
    layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), name: req.body.name, _id: { $ne: mongoose.Types.ObjectId(req.body._id) } }, function(err, response) {
        if(!err && !response)
        {
            layout.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
                if(!err && response)
                {
                    req.body.updated_on = new Date();
                    if(req.body.prev_rank < req.body.rank)
                    {
                        // dec rank
                        layout.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                        { $inc: { "rank": -1 } }, function(err, response) {
                            // update
                            layout.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                                if(!err && response) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        });
                    }
                    else if(req.body.prev_rank > req.body.rank)
                    {
                        // inc rank
                        layout.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
                        { $inc: { "rank": 1 } }, function(err, response) {
                            // update
                            layout.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                                if(!err && response) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        });
                    }
                    else {
                        // update
                        layout.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                            if(!err && response) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid layout" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Layout name exists" });
        }
    });   
};

exports.update_image_list = (req, res) => {
    layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            let rootPath = 'uploads/'+req.id+'/layouts';
            let existingImgList = response.image_list;
            let newImgList = req.body.image_list.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
            if(response.type=='primary_slider') {
                PrimaryFileUpload(existingImgList, newImgList, rootPath).then((imgList) => {
                    layout.findOneAndUpdate({
                        store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id)
                    },
                    { $set: { "image_list": imgList, updated_on: new Date() } }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false }); }
                    });
                });
            }
            else if(response.type=='shopping_assistant') {
                let SA_config = req.body.shopping_assistant_config;
                let saFile = null;
                if(SA_config.img_change) { saFile = SA_config.image; }
                imgUploadService.singleFileUpload(saFile, rootPath, true, null).then((img) => {
                    if(img) {
                        if(SA_config.image) { unlinkImg(SA_config.image); }
                        SA_config.image = img;
                    }
                    layout.findOneAndUpdate({
                        store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id)
                    },
                    { $set: { "shopping_assistant_config": SA_config, updated_on: new Date() } }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false }); }
                    });
                });
            }
            else {
                MultiFileUpload(existingImgList, newImgList, rootPath).then((imgList) => {
                    layout.findOneAndUpdate({
                        store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id)
                    },
                    { $set: { "image_list": imgList, updated_on: new Date() } }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false }); }
                    });
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

exports.update_image_list_v2 = (req, res) => {
    let formData = JSON.parse(req.body.data);
    layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(formData._id) }, function(err, response) {
        if(!err && response)
        {
            let rootPath = 'uploads/'+req.id+'/layouts';
            let existingImgList = response.image_list;
            recreateImageList(formData.image_list, req.files).then((updatedImgList) => {
                let newImgList = updatedImgList.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
                if(response.type=='primary_slider') {
                    PrimaryFileUploadV2(existingImgList, newImgList, rootPath).then((imgList) => {
                        layout.findOneAndUpdate({
                            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(formData._id)
                        },
                        { $set: { "image_list": imgList, updated_on: new Date() } }, function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false }); }
                        });
                    });
                }
                else if(response.type=='shopping_assistant') {
                    let SA_config = formData.shopping_assistant_config;
                    let saFile = null;
                    if(SA_config.img_change) { saFile = req.files.attachments; }
                    imgUploadService.imageFileUpload(saFile, rootPath, true, null).then((img) => {
                        if(img) {
                            if(SA_config.image) { unlinkImg(SA_config.image); }
                            SA_config.image = img;
                        }
                        layout.findOneAndUpdate({
                            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(formData._id)
                        },
                        { $set: { "shopping_assistant_config": SA_config, updated_on: new Date() } }, function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false }); }
                        });
                    });
                }
                else if(response.type == 'video_section') {
                    let videoData = {};
                    if(response.video_details) { videoData = response.video_details; }
                    let imageFile = null; let videoFile = null;
                    if(formData.video_details.img_change) { imageFile = req.files.thumbnail; }
                    if(formData.video_details.video_change) { videoFile = req.files.video; }
                    imgUploadService.imageFileUpload(imageFile, rootPath, true, null).then((img) => {
                        if(img) {
                            if(videoData.thumbnail) { unlinkImg(videoData.thumbnail); }
                            videoData.thumbnail = img;
                        }
                        imgUploadService.fileUpload(videoFile, rootPath, null).then((video) => {
                            if(video) {
                                if(videoData.src) { unlinkImg(videoData.src); }
                                videoData.src = video;
                            }
                            layout.findOneAndUpdate({
                                store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(formData._id)
                            },
                            { $set: { "video_details": videoData, updated_on: new Date() } }, function(err, response) {
                                if(!err) { res.json({ status: true }); }
                                else { res.json({ status: false }); }
                            });
                        });
                    });
                }
                else {
                    MultiFileUploadV2(existingImgList, newImgList, rootPath).then((imgList) => {
                        layout.findOneAndUpdate({
                            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(formData._id)
                        },
                        { $set: { "image_list": imgList, updated_on: new Date() } }, function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false }); }
                        });
                    });
                }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid User" }); }
    });
}

exports.reset = (req, res) => {
    storeService.create_layout(req.id).then(() => {
        res.json({ status: true });
    }).catch((errData) => { res.json(errData); });
}

exports.delete = (req, res) => {
    layout.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let imgList = response.image_list;
            // dec rank
            layout.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.rank } },
            { $inc: { "rank": -1 } }, function(err, response) {
                // remove
                layout.findOneAndRemove({ store_id: mongoose.Types.ObjectId(req.id), _id: req.body._id }, function(err, response) {
                    if(!err && response) {
                        unlinkLayoutImages(imgList).then((resp) => {
                            res.json({ status: true });
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

function recreateImageList(imgList, files) {
    return new Promise((resolve, reject) => {
        if(files && files.attachments) {
            let fileList = files.attachments;
            if(!Array.isArray(fileList)) { fileList = [fileList]; }
            for(let i=0; i<imgList.length; i++)
            {
                if(imgList[i].desktop_img_change) {
                    let tempName = i+'_d';
                    let fIndex = fileList.findIndex(el => el.name==tempName);
                    if(fIndex!=-1) { imgList[i].desktop_img = fileList[fIndex]; }
                    else { imgList[i].desktop_img_change = false }
                }
                if(imgList[i].mobile_img_change) {
                    let tempName = i+'_m';
                    let fIndex = fileList.findIndex(el => el.name==tempName);
                    if(fIndex!=-1) { imgList[i].mobile_img = fileList[fIndex]; }
                    else { imgList[i].mobile_img_change = false }
                }
            }
            resolve(imgList);
        }
        else resolve(imgList);
    });
}

async function MultiFileUploadV2(existImgList, imgList, rootPath) {
    let recreateImgList = [];
    for(let i=0; i<imgList.length; i++)
    {
        imgList[i].rank = i+1;
        if(imgList[i].desktop_img_change) {
            imgList[i].desktop_img = await imgUploadService.imageFileUpload(imgList[i].desktop_img, rootPath, true, null);
            if(existImgList[i] && existImgList[i].desktop_img) { unlinkImg(existImgList[i].desktop_img); }
        }
        if(imgList[i].mobile_img_change) {
            imgList[i].mobile_img = await imgUploadService.imageFileUpload(imgList[i].mobile_img, rootPath, true, null);
            if(existImgList[i] && existImgList[i].mobile_img) { unlinkImg(existImgList[i].mobile_img); }
        }
        recreateImgList.push(imgList[i]);
    }
    return recreateImgList;
}

async function PrimaryFileUploadV2(existImgList, imgList, rootPath) {
    let recreateImgList = [];
    for(let i=0; i<imgList.length; i++)
    {
        imgList[i].rank = i+1;
        if(imgList[i].desktop_img_change) {
            let imgName = null;
            if(i===0) { imgName = "desktop_primary_slider"; }
            if(existImgList[i] && existImgList[i].desktop_img) { unlinkImg(existImgList[i].desktop_img); }
            imgList[i].desktop_img = await imgUploadService.imageFileUpload(imgList[i].desktop_img, rootPath, true, imgName);
        }
        if(imgList[i].mobile_img_change) {
            let imgName = null;
            if(i===0) { imgName = "mobile_primary_slider"; }
            if(existImgList[i] && existImgList[i].mobile_img) { unlinkImg(existImgList[i].mobile_img); }
            imgList[i].mobile_img = await imgUploadService.imageFileUpload(imgList[i].mobile_img, rootPath, true, imgName);
        }
        recreateImgList.push(imgList[i]);
    }
    return recreateImgList;
}

async function MultiFileUpload(existImgList, imgList, rootPath) {
    let recreateImgList = [];
    for(let i=0; i<imgList.length; i++)
    {
        imgList[i].rank = i+1;
        if(imgList[i].desktop_img_change) {
            imgList[i].desktop_img = await imgUploadService.singleFileUpload(imgList[i].desktop_img, rootPath, true, null);
            if(existImgList[i] && existImgList[i].desktop_img) { unlinkImg(existImgList[i].desktop_img); }
        }
        if(imgList[i].mobile_img_change) {
            imgList[i].mobile_img = await imgUploadService.singleFileUpload(imgList[i].mobile_img, rootPath, true, null);
            if(existImgList[i] && existImgList[i].mobile_img) { unlinkImg(existImgList[i].mobile_img); }
        }
        recreateImgList.push(imgList[i]);
    }
    return recreateImgList;
}

async function PrimaryFileUpload(existImgList, imgList, rootPath) {
    let recreateImgList = [];
    for(let i=0; i<imgList.length; i++)
    {
        imgList[i].rank = i+1;
        if(imgList[i].desktop_img_change) {
            let imgName = null;
            if(i===0) { imgName = "desktop_primary_slider"; }
            if(existImgList[i] && existImgList[i].desktop_img) { unlinkImg(existImgList[i].desktop_img); }
            imgList[i].desktop_img = await imgUploadService.singleFileUpload(imgList[i].desktop_img, rootPath, true, imgName);
        }
        if(imgList[i].mobile_img_change) {
            let imgName = null;
            if(i===0) { imgName = "mobile_primary_slider"; }
            if(existImgList[i] && existImgList[i].mobile_img) { unlinkImg(existImgList[i].mobile_img); }
            imgList[i].mobile_img = await imgUploadService.singleFileUpload(imgList[i].mobile_img, rootPath, true, imgName);
        }
        recreateImgList.push(imgList[i]);
    }
    return recreateImgList;
}

// unlink images
function unlinkLayoutImages(imgList) {
    return new Promise((resolve, reject) => {
        for(let i=0; i<imgList.length; i++)
        {
            // desktop img
            if(imgList[i].desktop_img) { unlinkImg(imgList[i].desktop_img); }
            // mobile img
            if(imgList[i].mobile_img) { unlinkImg(imgList[i].mobile_img); }
        }
        resolve(true);
    });
}

function unlinkImg(inputImg) {
    if(inputImg.indexOf('uploads/yourstore/')==-1 && inputImg.indexOf('yspi')==-1) {
        fs.unlink(inputImg, function (err) { });
        let smallImg = inputImg.split(".");
        if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
    }
}