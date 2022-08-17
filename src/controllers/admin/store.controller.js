"use strict";
const fs = require("fs");
const request = require('request');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);

const store = require("../../models/store.model");
const admin = require("../../models/admin.model");
const product = require("../../models/product.model");
const orderList = require("../../models/order_list.model");
const storeProperties = require("../../models/store_properties.model");
const ysPackages = require("../../models/ys_packages.model");
const ysOrders = require("../../models/ys_orders.model");

const jwtConfig = require('../../../config/jwtsecret');
const setupConfig = require('../../../config/setup.config');
const storeService = require("../../../services/store.service");
const notifyService = require("../../../services/notify.service");

exports.list = (req, res) => {
    if(req.query.type) {
        let pendingList = ["logo", "products", "shipping", "payments"];
        if(pendingList.indexOf(req.query.type) != -1) {
            let fieldName = "$$depList.deploy_stages."+req.query.type;
            store.aggregate([
                { $match:
                    { status: "active", "package_details.trial_expiry": { $exists: true } }
                },
                { $lookup:
                    { from: 'deploy_details', localField: '_id', foreignField: 'store_id', as: 'deployDetails' }
                },
                {
                    $project: {
                        name: 1, email: 1, company_details: 1, country: 1, base_url: 1, package_details: 1, app_token: 1,
                        deployDetails: {
                            $filter: {
                                input: "$deployDetails",
                                as: "depList",
                                cond: { $eq: [ fieldName, false ] }
                            }
                        }
                    }
                }
            ], function(err, response) {
                if(!err && response) {
                    res.json({ status: true, list: response.filter(obj => obj.deployDetails.length) });
                }
                else { res.json({ status: false, error: err, message: "Stores doesn't exists" }); }
            });
        }
        else {
            let queryParams = { status: "active", "package_details.trial_expiry": { $exists: true } };
            if(req.query.type=='all') { delete queryParams.status; }
            if(req.query.type=='trial_expired' || req.query.type=='subscription_expired' || req.query.type=='inactive') {
                queryParams.status = "inactive";
            }
            if(req.query.type=='trial' || req.query.type=='trial_expired' || req.query.type=='trial_expires_in') {
                queryParams["package_details.billing_status"] = false;
            }
            if(req.query.type=='subscribed' || req.query.type=='subscription_expired' || req.query.type=='free_plan' || req.query.type=='paid_plan' || req.query.type.indexOf('pid_')!=-1) {
                queryParams["package_details.billing_status"] = true;
            }
            if(req.query.type=='free_plan') {
                queryParams["package_details.package_id"] = mongoose.Types.ObjectId(setupConfig.free_plan);
            }
            if(req.query.type=='paid_plan') {
                queryParams["package_details.package_id"] = { $ne: mongoose.Types.ObjectId(setupConfig.free_plan) };
            }
            if(req.query.type=='trial_expires_in' || req.query.type=='unused') {
                let dateFilter = { $gte: new Date(req.query.from*1), $lte: new Date(req.query.to*1) };
                if(req.query.day_type=='lt') { dateFilter = { $lt: new Date(req.query.from*1) }; }
                if(req.query.day_type=='lte') { dateFilter = { $lte: new Date(req.query.to*1) }; }
                if(req.query.type=='trial_expires_in') { queryParams["package_details.trial_expiry"] = dateFilter; }
                if(req.query.type=='unused') { queryParams.last_login = dateFilter; }
            }
            else if(req.query.type.indexOf('pid_')!=-1) {
                let packageId = req.query.type.replace("pid_", "");
                queryParams["package_details.package_id"] = mongoose.Types.ObjectId(packageId);
            }
            store.find(queryParams, { payment_types: 0, mail_config: 0 }, function(err, response) {
                if(!err && response) { res.json({ status: true, list: response }); }
                else { res.json({ status: false, error: err, message: "Invalid user" }); }
            });
        }
    }
    else { res.json({ status: true, list: response }); }
}

