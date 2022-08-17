"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const sections = require("../../models/section.model");
const product = require("../../models/product.model");
const productFeatures = require("../../models/product_features.model");
const productReview = require("../../models/product_reviews.model");
const orderList = require("../../models/order_list.model");
const quotList = require("../../models/quotation.model");

// category details
exports.category_details = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.body.category_id))
    {
        getCategoryById(req.query.store_id, req.body.category_id).then((categoryDetails) => {
            if(categoryDetails) {
                res.json({ status: true, data: categoryDetails });
            }
            else {
                getCategoryByName(req.query.store_id, req.body.category_id).then((categoryDetails) => {
                    if(categoryDetails) {
                        res.json({ status: true, data: categoryDetails });
                    }
                    else {
                        res.json({ status: false, message: "invalid category" });
                    }
                });
            }
        });
    }
    else
    {
        getCategoryByName(req.query.store_id, req.body.category_id).then((categoryDetails) => {
            if(categoryDetails) {
                res.json({ status: true, data: categoryDetails });
            }
            else {
                res.json({ status: false, message: "invalid category" });
            }
        });
    }
}

exports.category_details_v2 = (req, res) => {
    if(req.params.version=='v2') {
        if(mongoose.Types.ObjectId.isValid(req.body.category_id))
        {
            sections.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), _id: mongoose.Types.ObjectId(req.body.category_id), status: "active" }, function(err, response) {
                if(!err && response) {
                    res.json({ status: true, data: response });
                }
                else {
                    sections.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), "seo_details.page_url": req.body.category_id, status: "active" }, function(err, response) {
                        if(!err && response) {
                            res.json({ status: true, data: response });
                        }
                        else { res.json({ status: false, error: err, message: "invalid category" }); }
                    });
                }
            });
        }
        else
        {
            sections.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), "seo_details.page_url": req.body.category_id, status: "active" }, function(err, response) {
                if(!err && response) {
                    res.json({ status: true, data: response });
                }
                else { res.json({ status: false, error: err, message: "invalid category" }); }
            });
        }
    }
    else { res.json({ status: false, message: "Invalid version" }); }
}

