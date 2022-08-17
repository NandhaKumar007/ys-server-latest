"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const blog = require("../../models/blog.model");
const store = require("../../models/store.model");
const storeService = require("../../../services/store.service");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    blog.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: true, list: [] }); }
    });
}

exports.add = (req, res) => {
    req.body.store_id = req.id;
    let rootPath = 'uploads/'+req.id+'/blogs';
    imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
        req.body.image = img;
        blog.create(req.body, function(err, response) {
            if(!err && response) {
                storeService.updateStoreSitemap(req.id);
                res.json({ status: true });
            }
            else { res.json({ status: false, error: err, message: "Unable to add" }); }
        });
    });
}

exports.update = (req, res) => {
    blog.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            if(req.body.img_change) {
                // remove existing img
                if(req.body.exist_image) {
                    fs.unlink(req.body.exist_image, function (err) { });
                    let smallImg = req.body.exist_image.split(".");
                    if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                }
                // upload new img
                let rootPath = 'uploads/'+req.id+'/blogs';
                imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                    req.body.image = img;
                    blog.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) {
                            storeService.updateStoreSitemap(req.id);
                            res.json({ status: true });
                        }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else {
                blog.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                    if(!err && response) {
                        storeService.updateStoreSitemap(req.id);
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid blog" });
        }
    });
}

exports.hard_remove = (req, res) => {
    blog.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            blog.findOneAndRemove({ _id: req.body._id }, function(err, response) {
                if(!err && response)
                {
                    // remove existing img
                    if(req.body.image) {
                        fs.unlink(req.body.image, function (err) { });
                        let smallImg = req.body.image.split(".");
                        if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
                    }
                    storeService.updateStoreSitemap(req.id);
                    res.json({ status: true });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid blog" });
        }
    });
}

exports.details = (req, res) => {
    blog.findOne({ _id: mongoose.Types.ObjectId(req.query.blog_id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid blog" });
        }
    });
}