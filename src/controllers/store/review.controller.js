"use strict";
const mongoose = require('mongoose');
const products = require("../../models/product.model");
const productReview = require("../../models/product_reviews.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    let queryParams = {};
    if(req.body.product_id) {
        queryParams = { store_id: mongoose.Types.ObjectId(req.id), product_id: mongoose.Types.ObjectId(req.body.product_id) };
    }
    else if(req.body.from_date && req.body.to_date) {
        let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
        let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
        if(req.body.id) {
            queryParams = { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.id) };
        }
        else {
            if(req.body.type=='all') {
                queryParams = { store_id: mongoose.Types.ObjectId(req.id), "reviews.created_on": { $gte: new Date(fromDate), $lt: new Date(toDate) } };
            }
            else {
                queryParams = { store_id: mongoose.Types.ObjectId(req.id), "reviews.status": req.body.type, "reviews.created_on": { $gte: new Date(fromDate), $lt: new Date(toDate) } };
            }
        }
    }
    if(Object.entries(queryParams).length) {
        productReview.aggregate([
            { $match: queryParams },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
        ], function(err, response) {
            if(!err && response) {
                if(req.body.product_id) {
                    if(response.length) { res.json({ status: true, list: response }); }
                    else {
                        products.findOne({ _id: mongoose.Types.ObjectId(req.body.product_id), status: 'active' }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: [{ productDetails: [response], reviews: [] }] }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                }
                else {
                    let prodList = [];
                    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
                    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
                    for(let prod of response) {
                        if(req.body.type=='all') {
                            prod.reviews = prod.reviews.filter(obj => new Date(obj.created_on)>=new Date(fromDate) && new Date(obj.created_on)<new Date(toDate));
                        }
                        else {
                            prod.reviews = prod.reviews.filter(obj => obj.status==req.body.type && new Date(obj.created_on)>=new Date(fromDate) && new Date(obj.created_on)<new Date(toDate));
                        }
                        if(prod.reviews.length) { prodList.push(prod) }
                    }
                    res.json({ status: true, list: prodList });
                }
            }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else { res.json({ status: false, message: "Invalid query" }); }
}

exports.add = (req, res) => {
    // upload images
    let rootPath = 'uploads/'+req.id+'/reviews';
    let filteredImgList = req.body.image_list.filter(obj => obj.image);
    MultiFileUpload(filteredImgList, rootPath).then((imgNameList) => {
        req.body.image_list = imgNameList;
        productReview.findOne({ store_id: mongoose.Types.ObjectId(req.id), product_id: mongoose.Types.ObjectId(req.body.product_id) }, function(err, response) {
            if(!err && response) {
                // add review
                productReview.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                { $push: { reviews: req.body } }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add review" }); }
                });
            }
            else {
                // add product with review
                productReview.create({ store_id: req.id, product_id: req.body.product_id, reviews: [req.body] }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
        });
    });
}

exports.update = (req, res) => {
    // upload images
    let rootPath = 'uploads/'+req.id+'/reviews';
    let filteredImgList = req.body.image_list.filter(obj => obj.image);
    MultiFileUpload(filteredImgList, rootPath).then((imgNameList) => {
        req.body.image_list = imgNameList;
        productReview.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), product_id: mongoose.Types.ObjectId(req.body.product_id), "reviews._id": mongoose.Types.ObjectId(req.body._id) },
        { $set: { "reviews.$": req.body } }, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    });
}

exports.hard_remove = (req, res) => {
    productReview.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), product_id: mongoose.Types.ObjectId(req.body.product_id) },
    { $pull: { "reviews" : { "_id": mongoose.Types.ObjectId(req.body._id) } } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

async function MultiFileUpload(imgList, rootPath) {
    let nameList = [];
    for(let i=0; i<imgList.length; i++)
    {
        if(imgList[i].img_change) {
            imgList[i].image = await imgUploadService.singleFileUpload(imgList[i].image, rootPath, true, null);
        }
        nameList.push(imgList[i]);
    }
    return nameList;
}