// product list
exports.list = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
        if(!err && response) {
            let queryParams = { store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active' };
            if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
            if(req.body.category_id=='all')
            {
                product.find(queryParams, function(err, response) {
                    if(!err && response) { res.json({ status: true, category_details: {}, list: response }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else
            {
                if(mongoose.Types.ObjectId.isValid(req.body.category_id))
                {
                    getCategoryById(req.query.store_id, req.body.category_id).then((categoryDetails) => {
                        if(categoryDetails) {
                            queryParams.category_id = { "$in": categoryDetails.categoryid_list };
                            product.find(queryParams, function(err, response) {
                                if(!err && response) {
                                    res.json({ status: true, category_details: categoryDetails, breadcrumb_list: categoryDetails.breadcrumb_list, list: response });
                                }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        }
                        else {
                            getCategoryByName(req.query.store_id, req.body.category_id).then((categoryDetails) => {
                                if(categoryDetails) {
                                    queryParams.category_id = { "$in": categoryDetails.categoryid_list };
                                    product.find(queryParams, function(err, response) {
                                        if(!err && response) {
                                            res.json({ status: true, category_details: categoryDetails, breadcrumb_list: categoryDetails.breadcrumb_list, list: response });
                                        }
                                        else { res.json({ status: false, error: err, message: "Failure" }); }
                                    });
                                }
                                else {
                                    res.json({ status: false, message: "invalid category" });
                                }
                            });
                        }
                    });
                }
                else
                {
                    getCategoryByName(req.query.store_id, req.body.category_id).then((categoryDetails) => {
                        if(categoryDetails) {
                            queryParams.category_id = { "$in": categoryDetails.categoryid_list };
                            product.find(queryParams, function(err, response) {
                                if(!err && response) {
                                    res.json({ status: true, category_details: categoryDetails, breadcrumb_list: categoryDetails.breadcrumb_list, list: response });
                                }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        }
                        else {
                            res.json({ status: false, message: "invalid category" });
                        }
                    });
                }
            }
        }
        else { res.json({ status: false, message: "invalid store" }); }
    });
}

exports.list_v2 = (req, res) => {
    if(req.params.version=='v2') {
        store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
            if(!err && response) {
                let queryParams = { store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active' };
                if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
                if(req.body.category_id=='all')
                {
                    product.find(queryParams, function(err, response) {
                        if(!err && response) { res.json({ status: true, category_details: {}, list: response }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
                else
                {
                    if(mongoose.Types.ObjectId.isValid(req.body.category_id))
                    {
                        sections.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), _id: mongoose.Types.ObjectId(req.body.category_id), status: "active" }, function(err, response) {
                            if(!err && response) {
                                let categoryDetails = response;
                                let catId = categoryDetails._id.toString();
                                queryParams.category_id = { "$in": [catId] };
                                product.find(queryParams, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, category_details: categoryDetails, list: response });
                                    }
                                    else { res.json({ status: false, error: err, message: "Failure" }); }
                                });
                            }
                            else {
                                sections.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), "seo_details.page_url": req.body.category_id, status: "active" }, function(err, response) {
                                    if(!err && response) {
                                        let categoryDetails = response;
                                        let catId = categoryDetails._id.toString();
                                        queryParams.category_id = { "$in": [catId] };
                                        product.find(queryParams, function(err, response) {
                                            if(!err && response) {
                                                res.json({ status: true, category_details: categoryDetails, list: response });
                                            }
                                            else { res.json({ status: false, error: err, message: "Failure" }); }
                                        });
                                    }
                                    else { res.json({ status: false, error: err, message: "invalid category" }); }
                                });
                            }
                        });
                    }
                    else
                    {
                        sections.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), "seo_details.page_url": req.body.category_id, status: "active" }, function(err, response) {
                            if(!err && response) {
                                let categoryDetails = response;
                                let catId = categoryDetails._id.toString();
                                queryParams.category_id = { "$in": [catId] };
                                product.find(queryParams, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, category_details: categoryDetails, list: response });
                                    }
                                    else { res.json({ status: false, error: err, message: "Failure" }); }
                                });
                            }
                            else { res.json({ status: false, error: err, message: "invalid category" }); }
                        });
                    }
                }
            }
            else { res.json({ status: false, message: "invalid store" }); }
        });
    }
    else { res.json({ status: false, message: "Invalid version" }); }
}