exports.dashboard = (req, res) => {
    ysPackages.find({ category: req.body.category, status: "active" }, function(err, response) {
        if(!err && response) {
            let fromDate = req.body.from_date;
            let toDate = req.body.to_date;
            let packageList = [];
            response.forEach(obj => { packageList.push(obj._id); });
            // signup list
            store.aggregate([
                { $match:
                    { "package_details.package_id": { $in: packageList }, created_on: { $gte: new Date(fromDate), $lte: new Date(toDate) } }
                },
                { $lookup:
                    { from: 'deploy_details', localField: '_id', foreignField: 'store_id', as: 'deployDetails' }
                },
                { $unwind:
                    { path: "$deployDetails", preserveNullAndEmptyArrays: true }
                },
                { $project:
                    { name: 1, email: 1, temp_category: 1, created_on: 1, "deployDetails.category": 1  }
                }
            ], function(err, signupList) {
                if(!err && signupList) {
                    let activatedIds = [];
                    let respData = { status: true, signup_list: signupList, activated_list: [], revenue_list: [], order_list: [], products: 0 };
                    // activated stores
                    store.find({
                        "package_details.package_id": { $in: packageList }, activated_on: { $gte: new Date(fromDate), $lte: new Date(toDate) }
                    }, { name: 1, package_details: 1, currency_types: 1, created_on: 1 }, function(err, activatedList) {
                        if(!err && activatedList) {
                            respData.activated_list = activatedList;
                            respData.activated_list.forEach(obj => { activatedIds.push(obj._id); });
                        }
                        // revenue
                        ysOrders.find({ store_id: { $in: activatedIds }, status: "active", payment_success: true, order_type: "purchase_plan" }, { amount: 1, currency_type: 1 }, function(err, response) {
                            if(!err && response) { respData.revenue_list = response; }
                            // products
                            product.countDocuments({ store_id: { $in: activatedIds }, status: "active", created_on: { $gte: new Date(fromDate), $lte: new Date(toDate) } }, function(err, productsCount) {
                                if(!err && productsCount) { respData.products = productsCount; }
                                // orders
                                orderList.find({
                                    store_id: { $in: activatedIds }, status: "active",
                                    created_on: { $gte: new Date(fromDate), $lte: new Date(toDate) }
                                }, { store_id: 1, final_price: 1, currency_type: 1 }, function(err, ordersData) {
                                    if(!err && ordersData) { respData.order_list = ordersData }
                                    res.json(respData);
                                });
                            });
                        });
                    });
                }
                else { res.json({ status: false, error: err, message: "Stores doesn't exists" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid category" }); }
    });
}

exports.details = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.update = (req, res) => {
    if(req.body.package_details) {
        if(req.body.package_details.billing_status) {
            req.body.package_details.expiry_date = new Date(new Date(req.body.package_details.expiry_date).setHours(23,59,59,999));
            if(req.body.package_details.transaction_range) {
                req.body.package_details.transaction_range.from = new Date(new Date(req.body.package_details.transaction_range.from).setHours(0,0,0,0));
                req.body.package_details.transaction_range.to = new Date(new Date(req.body.package_details.transaction_range.to).setHours(23,59,59,999));
            }
        }
        if(req.body.package_details.trial_expiry) {
            req.body.package_details.trial_expiry = new Date(new Date(req.body.package_details.trial_expiry).setHours(23,59,59,999));
        }
    }
    store.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.hard_remove = (req, res) => {
    if(req.body.key==setupConfig.admin_secret) {
        storeService.deleteStorePermanently(req.body._id).then((respData) => {
            if(respData) {
                let srp = 'uploads/'+req.body._id;
                if(fs.existsSync(srp)) { fs.rmdirSync(srp, { recursive: true }); }
                res.json({ status: true });
            }
            else { res.json({ status: false, message: "Invalid store" }); }
        });
    }
    else { res.json({ status: false, message: "Invalid user" }); }
}

exports.send_notification = (req, res) => {
    if(req.body.store_id) {
        store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), app_token: { $exists: true } }, { app_token: 1 }, function(err, response) {
            if(!err && response) {
                notifyService.app([response.app_token], req.body).then((respData) => {
                    res.json(respData);
                }).catch((errData) => { res.json(errData); });
            }
            else { res.json({ status: false, error: err, message: "Invalid user" }); }
        });
    }
    else if(req.body.type) {
        let pendingList = ["logo", "products", "shipping", "payments"];
        if(pendingList.indexOf(req.body.type) != -1) {
            let fieldName = "$$depList.deploy_stages."+req.body.type;
            store.aggregate([
                { $match:
                    { status: "active", app_token: { $exists: true }, "package_details.trial_expiry": { $exists: true } }
                },
                { $lookup:
                    { from: 'deploy_details', localField: '_id', foreignField: 'store_id', as: 'deployDetails' }
                },
                {
                    $project: {
                        app_token: 1,
                        deployDetails: {
                            $filter: {
                                input: "$deployDetails",
                                as: "depList",
                                cond: { $eq: [ fieldName, false ] }
                            }
                        }
                    }
                }
            ], function(err, response) {
                if(!err && response) {
                    let regIds = [];
                    response.filter(obj => obj.deployDetails.length).forEach(obj => { regIds.push(obj.app_token); });
                    notifyService.app(regIds, req.body).then((respData) => {
                        res.json(respData);
                    }).catch((errData) => { res.json(errData); });
                }
                else { res.json({ status: false, error: err, message: "Stores doesn't exists" }); }
            });
        }
        else {
            let queryParams = { status: "active", app_token: { $exists: true }, "package_details.trial_expiry": { $exists: true } };
            if(req.body.type=='all') { delete queryParams.status; }
            if(req.body.type=='trial_expired' || req.body.type=='subscription_expired' || req.query.type=='inactive') {
                queryParams.status = "inactive";
            }
            if(req.body.type=='trial' || req.body.type=='trial_expired' || req.body.type=='trial_expires_in') {
                queryParams["package_details.billing_status"] = false;
            }
            if(req.body.type=='subscribed' || req.query.type=='subscription_expired' || req.body.type=='free_plan' || req.body.type=='paid_plan' || req.body.type.indexOf('pid_')!=-1) {
                queryParams["package_details.billing_status"] = true;
            }
            if(req.body.type=='free_plan') {
                queryParams["package_details.package_id"] = mongoose.Types.ObjectId(setupConfig.free_plan);
            }
            if(req.body.type=='paid_plan') {
                queryParams["package_details.package_id"] = { $ne: mongoose.Types.ObjectId(setupConfig.free_plan) };
            }
            if(req.query.type=='trial_expires_in' || req.query.type=='unused') {
                let dateFilter = { $gte: new Date(req.query.from*1), $lte: new Date(req.query.to*1) };
                if(req.query.day_type=='lt') { dateFilter = { $lt: new Date(req.query.from*1) }; }
                if(req.query.day_type=='lte') { dateFilter = { $lte: new Date(req.query.to*1) }; }
                if(req.query.type=='trial_expires_in') { queryParams["package_details.trial_expiry"] = dateFilter; }
                if(req.query.type=='unused') { queryParams.last_login = dateFilter; }
            }
            else if(req.body.type.indexOf('pid_')!=-1) {
                let packageId = req.body.type.replace("pid_", "");
                queryParams["package_details.package_id"] = mongoose.Types.ObjectId(packageId);
            }
            store.find(queryParams, { app_token: 1 }, function(err, response) {
                if(!err && response) {
                    let regIds = [];
                    response.forEach(obj => { regIds.push(obj.app_token); });
                    notifyService.app(regIds, req.body).then((respData) => {
                        res.json(respData);
                    }).catch((errData) => { res.json(errData); });
                }
                else { res.json({ status: false, error: err, message: "Invalid user" }); }
            });
        }
    }
    else { res.json({ status: true }); }
}

exports.generate_token = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeData = response;
            // JWT Token
            const payload = { id: storeData._id, login_type: 'admin', session_key: storeData.session_key };
            const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
            storeProperties.findOne({ store_id: storeData._id }, function(err, response) {
                if(!err && response) {
                    storeData.login_id = storeData._id;
                    res.json({ status: true, token: token, login_type: 'admin', data: storeData, store_permissions: response });
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid user" });
                }
            });
        }
        else {
            res.json({ status: false, error: null, message: "Invalid store" });
        }
    });
}

