"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const store = require("../../models/store.model");
const sections = require("../../models/section.model");
const products = require("../../models/product.model");
const archives = require("../../models/archive.model");
const erpService = require("../../../services/erp.service");
const storeService = require("../../../services/store.service");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    let productCount = 0;
    products.countDocuments({ store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: 'active' }, function(err, count) {
        if(!err && count) { productCount = count; }
        // product list
        let parentQueryParams = { store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: 'active' };
        // date range
        if(req.body.from_date && req.body.to_date) {
            let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
            let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
            parentQueryParams.created_on = { $gte: new Date(fromDate), $lt: new Date(toDate) };
        }
        // category id
        if(req.body.category_id=='unlink') { parentQueryParams.category_id = []; }
        else if(req.body.category_id!='all') { parentQueryParams.category_id = { "$in": [ req.body.category_id ] }; }
        // vendor
        if(req.login_type=='vendor' && req.vendor_id) { parentQueryParams.vendor_id = mongoose.Types.ObjectId(req.vendor_id); }
        if(req.body.vendor_id && req.body.vendor_id!='all') { parentQueryParams.vendor_id = mongoose.Types.ObjectId(req.body.vendor_id); }
        // product type
        if(req.body.product_type) {
            if(req.body.product_type=='in') { parentQueryParams.stock = { $gt: 0 }; }
            if(req.body.product_type=='out') { parentQueryParams.stock = { $lte: 0 }; }
        }
        if(req.body.search) {
            req.body.search = '\"'+req.body.search.trim()+'\"';
            parentQueryParams.$text = { $search: req.body.search };
        }
        products.countDocuments(parentQueryParams, function(err, count) {
            if(!err && count) {
                let queryParams = [{ $match: parentQueryParams }];
                if(req.body.sort_by)
                {
                    if(req.body.sort_by=='rank_desc') { queryParams.push({ $sort: { rank: -1 } }); }
                    else if(req.body.sort_by=='price_desc') { queryParams.push({ $sort: { discounted_price: -1 } }); }
                    else if(req.body.sort_by=='stock_desc') { queryParams.push({ $sort: { stock: -1 } }); }
                    else if(req.body.sort_by=='created_desc') { queryParams.push({ $sort: { created_on: -1 } }); }
                    else if(req.body.sort_by=='modified_desc') { queryParams.push({ $sort: { modified_on: -1 } }); }
                    else { queryParams.push({ $sort : { [req.body.sort_by] : 1 } }); }
                }
                if(req.body.limit) {
                    queryParams.push(
                        { $skip: parseInt(req.body.skip) },
                        { $limit: parseInt(req.body.limit) }
                    );
                }
                products.aggregate(queryParams, function(err, response) {
                    if(!err && response[0]) {
                        res.json({ status: true, product_count: productCount, count: count, list: response });
                    }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: true, product_count: productCount, count: 0, list: [] });
            }
        });
    });
}

exports.multi_list = (req, res) => {
    let prodIds = [];
    if(req.body.ids && req.body.ids.length) {
        req.body.ids.forEach((obj) => {
            prodIds.push(mongoose.Types.ObjectId(obj));
        });
    }
    if(prodIds.length) {
        products.find({ _id: { $in: prodIds }, store_id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, list: response });
            }
            else {
                res.json({ status: false, error: err, message: "failure" });
            }
        });
    }
    else {
        res.json({ status: true, list: [] });
    }
}