// random product list
exports.random_list = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
        if(!err && response) {
            let queryParams = { store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active' };
            if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
            queryParams.category_id = { "$in": [req.body.category_id] };
            product.aggregate([
                { $match: queryParams }, { $sample: { size: req.body.limit } }
            ], function(err, response) {
                if(!err && response) {
                    res.json({ status: true, list: response });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else { res.json({ status: false, message: "invalid store" }); }
    });
}

// AI Styling filter
exports.ai_styles_filter = (req, res) => {
    if(req.body.styles.length) {
        store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
            if(!err && response) {
                let queryParams = { store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active' };
                if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
                queryParams.aistyle_list = { $all: req.body.styles };
                product.find(queryParams, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else { res.json({ status: false, message: "invalid store" }); }
        });
    }
    else { res.json({ status: true, list: [] }); }
}

exports.ai_styles_filter_v2 = (req, res) => {
    if(Object.entries(req.body.styles).length) {
        store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
            if(!err && response) {
                let queryParams = { store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active' };
                if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
                for(let key in req.body.styles) {
                    if(req.body.styles.hasOwnProperty(key)) queryParams['aistyle_list.'+key] = { $in: req.body.styles[key] };
                }
                product.find(queryParams, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else { res.json({ status: false, message: "invalid store" }); }
        });
    }
    else { res.json({ status: true, list: [] }); }
}

exports.filter_products = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
        if(!err && response) {
            let queryParams = { store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active' };
            if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
            if(req.body.type=="discount") {
                queryParams.disc_status = true;
                product.find(queryParams, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response.sort((a, b) => 0 - (a.rank > b.rank ? 1 : -1)) });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else if(req.body.type=="featured") {
                queryParams.featured = true;
                product.find(queryParams, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response.sort((a, b) => 0 - (a.rank > b.rank ? 1 : -1)) });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else if(req.body.type=="new_arrivals") {
                product.aggregate([
                    { $match: queryParams },
                    { $sort : { created_on : -1 } },
                    { $limit : 50 }
                ], function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else if(req.body.type=="all") {
                product.find(queryParams, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, list: response.sort((a, b) => 0 - (a.rank > b.rank ? 1 : -1)) });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else { res.json({ status: true, list: [] }); }
        }
        else { res.json({ status: false, message: "invalid store" }); }
    });
}

// product details
exports.details = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.body.product_id))
    {
        product.findOne({
            store_id: mongoose.Types.ObjectId(req.query.store_id), _id: mongoose.Types.ObjectId(req.body.product_id), status: 'active'
        }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, data: response });
            }
            else {
                product.findOne({
                    store_id: mongoose.Types.ObjectId(req.query.store_id), "seo_details.page_url": req.body.product_id, status: 'active'
                }, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, data: response });
                    }
                    else {
                        res.json({ status: false, error: err, message: "failure" });
                    }
                });
            }
        });
    }
    else {
        product.findOne({
            store_id: mongoose.Types.ObjectId(req.query.store_id), "seo_details.page_url": req.body.product_id, status: 'active'
        }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, data: response });
            }
            else {
                res.json({ status: false, error: err, message: "failure" });
            }
        });
    }
}

// order details
exports.order_details = (req, res) => {
    orderList.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

// quotation details
exports.quotation_details = (req, res) => {
    quotList.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "Invalid quotation" }); }
    });
}

// serch product
exports.search = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, { additional_features: 1 }, function(err, response) {
        if(!err && response) {
            let searchKeyword = '\"'+req.body.name+'\"';
            let queryParams = {
                store_id: mongoose.Types.ObjectId(req.query.store_id), archive_status: false, status: 'active',
                $text: { $search: searchKeyword }
            };
            if(!response.additional_features.disp_all_products) { queryParams.stock = { $gt: 0 }; }
            if(req.body.category_id!='') { queryParams.category_id = { "$in": [ req.body.category_id.toString() ] }; }
            product.find(queryParams, function(err, response) {
                if(!err && response) { res.json({ status: true, list: response }); }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else { res.json({ status: false, message: "invalid store" }); }
    });
}

// addon details
exports.addon_details = (req, res) => {
    productFeatures.aggregate([
        { $match: { store_id: mongoose.Types.ObjectId(req.query.store_id), "addon_list._id": mongoose.Types.ObjectId(req.query.addon_id) } },
        { $project:
            {
                addon_list: {
                    $filter: {
                        input: "$addon_list", 
                        as: "addonList", 
                        cond: { $eq: [ "$$addonList._id", mongoose.Types.ObjectId(req.query.addon_id) ] }
                    } 
                }
            } 
        }
    ], function(err, response) {
        if(!err && response[0]) { res.json({ status: true, data: response[0].addon_list }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

// measurement list
exports.measurement = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.measurement_set }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

// product review
exports.add_review = (req, res) => {
    orderList.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), _id: mongoose.Types.ObjectId(req.body.order_id) }, function(err, response) {
        if(!err && response) {
            let orderDetails = response;
            if(orderDetails.customer_name) { req.body.customer_name = orderDetails.customer_name; }
            else { req.body.customer_name = orderDetails.shipping_address.name; }
            orderList.updateOne({ _id: mongoose.Types.ObjectId(req.body.order_id) },
            { "$set": { ['item_list.'+req.body.item_index+'.review_details'] : req.body }}, function(err, response) {
                if(!err) {
                    productReview.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), product_id: mongoose.Types.ObjectId(req.body.product_id) }, function(err, response) {
                        if(!err && response) {
                            let reviewIndex = response.reviews.findIndex(obj => obj.order_id.toString()==req.body.order_id && obj.item_index==req.body.item_index);
                            if(reviewIndex!=-1) {
                                // update review
                                let reviewId = response.reviews[reviewIndex]._id;
                                req.body.status = 'inactive';
                                productReview.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id), "reviews._id": mongoose.Types.ObjectId(reviewId) },
                                { $set: { "reviews.$": req.body } }, function(err, response) {
                                    if(!err && response) { res.json({ status: true }); }
                                    else { res.json({ status: false, error: err, message: "Failure" }); }
                                });
                            }
                            else  {
                                // add review
                                productReview.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                                { $push: { reviews: req.body } }, function(err, response) {
                                    if(!err && response) { res.json({ status: true }); }
                                    else { res.json({ status: false, error: err, message: "Unable to add review" }); }
                                });
                            } 
                        }
                        else {
                            // add product with review
                            productReview.create({ store_id: req.body.store_id, product_id: req.body.product_id, reviews: [req.body] }, function(err, response) {
                                if(!err && response) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Unable to add" }); }
                            });
                        }
                    });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.reviews = (req, res) => {
    productReview.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id), product_id: mongoose.Types.ObjectId(req.query.product_id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.reviews.filter(obj => obj.status=='active') });  }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

