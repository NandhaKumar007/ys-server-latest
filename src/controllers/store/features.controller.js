"use strict";
const mongoose = require('mongoose');
const vendorFeatures = require("../../models/vendor_features.model");
const storeProperties = require('../../models/store_properties.model');
const productFeatures = require("../../models/product_features.model");
const storeFeatures = require("../../models/store_features.model");
const store = require("../../models/store.model");
const admin = require("../../models/admin.model");
const ysOrders = require("../../models/ys_orders.model");
const ysPackages = require("../../models/ys_packages.model");
const ysFeatures = require("../../models/ys_features.model");
const deployDetails = require("../../models/deploy_details.model");
const commonService = require("../../../services/common.service");
const createPayment = require("../../../services/create_payment.service");
const setupConfig = require('../../../config/setup.config');

exports.product_features = (req, res) => {
    productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let pfDetails = response;
            let sendData = {
                _id: pfDetails._id, store_id: pfDetails.store_id,
                addon_list: pfDetails.addon_list.filter(obj => obj.status=='active'),
                measurement_set: pfDetails.measurement_set.filter(obj => obj.status=='active'),
                tag_list: pfDetails.tag_list.filter(obj => obj.status=='active'),
                footnote_list: pfDetails.footnote_list,
                faq_list: pfDetails.faq_list.filter(obj => obj.status=='active'),
                tax_rates: pfDetails.tax_rates.filter(obj => obj.status=='active'),
                size_chart: pfDetails.size_chart.filter(obj => obj.status=='active'),
                sizing_assistant: pfDetails.sizing_assistant.filter(obj => obj.status=='active'),
                taxonomy: pfDetails.taxonomy.filter(obj => obj.status=='active'),
                color_list: pfDetails.color_list,
                amenities: pfDetails.amenities.filter(obj => obj.status=='active'),
                img_tag_list: []
            };
            storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id), 'img_tag_list.0': { $exists: true } },
            { img_tag_list: 1 }, function(err, response) {
                if(!err && response) {
                    sendData.img_tag_list = response.img_tag_list.filter(obj => obj.status=='active');
                }
                res.json({ status: true, data: sendData });
            });
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.store_features = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.vendor_features = (req, res) => {
    vendorFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
        if(!err && response) {
            let vfDetails = response;
            let sendData = {
                _id: vfDetails._id, store_id: vfDetails.store_id,
                addon_list: vfDetails.addon_list.filter(obj => obj.status=='active'),
                measurement_set: vfDetails.measurement_set.filter(obj => obj.status=='active'),
                footnote_list: vfDetails.footnote_list,
                faq_list: vfDetails.faq_list.filter(obj => obj.status=='active'),
                size_chart: vfDetails.size_chart.filter(obj => obj.status=='active')
            };
            res.json({ status: true, data: sendData });
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

// YS Features
exports.ys_features = (req, res) => {
    ysPackages.find({ status: 'active' }, function(err, response) {
        if(!err && response)
        {
            let packageList = response;
            deployDetails.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
                if(!err && response) {
                    let storeDeployDetails = response;
                    if(req.query.id && mongoose.Types.ObjectId.isValid(req.query.id)) {
                        ysFeatures.findOne({ _id: mongoose.Types.ObjectId(req.query.id), status: 'active' }, function(err, response) {
                            if(!err && response) { res.json({ status: true, data: response, packages: packageList, deploy_details: storeDeployDetails }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                    else {
                        ysFeatures.find({ status: 'active' }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response, packages: packageList, deploy_details: storeDeployDetails }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                }
                else { res.json({ status: false, error: err, message: "Unable to get deploy details" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Unable to get packages" }); }
    });
}

exports.install_ys_feature = (req, res) => {
    ysFeatures.findOne({ _id: mongoose.Types.ObjectId(req.body.feature_id), status: 'active' }, function(err, response) {
        if(!err && response) {
            req.body.name = response.keyword;
            deployDetails.findOne({ store_id: mongoose.Types.ObjectId(req.id), "trial_features.name": req.body.name }, function(err, response) {
                if(!err && response) {
                    deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "trial_features.name": req.body.name },
                    { $set: { "trial_features.$.status": "active", "trial_features.$.uninstalled": false } }, { new: true },
                    function(err, response) {
                        if(!err && response) {
                            let deployDetails = response;
                            store.findOne({ _id: mongoose.Types.ObjectId(req.id), "package_details.paid_features": { $in: [req.body.name] } }, function(err, response) {
                                if(!err && response) { res.json({ status: true, data: deployDetails }); }
                                else { res.json({ status: true, data: deployDetails, make_payment: true }); }
                            });
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else {
                    deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $push: { trial_features: req.body } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, data: response }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                }
            });
        }
        else { res.json({ status: false, message: "Invalid feature" }); }
    });
}

exports.uninstall_ys_feature = (req, res) => {
    ysFeatures.findOne({ _id: mongoose.Types.ObjectId(req.body.feature_id), status: 'active' }, function(err, response) {
        if(!err && response) {
            req.body.name = response.keyword;
            deployDetails.findOne({ store_id: mongoose.Types.ObjectId(req.id), "trial_features.name": req.body.name, "trial_features.status": "active" }, function(err, response) {
                if(!err && response) {
                    deployDetails.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id), "trial_features.name": req.body.name },
                    { $set: { "trial_features.$.status": "inactive", "trial_features.$.uninstalled": true } }, { new: true },
                    function(err, response) {
                        if(!err) { res.json({ status: true, data: response }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, message: "Invalid feature" }); }
            });
        }
        else { res.json({ status: false, message: "Invalid feature" }); }
    });
}

exports.create_payment = (req, res) => {
    store.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.id) } },
        {
            $lookup: {
                from: "deploy_details",
                localField: "_id",
                foreignField: "store_id",
                as: "deployDetails"
            }
        }
    ], function(err, response) {
        if(!err && response[0]) {
            let storeData = response[0];
            let storeCurrency = storeData.currency_types.filter(obj => obj.default_currency)[0];
            let feaList = [];
            storeData.deployDetails[0].trial_features.filter(obj => obj.status=='active' && !obj.paid && !obj.uninstalled).forEach(obj => { feaList.push(obj.name) });
            ysFeatures.find({ keyword: { $in: feaList }, status: "active" }, function(err, response) {
                if(!err && response) {
                    let featuresList = JSON.stringify(response);
                    featuresList = JSON.parse(featuresList);
                    let total = 0; feaList = [];
                    let diffDays = commonService.dateDiff(new Date(), storeData.package_details.expiry_date);
                    featuresList.forEach(element => {
                        let packIndex = element.linked_packages.findIndex(obj => obj.package_id.toString()==storeData.package_details.package_id.toString());
                        if(packIndex!=-1) {
                            element.price = element.linked_packages[packIndex].currency_types[storeCurrency.country_code].price;
                            if(diffDays<30) { element.price = parseFloat(((element.price/30)*diffDays).toFixed(2)); }
                            total += element.price;
                            feaList.push({ name: element.name, keyword: element.keyword, price: element.price });
                        }
                    });
                    let subData = {
                        store_id: storeData._id, order_type: "purchase_app", amount: total, currency_type: storeCurrency, status: 'inactive',
                        app_list: feaList, subscription_till: storeData.package_details.expiry_date, payment_details: req.body.payment_details
                    };
                    // tax calc
                    if(setupConfig.company_details.country==storeData.country && setupConfig.company_details.state==storeData.company_details.state) {
                        subData.sgst = { percentage: setupConfig.company_details.sgst, amount: 0 };
                        subData.cgst = { percentage: setupConfig.company_details.cgst, amount: 0 };
                        subData.sgst.amount = parseFloat((((setupConfig.company_details.sgst)/100)*total).toFixed(2));
                        subData.cgst.amount = parseFloat((((setupConfig.company_details.cgst)/100)*total).toFixed(2));
                        subData.amount += subData.sgst.amount;
                        subData.amount += subData.cgst.amount;
                    }
                    else {
                        subData.igst = { percentage: setupConfig.company_details.igst, amount: 0 };
                        subData.igst.amount = parseFloat((((setupConfig.company_details.igst)/100)*total).toFixed(2));
                        subData.amount += subData.igst.amount;
                    }
                    subData.amount = parseFloat(subData.amount.toFixed(2));
                    admin.findOne({}, function(err, response) {
                        let paymentTypes = [];
                        response.payment_types.filter(obj => obj.status == 'active').forEach(element => {
                            paymentTypes.push({ name: element.name, btn_name: element.btn_name, mode: element.mode, app_config: element.app_config });
                        });
                        if(req.body.payment_details && req.body.payment_details.name) {
                            // create payment
                            if(req.body.payment_details.name=="Razorpay")
                            {
                                // create payment
                                subData.order_number = commonService.orderNumber();
                                ysOrders.create(subData, function(err, response) {
                                    if(!err && response) {
                                        if(response.payment_details.name=="Razorpay")
                                        {
                                            createPayment.createRazorpayForYsOrder(response, function(err, response) {
                                                if(!err && response) { res.json({ status: true, data: response }); }
                                                else { res.json({ status: false, error: err, message: response }); }
                                            });
                                        }
                                        else { res.json({ status: false, message: "Invalid payment method" }); }
                                    }
                                    else { res.json({ status: false, error: err, message: "Unable to create order" }); }
                                });
                            }
                            else { res.json({ status: false, message: "Invalid payment method" }); }
                        }
                        else {
                            res.json({ status: true, list: featuresList, data: subData, payment_types: paymentTypes });
                        }
                    });
                }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}