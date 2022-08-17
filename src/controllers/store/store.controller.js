"use strict";
const mongoose = require('mongoose');
const request = require('request');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);
const dateFormat = require('dateformat');
const store = require("../../models/store.model");
const deployDetails = require("../../models/deploy_details.model");
const feedback = require("../../models/feedback.model");
const nlSubscribers = require("../../models/newsletter.model");
const orderList = require("../../models/order_list.model");
const couponCodes = require("../../models/coupon_codes.model");
const product = require("../../models/product.model");
const customer = require("../../models/customer.model");
const ysOrders = require("../../models/ys_orders.model");
const ysPackages = require("../../models/ys_packages.model");
const promotions = require('../../models/ys_promotions.model');
const storeProperties = require("../../models/store_properties.model");
const vendorSettlements = require("../../models/vendor_settlements.model");
const imgUploadService = require("../../../services/img_upload.service");
const mailService = require("../../../services/mail.service");
const storeService = require("../../../services/store.service");
const setupConfig = require('../../../config/setup.config');
const mailTemp = require('../../../config/mail-templates');

exports.details = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.adv_details = (req, res) => {
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
            if(storeData.status=='active') {
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
                        res.json({ status: true, login_type: 'admin', data: storeData, ys_features: featureList });
                    }
                    else { res.json({ status: false, error: err, message: "Invalid package" }); }
                });
            }
            else { res.json({ status: true, session_out: true, data: storeData, ys_features: [] }); }
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.update = (req, res) => {
    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
    { $set: req.body }, { new: true }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            if(req.body.category && req.body.change_category) {
                deployDetails.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id) }, function(err, response) {
                    if(!err && response) {
                        let deployData = response;
                        if(deployData.category!=req.body.category) {
                            deployDetails.findOneAndUpdate({ _id: mongoose.Types.ObjectId(deployData._id) },
                            { $set: { category: req.body.category } }, { new: true }, function(err, response) {
                                if(!err && response) {
                                    storeService.create_layout(storeDetails._id).then(() => {
                                        res.json({ status: true, data: storeDetails, deploy_details: response });
                                    }).catch((errData) => { res.json(errData); });
                                }
                                else { res.json({ status: false, error: err, message: "Unable to update category" }); }
                            });
                        }
                        else { res.json({ status: true, data: storeDetails }); }
                    }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else { res.json({ status: true, data: storeDetails }); }
        }
        else { res.json({ status: false, error: err, message: "Update Failure" }); }
    });
}

exports.prop_details = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.update_prop = (req, res) => {
    let newsletterConfig = req.body['application_setting.newsletter_config'];
    if(newsletterConfig && newsletterConfig.img_change) {
        let rootPath = 'uploads/'+req.id+'/newsletter';
        imgUploadService.singleFileUpload(newsletterConfig.image, rootPath, true, null).then((img) => {
            req.body['application_setting.newsletter_config'].image = img;
            storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
            { $set: req.body }, { new: true }, function(err, response) {
                if(!err && response) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "Update Failure" }); }
            });
        });
    }
    else {
        storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
        { $set: req.body }, { new: true }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "Update Failure" }); }
        });
    }
}

exports.feedback = (req, res) => {
    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
    feedback.aggregate([
        { $match:
            { store_id: mongoose.Types.ObjectId(req.id), created_on: { $gte: new Date(fromDate), $lt: new Date(toDate) } }
        },
        { $lookup: 
            { from: "customers", localField: "customer_id", foreignField: "_id", as: "customer_details" }
        }
    ], function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.newsletter_subscribers = (req, res) => {
    nlSubscribers.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.dashboard = (req, res) => {
    if(!req.body.master_login) {
        store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) }, { $set: { last_login: new Date() } }, function(err, response) { });
    }
    let details = { order_list: [], gc_list: [], products: 0 };
    // promotions
    promotions.find({ active_status: true }, function(err, response) {
        let promList = [];
        if(!err && response) { promList = response; }
        // order list
        orderList.find({
            store_id: mongoose.Types.ObjectId(req.id), status: "active",
            created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
        }, { order_status : 1 , created_on : 1, status: 1, store_id: 1, final_price: 1, payment_success: 1 }, function(err, response) {
            if(!err && response) { details.order_list = response; }
            // coupon codes
            couponCodes.find({
                store_id: mongoose.Types.ObjectId(req.id), status: { $ne: 'inactive' }, order_by: 'user',
                created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
            }, { created_on : 1, status: 1, store_id: 1, price: 1 }, function(err, response) {
                if(!err && response) { details.gc_list = response; }
                // products
                product.aggregate([
                    {
                        $match: {
                            store_id: mongoose.Types.ObjectId(req.id), status: "active", created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
                        }
                    },
                    { $count: "total_products" }
                ], function(err, response) {
                    if(!err && response[0]) { details.products = response[0].total_products; }
                    res.json({ status: true, data: details, promotions: promList });
                });
            });
        });
    });
}