// FUNCTIONS
function getCategoryById(storeId, categoryId) {
    return new Promise((resolve, reject) => {
        // SECTION
        sections.findOne({
            store_id: mongoose.Types.ObjectId(storeId), _id: mongoose.Types.ObjectId(categoryId), status: "active"
        }, function(err, response) {
            if(!err && response) {
                let categoryIds = [];
                let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }];
                if(response.categories.length) {
                    response.categories.forEach((category) => {
                        if(category.sub_categories.length) {
                            category.sub_categories.forEach((subCategory) => {
                                if(subCategory.child_sub_categories.length) {
                                    subCategory.child_sub_categories.forEach((childSubCategory) => {
                                        categoryIds.push(childSubCategory._id.toString());
                                    });
                                }
                                else { categoryIds.push(subCategory._id.toString()); }
                            });
                        }
                        else { categoryIds.push(category._id.toString()); }
                    });
                }
                else { categoryIds.push(response._id.toString()); }
                response.categoryid_list = categoryIds;
                response.breadcrumb_list = breadcrumbList;
                resolve(response);
            } else {
                // CATEGORY
                sections.findOne({
                    store_id: mongoose.Types.ObjectId(storeId), "categories._id": mongoose.Types.ObjectId(categoryId)
                }, function(err, response) {
                    if(!err && response) {
                        let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }, {}];
                        response['categories'].forEach((category) => {
                            if(category._id.toString()==categoryId) {
                                breadcrumbList[1] = { _id: category._id, name: category.name, seo_status: category.seo_status, seo_details: category.seo_details };
                                let categoryIds = [];
                                if(category.sub_categories.length) {
                                    category.sub_categories.forEach((subCategory) => {
                                        if(subCategory.child_sub_categories.length) {
                                            subCategory.child_sub_categories.forEach((childSubCategory) => {
                                                categoryIds.push(childSubCategory._id.toString());
                                            });
                                        }
                                        else { categoryIds.push(subCategory._id.toString()); }
                                    });
                                }
                                else { categoryIds.push(category._id.toString()); }
                                category.categoryid_list = categoryIds;
                                category.breadcrumb_list = breadcrumbList;
                                resolve(category);
                            }
                        });
                    } else {
                        // SUB-CATEGORY
                        sections.findOne({
                            store_id: mongoose.Types.ObjectId(storeId), "categories.sub_categories._id": categoryId
                        }, function(err, response) {
                            if(!err && response) {
                                let loopEnd = false;
                                let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }, {}, {}];
                                response['categories'].forEach((category) => {
                                    if(!loopEnd) {
                                        breadcrumbList[1] = { _id: category._id, name: category.name, seo_status: category.seo_status, seo_details: category.seo_details };
                                    }
                                    category.sub_categories.forEach((subCategory) => {
                                        if(subCategory._id.toString()==categoryId) {
                                            breadcrumbList[2] = { _id: subCategory._id, name: subCategory.name, seo_status: subCategory.seo_status, seo_details: subCategory.seo_details };
                                            let categoryIds = [];
                                            if(subCategory.child_sub_categories.length) {
                                                subCategory.child_sub_categories.forEach((childSubCategory) => {
                                                    categoryIds.push(childSubCategory._id.toString());
                                                });
                                            }
                                            else { categoryIds.push(subCategory._id.toString()); }
                                            subCategory.categoryid_list = categoryIds;
                                            subCategory.breadcrumb_list = breadcrumbList;
                                            loopEnd = true;
                                            resolve(subCategory);
                                        }
                                    });
                                });
                            } else {
                                // CHILD-SUB-CATEGORY
                                sections.findOne({
                                    store_id: mongoose.Types.ObjectId(storeId), "categories.sub_categories.child_sub_categories._id": categoryId
                                }, function(err, response) {
                                    if(!err && response) {
                                        let loopEnd = false;
                                        let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }, {}, {}, {}];
                                        response['categories'].forEach((category) => {
                                            if(!loopEnd) {
                                                breadcrumbList[1] = { _id: category._id, name: category.name, seo_status: category.seo_status, seo_details: category.seo_details };
                                            }
                                            category.sub_categories.forEach((subCategory) => {
                                                if(!loopEnd) {
                                                    breadcrumbList[2] = { _id: subCategory._id, name: subCategory.name, seo_status: subCategory.seo_status, seo_details: subCategory.seo_details };
                                                }
                                                subCategory.child_sub_categories.forEach((childSubCategory) => {
                                                    if(childSubCategory._id.toString()==categoryId) {
                                                        breadcrumbList[3] = { _id: childSubCategory._id, name: childSubCategory.name, seo_status: childSubCategory.seo_status, seo_details: childSubCategory.seo_details };
                                                        childSubCategory.categoryid_list = [childSubCategory._id.toString()];
                                                        childSubCategory.breadcrumb_list = breadcrumbList;
                                                        loopEnd = true;
                                                        resolve(childSubCategory);
                                                    }
                                                });
                                            });
                                        });
                                    } else {
                                        resolve(null);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}

function getCategoryByName(storeId, categoryName) {
    return new Promise((resolve, reject) => {
        // SECTION
        sections.findOne({
            store_id: mongoose.Types.ObjectId(storeId), "seo_details.page_url": categoryName, status: "active"
        }, function(err, response) {
            if(!err && response) {
                let categoryIds = [];
                let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }];
                if(response.categories.length) {
                    response.categories.forEach((category) => {
                        if(category.sub_categories.length) {
                            category.sub_categories.forEach((subCategory) => {
                                if(subCategory.child_sub_categories.length) {
                                    subCategory.child_sub_categories.forEach((childSubCategory) => {
                                        categoryIds.push(childSubCategory._id.toString());
                                    });
                                }
                                else { categoryIds.push(subCategory._id.toString()); }
                            });
                        }
                        else { categoryIds.push(category._id.toString()); }
                    });
                }
                else { categoryIds.push(response._id.toString()); }
                response.categoryid_list = categoryIds;
                response.breadcrumb_list = breadcrumbList;
                resolve(response);
            } else {
                // CATEGORY
                sections.findOne({ store_id: mongoose.Types.ObjectId(storeId), "categories.seo_details.page_url": categoryName
                }, function(err, response) {
                    if(!err && response) {
                        let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }, {}];
                        response['categories'].forEach((category) => {
                            if(category.seo_details.page_url==categoryName) {
                                breadcrumbList[1] = { _id: category._id, name: category.name, seo_status: category.seo_status, seo_details: category.seo_details };
                                let categoryIds = [];
                                if(category.sub_categories.length) {
                                    category.sub_categories.forEach((subCategory) => {
                                        if(subCategory.child_sub_categories.length) {
                                            subCategory.child_sub_categories.forEach((childSubCategory) => {
                                                categoryIds.push(childSubCategory._id.toString());
                                            });
                                        }
                                        else { categoryIds.push(subCategory._id.toString()); }
                                    });
                                }
                                else { categoryIds.push(category._id.toString()); }
                                category.categoryid_list = categoryIds;
                                category.breadcrumb_list = breadcrumbList;
                                resolve(category);
                            }
                        });
                    } else {
                        // SUB-CATEGORY
                        sections.findOne({
                            store_id: mongoose.Types.ObjectId(storeId), "categories.sub_categories.seo_details.page_url": categoryName
                        }, function(err, response) {
                            if(!err && response) {
                                let loopEnd = false;
                                let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }, {}, {}];
                                response['categories'].forEach((category) => {
                                    if(!loopEnd) {
                                        breadcrumbList[1] = { _id: category._id, name: category.name, seo_status: category.seo_status, seo_details: category.seo_details };
                                    }
                                    category.sub_categories.forEach((subCategory) => {
                                        if(subCategory.seo_details.page_url==categoryName) {
                                            breadcrumbList[2] = { _id: subCategory._id, name: subCategory.name, seo_status: subCategory.seo_status, seo_details: subCategory.seo_details };
                                            let categoryIds = [];
                                            if(subCategory.child_sub_categories.length) {
                                                subCategory.child_sub_categories.forEach((childSubCategory) => {
                                                    categoryIds.push(childSubCategory._id.toString());
                                                });
                                            }
                                            else { categoryIds.push(subCategory._id.toString()); }
                                            subCategory.categoryid_list = categoryIds;
                                            subCategory.breadcrumb_list = breadcrumbList;
                                            loopEnd = true;
                                            resolve(subCategory);
                                        }
                                    });
                                });
                            } else {
                                // CHILD-SUB-CATEGORY
                                sections.findOne({
                                    store_id: mongoose.Types.ObjectId(storeId), "categories.sub_categories.child_sub_categories.seo_details.page_url": categoryName
                                }, function(err, response) {
                                    if(!err && response) {
                                        let loopEnd = false;
                                        let breadcrumbList = [{ _id: response._id, name: response.name, seo_status: response.seo_status, seo_details: response.seo_details }, {}, {}, {}];
                                        response['categories'].forEach((category) => {
                                            if(!loopEnd) {
                                                breadcrumbList[1] = { _id: category._id, name: category.name, seo_status: category.seo_status, seo_details: category.seo_details };
                                            }
                                            category.sub_categories.forEach((subCategory) => {
                                                if(!loopEnd) {
                                                    breadcrumbList[2] = { _id: subCategory._id, name: subCategory.name, seo_status: subCategory.seo_status, seo_details: subCategory.seo_details };
                                                }
                                                subCategory.child_sub_categories.forEach((childSubCategory) => {
                                                    if(childSubCategory.seo_details.page_url==categoryName) {
                                                        breadcrumbList[3] = { _id: childSubCategory._id, name: childSubCategory.name, seo_status: childSubCategory.seo_status, seo_details: childSubCategory.seo_details };
                                                        childSubCategory.categoryid_list = [childSubCategory._id.toString()];
                                                        childSubCategory.breadcrumb_list = breadcrumbList;
                                                        loopEnd = true;
                                                        resolve(childSubCategory);
                                                    }
                                                });
                                            });
                                        });
                                    } else {
                                        resolve(null);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}