exports.details = (req, res) => {
    products.findOne({ _id: mongoose.Types.ObjectId(req.params.productId), status: 'active' }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.count = (req, res) => {
    let productCount = 0;
    products.countDocuments({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, count) {
        if(!err && count) { productCount = count; }
        res.json({ status: true, count: productCount });
    });
}

exports.add = (req, res) => {
    req.body.store_id = req.id;
    req.body.user_agent = req.get('User-Agent');
    if(req.login_type=='vendor' && req.vendor_id) { req.body.vendor_id = req.vendor_id; }
    if(req.body.limited_products) {
        products.aggregate([{ $match: { store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: 'active' } },
        { $count: "product_count" }], function(err, response) {
            if(!err && response) {
                if(!response.length || req.body.limited_products > response[0].product_count) {
                    addProduct(req.body).then((respData) => { res.json(respData); });
                }
                else {
                    res.json({ status: false, message: "Maximum "+req.body.limited_products+" products only allowed to add" });
                }
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else { addProduct(req.body).then((respData) => { res.json(respData); }); }
}

exports.update = (req, res) => {
    products.findOne({ store_id: mongoose.Types.ObjectId(req.id), sku: req.body.sku, status: 'active', _id: { $ne: mongoose.Types.ObjectId(req.body._id) } }, function(err, response) {
        if(!err && !response)
        {
            products.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
                if(!err && response)
                {
                    req.body.modified_on = new Date();
                    if(req.body.prev_rank < req.body.rank)
                    {
                        // dec rank
                        products.updateMany({
                            store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: "active",
                            _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                        { $inc: { "rank": -1 } }, function(err, response) {
                            // update
                            products.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                                if(!err && response) {
                                    storeService.updateStoreSitemap(req.id);
                                    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
                                        if(!err && response) {
                                            // ERP
                                            let erpDetails = response.erp_details;
                                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                let erpData = {
                                                    erp_config: erpDetails.config,
                                                    store_id: response._id, event_type: 'add_product',
                                                    user_agent: req.get('User-Agent'), product_details: req.body
                                                }
                                                erpService.ambar(erpData).then((respData) => {
                                                    res.json(respData);
                                                });
                                            }
                                            else res.json({ status: true });
                                        }
                                        else { res.json({ status: false, error: err, message: "Store update error" }); }
                                    });
                                }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        });
                    }
                    else if(req.body.prev_rank > req.body.rank)
                    {
                        // inc rank
                        products.updateMany({
                            store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: "active",
                            _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $lt: req.body.prev_rank, $gte : req.body.rank }
                        },
                        { $inc: { "rank": 1 } }, function(err, response) {
                            // update
                            products.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                                if(!err && response) {
                                    storeService.updateStoreSitemap(req.id);
                                    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
                                        if(!err && response) {
                                            // ERP
                                            let erpDetails = response.erp_details;
                                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                let erpData = {
                                                    erp_config: erpDetails.config,
                                                    store_id: response._id, event_type: 'add_product',
                                                    user_agent: req.get('User-Agent'), product_details: req.body
                                                }
                                                erpService.ambar(erpData).then((respData) => {
                                                    res.json(respData);
                                                });
                                            }
                                            else res.json({ status: true });
                                        }
                                        else { res.json({ status: false, error: err, message: "Store update error" }); }
                                    });
                                }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        });
                    }
                    else {
                        // update
                        products.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                            if(!err && response) {
                                storeService.updateStoreSitemap(req.id);
                                store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
                                    if(!err && response) {
                                        // ERP
                                        let erpDetails = response.erp_details;
                                        if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                            let erpData = {
                                                erp_config: erpDetails.config,
                                                store_id: response._id, event_type: 'add_product',
                                                user_agent: req.get('User-Agent'), product_details: req.body
                                            }
                                            erpService.ambar(erpData).then((respData) => {
                                                res.json(respData);
                                            });
                                        }
                                        else res.json({ status: true });
                                    }
                                    else { res.json({ status: false, error: err, message: "Store update error" }); }
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid product" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Product SKU already exists" });
        }
    });
}