exports.dashboard_customers = (req, res) => {
    let details = { top_customers: [], total_customers: 0, abandoned_count: 0 };
    orderList.aggregate([
        {
            $match: {
                store_id: mongoose.Types.ObjectId(req.id), status: "active", order_status: { $ne: 'cancelled' },
                order_by: { $ne: 'guest' }, created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
            },
        },
        {
            $group : {
                _id : "$customer_id",
                totalSaleAmount: { $sum: "$final_price" },
                order_list: { 
                    $push: { order_id: "$_id", item_list: "$item_list", final_price: "$final_price" }
                }
            }
        },
        { $sort : { totalSaleAmount: -1 } },
        { $limit : req.body.limit },
        { 
            $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customerDetails" }
        }
    ], function(err, response) {
        if(!err && response) { details.top_customers = response; }
         // customers
        customer.aggregate([
            {
                $match: {
                    store_id: mongoose.Types.ObjectId(req.id), status: "active", created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
                }
            },
            { $count: "total_customers" }
        ], function(err, response) {
            if(!err && response[0]) { details.total_customers = response[0].total_customers; }
            // abandoned count
            if(!req.body.cd) { req.body.cd = new Date(); }
            if(!req.body.ced) { req.body.ced = new Date().setHours(23,59,59,999); }
            let abandonedDate = req.body.to_date;
            if(new Date(req.body.ced).valueOf()==new Date(req.body.to_date).valueOf()) {
                abandonedDate = new Date(req.body.cd).setHours(new Date(req.body.cd).getHours() - 1);
            }
            customer.aggregate([
                { 
                    $match: {
                        store_id: mongoose.Types.ObjectId(req.id), status: 'active', 'cart_list.0': { $exists: true },
                        cart_updated_on: { $gte: new Date(req.body.from_date), $lte: new Date(abandonedDate) }
                    }
                },
                { $count: "abandoned_count" }
            ], function(err, response) {
                if(!err && response[0]) { details.abandoned_count = response[0].abandoned_count; }
                res.json({ status: true, data: details });
            });
        });
    });
}

exports.vendor_dashboard = (req, res) => {
    let details = { order_list: [], product_count: 0, settlement_orders: [] };
    // order list
    orderList.find({
        store_id: mongoose.Types.ObjectId(req.id), status: "active", "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id),
        created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
    }, { order_status : 1 , created_on : 1, status: 1, store_id: 1, final_price: 1, item_list: 1, vendor_list: 1 }, function(err, response) {
        if(!err && response) {
            response = JSON.parse(JSON.stringify(response));
            response.forEach(order => {
                order.vendor_list = order.vendor_list.filter(obj => obj.vendor_id.toString()==req.body.vendor_id);
                order.total_items = order.item_list.filter(obj => obj.vendor_id.toString()==req.body.vendor_id).length;
                delete order.item_list;
            });
            details.order_list = response;
        }
        // products
        product.countDocuments({
            store_id: mongoose.Types.ObjectId(req.id), vendor_id: mongoose.Types.ObjectId(req.body.vendor_id), status: "active",
            created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
        }, function(err, productsCount) {
            if(!err && productsCount) { details.product_count = productsCount; }
            // settlement orders
            vendorSettlements.find({
                store_id: mongoose.Types.ObjectId(req.id), vendor_id: mongoose.Types.ObjectId(req.body.vendor_id),
                status: { $ne: 'paid' }
            }, { settlement_amt: 1, settlement_on: 1 }, function(err, response) {
                if(!err && response) { details.settlement_orders = response; }
                res.json({ status: true, data: details });
            });
        });
    });
}