exports.generate_token_v2 = (req, res) => {
    store.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" } },
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
            // JWT Token
            const payload = { id: storeData._id, login_type: 'admin', session_key: storeData.session_key };
            const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
            ysPackages.aggregate([
                { $match: {  _id: mongoose.Types.ObjectId(storeData.package_details.package_id), status: "active" } },
                {
                    $lookup: {
                        from: "ys_features",
                        localField: "_id",
                        foreignField: "linked_packages.package_id",
                        as: "ysFeatures"
                    }
                }
            ], function(err, response) {
                if(!err && response[0])
                {
                    let currIndex = storeData.currency_types.findIndex(obj => obj.default_currency);
                    let defaultCurrency = storeData.currency_types[currIndex];
                    let featureList = storeData.package_details.paid_features;
                    let packageData = response[0];
                    storeData.package_info = { name: packageData.name, category: packageData.category, service: packageData.service };
                    if(packageData.trial_status) {
                        let trialEndData = new Date(storeData.created_on).setDate(new Date(storeData.created_on).getDate() + parseFloat(packageData.trial_upto_in_days));
                        if(new Date(trialEndData).setHours(23,59,59,999) > new Date().setHours(23,59,59,999)) {
                            packageData.trial_features.forEach(element => { featureList.push(element); });
                        }
                    }
                    packageData.ysFeatures.filter(fea => fea.status=='active').forEach(element => {
                        let packIndex = element.linked_packages.findIndex(obj => obj.package_id.toString()==storeData.package_details.package_id);
                        if(packIndex!=-1) {
                            element.package_pricing = element.linked_packages[packIndex].currency_types;
                            if(element.package_pricing && element.package_pricing[defaultCurrency.country_code] && element.package_pricing[defaultCurrency.country_code].price === 0) featureList.push(element.keyword);
                        }
                    });
                    res.json({ status: true, token: token, login_type: 'admin', data: storeData, ys_features: featureList });
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid package" });
                }
            });
        }
        else {
            res.json({ status: false, error: null, message: "Invalid store" });
        }
    });
}

