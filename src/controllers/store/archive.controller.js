"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const archives = require("../../models/archive.model");
const products = require("../../models/product.model");
const storeService = require("../../../services/store.service");

exports.list = (req, res) => {
    archives.aggregate([
        { $match:
            { store_id: mongoose.Types.ObjectId(req.id), status: "active" }
        },
        { $lookup: 
            { from: "products", localField: "_id", foreignField: "archive_id", as: "archive_products" }
        }
    ], function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    req.body.store_id = req.id;
    archives.findOne({ store_id: mongoose.Types.ObjectId(req.id), name: req.body.name, status: "active" }, function(err, response) {
        if(!err && !response)
        {
            // inc rank
            archives.updateMany({ store_id: mongoose.Types.ObjectId(req.id), status: "active", rank: { $gte: req.body.rank } },
            { $inc: { "rank": 1 } }, function(err, response) {
                // add
                archives.create(req.body, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Folder name already exists" });
        }
    });
}

exports.update = (req, res) => {
    archives.findOne({ _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                archives.updateMany({ store_id: mongoose.Types.ObjectId(req.id), status: "active", rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                { $inc: { "rank": -1 } }, function(err, response) {
                    // update
                    archives.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                archives.updateMany({ store_id: mongoose.Types.ObjectId(req.id), status: "active", rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
                { $inc: { "rank": 1 } }, function(err, response) {
                    // update
                    archives.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else {
                // update
                archives.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid folder" });
        }
    });
}

exports.soft_remove = (req, res) => {
    archives.findOne({ _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            // dec rank
            archives.updateMany({ store_id: mongoose.Types.ObjectId(req.id), status: "active", rank: { $gt: req.body.rank } },
            { $inc: { "rank": -1 } }, function(err, response) {
                // update
                archives.findByIdAndUpdate(req.body._id, { $set: { status: 'inactive', rank: 0 } }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid folder" });
        }
    });
}

exports.product_list = (req, res) => {
    products.find({
        store_id: mongoose.Types.ObjectId(req.id), archive_id: mongoose.Types.ObjectId(req.query.archive_id), archive_status: true, status: 'active'
    }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.move_from_archive = (req, res) => {
    if(req.body.archive_status)
    {
        // Move to another archive folder
        products.findByIdAndUpdate(req.body.product_id,
        { $set: { archive_id: req.body.archive_id } }, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        // Revert to product list
        products.aggregate([{ $match: { store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: 'active' } },
        { $count: "product_count" }], function(err, response) {
            let productRank = 1;
            if(!err && response[0]) { productRank = response[0].product_count + 1; }
            // update product
            products.findByIdAndUpdate(req.body.product_id,
            { $set: { archive_status: false, rank: productRank } }, function(err, response) {
                if(!err && response) {
                    storeService.updateStoreSitemap(req.id);
                    res.json({ status: true });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        });
    }
}

exports.move_bulk_products_from_archive = (req, res) => {
    // get active product count
    products.aggregate([{ $match: { store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: 'active' } },
    { $count: "product_count" }], function(err, response) {
        let productRank = 1;
        if(!err && response[0]) { productRank = response[0].product_count + 1; }
        // get archieve product list
        products.find({ store_id: mongoose.Types.ObjectId(req.id), archive_id: req.body.archive_id, archive_status: true, status: 'active' }, function(err, response) {
            if(!err && response) {
                updateProducts(response, productRank).then((respData) => {
                    storeService.updateStoreSitemap(req.id);
                    res.json({ status: true });
                });
            }
            else {
                res.json({ status: false, error: err, message: "Invalid Archive" });
            }
        });
    });
}

function updateProductDetails(productId, details) {
    return new Promise((resolve, reject) => {
        let productDetails = {};
        if(details) productDetails = JSON.parse(details);
        products.findByIdAndUpdate(productId, { $set: productDetails }, function(err, response) {
            resolve(true);
        });
    });
}

async function updateProducts(productList, maxRank) {
    for(let i=0; i<productList.length; i++)
    {
        let updateDetails = JSON.stringify({ archive_status: false, rank: maxRank+i });
        await updateProductDetails(productList[i]._id, updateDetails);
    }
    return true;
}