exports.billing_statement = (req, res) => {
    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
    ysPackages.find({ status: 'active' }, function(err, response) {
        if(!err && response) {
            let packageDetails = {};
            response.forEach(element => {
                packageDetails[element._id] = element.name;
            });
            ysOrders.find({ store_id: mongoose.Types.ObjectId(req.id), status: 'active', created_on: { $gte: new Date(fromDate), $lt: new Date(toDate) } }, function(err, response) {
                if(!err && response) { res.json({ status: true, list: response, packages: packageDetails }); }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.domain_enquiry = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            // send mail
            if(req.body.form_type=='connect_domain') {
                mailTemp.getYsMailTemplate('connect_domain').then((body) => {
                    let bodyContent = body;
                    let sendData = {
                        config: setupConfig.ys_mail_config,
                        sendTo: storeDetails.email,
                        subject: "Your request for domain linking has been registered!",
                        body: bodyContent
                    };
                    mailService.sendMailFromAdmin(sendData, function(err, response) {
                        // send mail to ys
                        mailTemp.getYsMailTemplate('connect_domain_enquiry').then((body) => {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##store_name##", storeDetails.name);
                            bodyContent = bodyContent.replace("##contact_person##", storeDetails.company_details.contact_person);
                            bodyContent = bodyContent.replace("##mobile##", storeDetails.company_details.dial_code+' '+storeDetails.company_details.mobile);
                            bodyContent = bodyContent.replace("##provider##", req.body.provider);
                            bodyContent = bodyContent.replace("##domain##", req.body.domain);
                            let sendData = {
                                config: setupConfig.ys_mail_config,
                                sendTo: setupConfig.ys_mail_config.support_mail,
                                subject: "Domain Linking Enquiry for "+storeDetails.name,
                                body: bodyContent
                            };
                            mailService.sendMailFromAdmin(sendData, function(err, response) {
                                res.json({ status: true });
                            });
                        });
                    });
                });
            }
            else if(req.body.form_type=='buy_domain') {
                mailTemp.getYsMailTemplate('buy_domain').then((body) => {
                    let bodyContent = body;
                    let sendData = {
                        config: setupConfig.ys_mail_config,
                        sendTo: storeDetails.email,
                        subject: "Your request for buying a domain has been registered!",
                        body: bodyContent
                    };
                    mailService.sendMailFromAdmin(sendData, function(err, response) {
                        // send mail to ys
                        mailTemp.getYsMailTemplate('buy_domain_enquiry').then((body) => {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##store_name##", storeDetails.name);
                            bodyContent = bodyContent.replace("##contact_person##", storeDetails.company_details.contact_person);
                            bodyContent = bodyContent.replace("##mobile##", storeDetails.company_details.dial_code+' '+storeDetails.company_details.mobile);
                            bodyContent = bodyContent.replace("##domain##", req.body.domain);
                            let sendData = {
                                config: setupConfig.ys_mail_config,
                                sendTo: setupConfig.ys_mail_config.support_mail,
                                subject: "Buy Domain Enquiry for "+storeDetails.name,
                                body: bodyContent
                            };
                            mailService.sendMailFromAdmin(sendData, function(err, response) {
                                res.json({ status: true });
                            });
                        });
                    });
                });
            }
            else { res.json({ status: true }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.change_pwd = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            response.comparePassword(req.body.current_pwd, async function(err, isMatch) {
                if(!err && isMatch) {
                    let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
                    let sessionKey = new Date().valueOf();
                    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                    { $set: { password: newPwd, session_key: sessionKey } }, function(err, response) {
                        if(!err) {
                            let currentDate = dateFormat(new Date(), "mmmm d yyyy")+' at '+dateFormat(new Date(), "h:MM:ss TT");
                            mailTemp.getYsMailTemplate('pwd_updated').then((body) => {
                                let bodyContent = body.replace("##customer_name##", storeDetails.company_details.contact_person);
                                bodyContent = bodyContent.replace("##email##", storeDetails.email);
                                bodyContent = bodyContent.replace("##time##", currentDate);
                                let sendData = {
                                    config: setupConfig.ys_mail_config,
                                    sendTo: storeDetails.email,
                                    subject: "Your password has been changed.",
                                    body: bodyContent
                                };
                                mailService.sendMailFromAdmin(sendData, function(err, response) {
                                    res.json({ status: true });
                                });
                            });
                        }
                        else {
                            res.json({ status: false, error: err, message: "Failure" });
                        }
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "Incorrect Password" });
                }
            });
        } else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
};

exports.update_logo = (req, res) => {
    imgUploadService.singleFileUpload(req.body.image, req.body.root_path, req.body.small_image, req.body.file_name).then((fileName) => {
        if(fileName) { res.json({ status: true }); }
        else { res.json({ status: false, message: "Image not exists" }); }
    });
}

exports.create_ssl = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let siteName = storeDetails.base_url.replace("https://", "").replace("www.", "");
            if(storeDetails.build_details && storeDetails.build_details.build_status=='success' && storeDetails.build_details.ssl_status!='success') {
                // create ssl
                const options = {
                    url: 'http://admin:117e1bb46d62de4d1249591b720f47f0da@fiscy.com:8081/job/Yourstore-SSL/buildWithParameters?website='+siteName,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { token: '&bnXrQ5$f-e2VbAYHze%urmM!F$@nnrV' },
                    json: true
                };
                request(options, function(err, response, body) {
                    res.json({ status: true });
                });
            }
            else { res.json({ status: false, message: "Build was not completed or SSL already created" }); }
        }
        else { res.json({ status: false, error: null, message: "Invalid user" }); }
    });
}