exports.change_pwd = (req, res) => {
    let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
    let sessionKey = new Date().valueOf();
    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.store_id) },
    { $set: { password: newPwd, temp_token: null, session_key: sessionKey } }, function(err, response) {
        if(!err && response) {
            res.json({ status: true });
        }
        else {
            res.json({ status: false, error: err, message: "Unable to update pwd" });
        }
    });
}

exports.manual_deploy = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.query.store_id) && req.query.store_id) {
        store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, function(err, response) {
            if(!err && response) {
                let storeDetails = response;
                let siteName = storeDetails.base_url.replace("https://", "").replace("www.", "");
                if(storeDetails.build_details && !storeDetails.build_details.port_number && !storeDetails.build_details.build_number) {
                    admin.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
                        if(!err && response) {
                            let adminDetails = response;
                            if(adminDetails.auto_deploy) {
                                // update next port number
                                admin.updateMany({ _id: mongoose.Types.ObjectId(adminDetails._id) }, { $inc: { next_port: 1 } }, function(err, response) { });
                                // auto-deploy
                                const options = {
                                    url: 'http://admin:117e1bb46d62de4d1249591b720f47f0da@fiscy.com:8081/job/Yourstore-Pipe/buildWithParameters?website='+siteName+'&port='+adminDetails.next_port+'&store_id='+storeDetails._id,
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: { token: '&bnXrQ5$f-e2VbAYHze%urmM!F$@nnrV' },
                                    json: true
                                };
                                request(options, function(err, response, body) {
                                    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(storeDetails._id) },
                                    { $set: { "build_details.port_number": adminDetails.next_port } }, function(err, response) {
                                        res.json({ status: true });
                                    });
                                });
                            }
                            else { res.json({ status: false, message: "Auto-Deployment was temporarily disabled" }); }
                        }
                        else { res.json({ status: false, message: "Invalid login" }); }
                    });
                }
                else { res.json({ status: false, message: "Deployment was done. Please check the build status" }); } 
            }
            else { res.json({ status: false, error: null, message: "Invalid store" }); }
        });
    }
    else { res.json({ status: false, message: "Invalid store ID" }); }
}

exports.check_build_status = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.query.store_id) && req.query.store_id) {
        store.findOne({ _id: mongoose.Types.ObjectId(req.query.store_id), status: "active" }, function(err, response) {
            if(!err && response) {
                let storeDetails = response;
                if(storeDetails.build_details && storeDetails.build_details.build_number) {
                    const options = {
                        url: 'http://admin:117e1bb46d62de4d1249591b720f47f0da@fiscy.com:8081/job/Yourstore-Pipe/'+storeDetails.build_details.build_number+'/api/json',
                        method: 'GET'
                    };
                    request(options, function(err, response, body) {
                        if(!err && response.statusCode == 200) {
                            let jsonData = JSON.parse(body);
                            store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(storeDetails._id) },
                            { $set: { "build_details.build_status": jsonData.result } }, function(err, response) {
                                if(!err && response) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Unable to update" }); }
                            });
                        }
                        else { res.json({ status: false, message: "Invalid build number" }); }
                    });
                }
                else { res.json({ status: false, message: "Build number doesn't exists" }); }
            }
            else { res.json({ status: false, error: null, message: "Invalid store" }); }
        });
    }
    else { res.json({ status: false, message: "Invalid store ID" }); }
}