exports.update_images = (req, res) => {
    products.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            req.body.modified_on = new Date();
            let rootPath = 'uploads/'+req.id+'/products';
            // upload images
            MultiFileUpload(req.body.image_list, rootPath).then((imgNameList) => {
                req.body.image_list = imgNameList;
                // video image upload
                if(!req.body.video_details) { req.body.video_details = {}; }
                VideoImageUpload(req.body.video_details, rootPath).then((videoDetails) => {
                    req.body.video_details = videoDetails;
                    // variant image upload
                    VariantFileUpload(req.body.variant_list, rootPath).then((variantList) => {
                        req.body.variant_list = variantList;
                        products.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                            if(!err && response) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    });
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid product" });
        }
    });
}

exports.upload_brochure = (req, res) => {
    let formData = JSON.parse(req.body.data);
    products.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(formData._id), status: "active" }, function(err, response) {
        if(!err && response)
        {
            let prodDetails = response;
            let rootPath = 'uploads/'+req.id+'/brochure';
            if(req.files && req.files.attachment) {
                imgUploadService.fileUpload(req.files.attachment, rootPath, null).then((fileName) => {
                    products.findByIdAndUpdate(prodDetails._id, { $set: { brochure: fileName } }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else { res.json({ status: false, message: "File doesn't exists" }); }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid product" });
        }
    });
}

exports.update_category = (req, res) => {
    products.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            let existDetails = response;
            req.body.modified_on = new Date();
            if(!req.body.category_id) { req.body.category_id = []; }
            products.findByIdAndUpdate(req.body._id, { $set: { category_id: req.body.category_id } }, function(err, response) {
                if(!err && response) {
                    updateCatalog(existDetails.category_id, req.body.category_id).then(() => {
                        storeService.updateStoreSitemap(req.id);
                        res.json({ status: true });
                    });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid product" });
        }
    });
}

exports.overall_update = (req, res) => {
    let userAgent = req.get('User-Agent');
    products.findOne({ store_id: mongoose.Types.ObjectId(req.id), sku: req.body.sku, status: 'active', _id: { $ne: mongoose.Types.ObjectId(req.body._id) } }, function(err, response) {
        if(!err && !response)
        {
            products.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
                if(!err && response)
                {
                    let existDetails = response;
                    req.body.modified_on = new Date();
                    let rootPath = 'uploads/'+req.id+'/products';
                    // upload images
                    MultiFileUpload(req.body.image_list, rootPath).then((imgNameList) => {
                        req.body.image_list = imgNameList;
                        // video image upload
                        if(!req.body.video_details) { req.body.video_details = {}; }
                        VideoImageUpload(req.body.video_details, rootPath).then((videoDetails) => {
                            req.body.video_details = videoDetails;
                            // variant image upload
                            VariantFileUpload(req.body.variant_list, rootPath).then((variantList) => {
                                req.body.variant_list = variantList;
                                if(req.body.prev_rank < req.body.rank)
                                {
                                    // dec rank
                                    products.updateMany({
                                        store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: "active",
                                        _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                                    { $inc: { "rank": -1 } }, function(err, response) {
                                        // update
                                        updateProduct(existDetails, req.body, userAgent)
                                        .then((respData) => { res.json(respData); })
                                        .catch((errData) => { res.json(errData); });
                                    });
                                }
                                else if(req.body.prev_rank > req.body.rank)
                                {
                                    // inc rank
                                    products.updateMany({
                                        store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: "active",
                                        _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $lt: req.body.prev_rank, $gte : req.body.rank }
                                    },
                                    { $inc: { "rank": 1 } }, function(err, response) {
                                        // update
                                        updateProduct(existDetails, req.body, userAgent)
                                        .then((respData) => { res.json(respData); })
                                        .catch((errData) => { res.json(errData); });
                                    });
                                }
                                else {
                                    // update
                                    updateProduct(existDetails, req.body, userAgent)
                                    .then((respData) => { res.json(respData); })
                                    .catch((errData) => { res.json(errData); });
                                }
                            });
                        });
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid product" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Product SKU already exists" }); }
    });
}

exports.soft_remove = (req, res) => {
    products.findOne({ _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let imageList = response.image_list;
            let newImgList = [imageList[0]];
            // dec rank
            products.updateMany({
                store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: "active",
                _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $gt: req.body.rank }
            },
            { $inc: { "rank": -1 } }, function(err, response) {
                // update
                products.findByIdAndUpdate(req.body._id, { $set: { image_list: newImgList, status: 'inactive', rank: 0 } }, function(err, response) {
                    if(!err && response) {
                        updateCatalog(response.category_id, []).then(() => {
                            unlinkProductImages(imageList).then(() => {
                                storeService.updateStoreSitemap(req.id);
                                res.json({ status: true });
                            });
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Product" });
        }
    });
}

exports.move_to_archive = (req, res) => {
    archives.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.archive_id), status: "active" }, function(err, response) {
        if(!err && response)
        {
            // dec rank
            products.updateMany({
                store_id: mongoose.Types.ObjectId(req.id), archive_status: false, status: "active",
                _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, rank: { $gt: req.body.rank }
            },
            { $inc: { "rank": -1 } }, function(err, response) {
                // update
                products.findByIdAndUpdate(req.body._id, { $set: { rank: 0, archive_status: true, archive_id: req.body.archive_id } }, function(err, response) {
                    if(!err && response) {
                        storeService.updateStoreSitemap(req.id);
                        res.json({ status: true });
                    }
                    else { res.json({ status: false, error: err, message: "Product update failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Folder" });
        }
    });  
}

// bulk upload from JSON
exports.addMany = (req, res) => {
    products.insertMany(req.body.product_list, function(err, response) {
        if(!err && response) {
            storeService.updateStoreSitemap(req.id);
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

function addProduct(productDetails) {
    return new Promise((resolve, reject) => {
        products.findOne({ store_id: mongoose.Types.ObjectId(productDetails.store_id), sku: productDetails.sku, status: 'active' }, function(err, response) {
            if(!err && !response)
            {
                // upload images
                let rootPath = 'uploads/'+productDetails.store_id+'/products';
                MultiFileUpload(productDetails.image_list, rootPath).then((imgNameList) => {
                    productDetails.image_list = imgNameList;
                    // video image upload
                    if(!productDetails.video_details) productDetails.video_details = {};
                    VideoImageUpload(productDetails.video_details, rootPath).then((videoDetails) => {
                        productDetails.video_details = videoDetails;
                        // variant image upload
                        VariantFileUpload(productDetails.variant_list, rootPath).then((variantList) => {
                            productDetails.variant_list = variantList;
                            // inc rank
                            productDetails._id = mongoose.Types.ObjectId();
                            products.updateMany({
                                store_id: mongoose.Types.ObjectId(productDetails.store_id), archive_status: false, status: "active",
                                _id: { $ne: mongoose.Types.ObjectId(productDetails._id) }, rank: { $gte: productDetails.rank }
                            },
                            { $inc: { "rank": 1 } }, function(err, response) {
                                // add
                                products.create(productDetails, function(err, response) {
                                    if(!err && response) {
                                        let prodData = response;
                                        updateCatalog([], prodData.category_id).then(() => {
                                            storeService.updateStoreSitemap(productDetails.store_id);
                                            store.findOne({ _id: mongoose.Types.ObjectId(productDetails.store_id) }, function(err, response) {
                                                if(!err && response) {
                                                    // ERP
                                                    let erpDetails = response.erp_details;
                                                    if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                                        let erpData = {
                                                            erp_config: erpDetails.config,
                                                            store_id: productDetails.store_id, event_type: 'add_product',
                                                            user_agent: productDetails.user_agent, product_details: productDetails
                                                        }
                                                        erpService.ambar(erpData).then((respData) => {
                                                            respData._id = prodData._id;
                                                            resolve(respData);
                                                        });
                                                    }
                                                    else resolve({ status: true, _id: prodData._id });
                                                }
                                                else { res.json({ status: false, error: err, message: "Store update error" }); }
                                            });
                                        });
                                    }
                                    else { resolve({ status: false, error: err, message: "Unable to add" }); }
                                });
                            });
                        });
                    });
                });    
            }
            else { resolve({ status: false, error: err, message: "Product SKU already exists" }); }
        });
    });
}

function updateProduct(existDetails, productDetails, userAgent) {
    return new Promise((resolve, reject) => {
        if(!productDetails.category_id) { productDetails.category_id = []; }
        products.findByIdAndUpdate(productDetails._id, { $set: productDetails }, function(err, response) {
            if(!err && response) {
                updateCatalog(existDetails.category_id, productDetails.category_id).then(() => {
                    storeService.updateStoreSitemap(productDetails.store_id);
                    store.findOne({ _id: mongoose.Types.ObjectId(productDetails.store_id) }, function(err, response) {
                        if(!err && response) {
                            // ERP
                            let erpDetails = response.erp_details;
                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                let erpData = {
                                    erp_config: erpDetails.config,
                                    store_id: response._id, event_type: 'add_product',
                                    user_agent: userAgent, product_details: productDetails
                                }
                                erpService.ambar(erpData).then((respData) => {
                                    resolve(respData);
                                });
                            }
                            else resolve({ status: true });
                        }
                        else { reject({ status: false, error: err, message: "Invalid Store" }); }
                    });
                });
            }
            else { reject({ status: false, error: err, message: "Failure" }); }
        });
    });
}

function updateCatalog(prevCatalog, newCatalog) {
    return new Promise((resolve, reject) => {
         // find unlinked catalog
         let set1 = prevCatalog.filter((val) => {
            return !newCatalog.find((final) => { return val == final; });
        });
        // find newly linked catalog
        let set2 = newCatalog.filter((val) => {
            return !prevCatalog.find((final) => { return val == final; });
        });
        let decCatalog = set1.map(val=> mongoose.Types.ObjectId(val));
        let incCatalog = set2.map(val=> mongoose.Types.ObjectId(val));
        if(decCatalog.length && incCatalog.length) {
            sections.updateMany({ _id: { $in: decCatalog }, product_count: { $gt: 0 } }, { $inc: { product_count: -1 } }, function(err, response) {
                sections.updateMany({ _id: { $in: incCatalog } }, { $inc: { product_count: 1 } }, function(err, response) {
                    resolve(true);
                });
            });
        }
        else if(decCatalog.length) {
            sections.updateMany({ _id: { $in: decCatalog }, product_count: { $gt: 0 } }, { $inc: { product_count: -1 } }, function(err, response) {
                resolve(true);
            });
        }
        else if(incCatalog.length) {
            sections.updateMany({ _id: { $in: incCatalog } }, { $inc: { product_count: 1 } }, function(err, response) {
                resolve(true);
            });
        }
        else { resolve(true); }
    });
}

async function MultiFileUpload(imgList, rootPath) {
    let nameList = [];
    for(let i=0; i<imgList.length; i++)
    {
        if(imgList[i].img_change) {
            let resizeConfig = null;
            if(imgList[i].resize_config) { resizeConfig = imgList[i].resize_config; }
            imgList[i].image = await imgUploadService.compressFileUpload(imgList[i].image, resizeConfig, rootPath, true, null);
        }
        nameList.push(imgList[i]);
    }
    return nameList;
}

async function VariantFileUpload(productVariants, rootPath) {
    let variantList = [];
    if(productVariants && productVariants.length) {
        for(let i=0; i<productVariants.length; i++)
        {
            let imgList = productVariants[i].image_list;
            if(!imgList) { imgList = []; }
            if(imgList && imgList.length) {
                for(let j=0; j<imgList.length; j++)
                {
                    if(imgList[j].img_change) {
                        let resizeConfig = null;
                        if(imgList[j].resize_config) { resizeConfig = imgList[j].resize_config; }
                        imgList[j].image = await imgUploadService.compressFileUpload(imgList[j].image, resizeConfig, rootPath, true, null);
                    }
                    delete imgList[j].img_change;
                }
            }
            productVariants[i].image_list = imgList;
            variantList.push(productVariants[i]);
        }
    }
    return variantList;
}

async function VideoImageUpload(videoDetails, rootPath) {
    if(videoDetails.image && videoDetails.img_change) {
        let resizeConfig = null;
        if(videoDetails.resize_config) { resizeConfig = videoDetails.resize_config; }
        videoDetails.image = await imgUploadService.compressFileUpload(videoDetails.image, resizeConfig, rootPath, true, null);
        return videoDetails;
    }
    else return videoDetails;
}

function unlinkProductImages(imgList) {
    return new Promise((resolve, reject) => {
        for(let i=1; i<imgList.length; i++)
        {
            if(imgList[i].image && imgList[i].image.indexOf('uploads/yourstore/')==-1) {
                fs.unlink(imgList[i].image, function (err) { });
                let smallImg = imgList[i].image.split(".");
                if(smallImg.length>1) fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { });
            }
        }
        resolve(true);
    });
}