"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const banner = require("../../models/banner.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.details = (req, res) => {
    banner.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response.banner_list });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

exports.update = (req, res) => {
	banner.findOne({ store_id: mongoose.Types.ObjectId(req.id), "banner_list._id": mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            let bannerIndex = response.banner_list.findIndex(obj => obj._id.toString()==req.body._id);
            if(bannerIndex!=-1) {
                let existImgList = response.banner_list[bannerIndex].image_list;
                let rootPath = 'uploads/'+req.id+'/banners';
                MultiFileUpload(existImgList, req.body.image_list, rootPath).then((imgList) => {
                    banner.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "banner_list._id": mongoose.Types.ObjectId(req.body._id) },
                    { $set: { "banner_list.$.active_status": req.body.active_status, "banner_list.$.image_list": imgList } }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false }); }
                    });
                });
            }
            else {
                res.json({ status: false, message: "Invalid Banner" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
};

async function MultiFileUpload(existImgList, imgList, rootPath) {
    let recreateImgList = [];
    for(let i=0; i<imgList.length; i++)
    {
        imgList[i].rank = i+1;
        if(imgList[i].desktop_img_change) {
            imgList[i].desktop_img = await imgUploadService.singleFileUpload(imgList[i].desktop_img, rootPath, true, null);
            if(existImgList[i] && existImgList[i].desktop_img) {
                fs.unlink(existImgList[i].desktop_img, function (err) { });
                let smallImg = existImgList[i].desktop_img.split(".");
                if(smallImg.length>1) { fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { }); }
            }
        }
        if(imgList[i].mobile_img_change) {
            imgList[i].mobile_img = await imgUploadService.singleFileUpload(imgList[i].mobile_img, rootPath, true, null);
            if(existImgList[i] && existImgList[i].mobile_img) {
                fs.unlink(existImgList[i].mobile_img, function (err) { });
                let smallImg = existImgList[i].mobile_img.split(".");
                if(smallImg.length>1) { fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { }); }
            }
        }
        recreateImgList.push(imgList[i]);
    }
    return recreateImgList;
}