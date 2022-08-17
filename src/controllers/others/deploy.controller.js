"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const admin = require("../../models/admin.model");
const layout = require("../../models/layout.model");
const deployDetails = require("../../models/deploy_details.model");
const ysPackages = require("../../models/ys_packages.model");
const ysFeatures = require("../../models/ys_features.model");
const ysOrders = require("../../models/ys_orders.model");
const orderList = require("../../models/order_list.model");
const createPayment = require("../../../services/create_payment.service");
const commonService = require("../../../services/common.service");
const defaultSetup = require('../../../config/default.setup');
const setupConfig = require('../../../config/setup.config');
const storeService = require("../../../services/store.service");

exports.details = (req, res) => {
    deployDetails.findOne({ store_id: mongoose.Types.ObjectId(req.query.store_id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.update = (req, res) => {
    deployDetails.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id) }, function(err, response) {
        if(!err && response) {
            let existDeploydata = response;
            deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.body.store_id) },
            { $set: req.body }, { new: true }, function(err, response) {
                if(!err && response) {
                    let deployData = response;
                    // if change theme color
                    if(req.body.theme_colors && req.body.theme_colors.primary) {
                        // set tile color
                        store.findByIdAndUpdate(deployData.store_id, { $set: { "seo_details.tile_color": req.body.theme_colors.primary } }, function(err, response) {
                            if(!existDeploydata.theme_colors.primary) {
                                // check layout exists
                                layout.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id) }, function(err, response) {
                                    if(!err && !response) {
                                        // create default layout
                                        storeService.create_layout(deployData.store_id).then(() => {
                                            res.json({ status: true, layout_created: true, data: deployData });
                                        }).catch((errData) => { res.json(errData); });
                                    }
                                    else { res.json({ status: true, data: deployData }); }
                                });
                            }
                            else { res.json({ status: true, data: deployData }); }
                        });
                    }
                    else { res.json({ status: true, data: deployData }); }
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.purchase_plan = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), "package_details.billing_status": false }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let diffDays = commonService.dateDiff(storeDetails.created_on, new Date());
            let discPercent = 0; let discAmount = 0;
            let dIndex = defaultSetup.daywise_discounts.findIndex(obj => obj.days==diffDays);
            if(dIndex!=-1) { discPercent = defaultSetup.daywise_discounts[dIndex].discount }
            let currencyType = storeDetails.currency_types.filter(obj => obj.default_currency)[0];
            ysPackages.findOne({ _id: mongoose.Types.ObjectId(req.body.package_id), status: "active" }, function(err, response) {
                if(!err && response) {
                    if(response._id.toString()==setupConfig.free_plan) {
                        let startDate = new Date().setHours(0,0,0,0);
                        let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + 29);
                        expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                        // transaction date
                        let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                        let transactionRange = { from: new Date(startDate), to: new Date(transEndDate) };
                        store.findByIdAndUpdate(storeDetails._id, {
                            $set: {
                                status: "active", "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                "package_details.transaction_range": transactionRange, "package_details.package_id": setupConfig.free_plan
                            }
                        }, { new: true }, function(err, response) {
                            if(!err && response) {
                                let updatedStoreDetails = response;
                                deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                { $set: { "deploy_stages.package": true } }, { new: true }, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, store_details: updatedStoreDetails, deploy_details: response });
                                    }
                                    else { res.json({ status: false, error: err, message: "Unable to update" }); }
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Unable to update" }); }
                        });
                    }
                    else {
                        let priceDetails = response.currency_types[currencyType.country_code];
                        let packageAmount = (priceDetails.live + priceDetails.amount);
                        let payableAmt = packageAmount * req.body.month;
                        if(currencyType.country_code=='INR' && req.body.month > 1) {
                            // Essential
                            if(req.body.package_id=='620650bfc3357e26783c47ad') {
                                if(req.body.month==6) { packageAmount = 999; payableAmt = 999; }
                                else if(req.body.month==12) { packageAmount = 1999; payableAmt = 1999; }
                            }
                            // Professional
                            else if(req.body.package_id=='620650fbc3357e26783c47ae') {
                                if(req.body.month==6) { packageAmount = 2499; payableAmt = 2499; }
                                else if(req.body.month==12) { packageAmount = 4999; payableAmt = 4999; }
                            }
                        }
                        if(discPercent > 0) { discAmount = parseFloat(((payableAmt)*(discPercent/100)).toFixed(2)); }
                        payableAmt = payableAmt - discAmount;
                        let subData = {
                            store_id: storeDetails._id, order_type: "purchase_plan", amount: payableAmt, currency_type: currencyType, status: 'inactive',
                            package_details: { _id: req.body.package_id, price: packageAmount, month: req.body.month },
                            payment_details: req.body.payment_details, discount: discAmount, disc_percent: discPercent
                        };
                        // tax calc
                        if(setupConfig.company_details.country==storeDetails.country && setupConfig.company_details.state==storeDetails.company_details.state) {
                            subData.sgst = { percentage: setupConfig.company_details.sgst, amount: 0 };
                            subData.cgst = { percentage: setupConfig.company_details.cgst, amount: 0 };
                            subData.sgst.amount = parseFloat((((setupConfig.company_details.sgst)/100)*payableAmt).toFixed(2));
                            subData.cgst.amount = parseFloat((((setupConfig.company_details.cgst)/100)*payableAmt).toFixed(2));
                            subData.amount += subData.sgst.amount;
                            subData.amount += subData.cgst.amount;
                        }
                        else {
                            subData.igst = { percentage: setupConfig.company_details.igst, amount: 0 };
                            subData.igst.amount = parseFloat((((setupConfig.company_details.igst)/100)*payableAmt).toFixed(2));
                            subData.amount += subData.igst.amount;
                        }
                        subData.amount = parseFloat(subData.amount.toFixed(2));
                        admin.findOne({}, function(err, response) {
                            let paymentTypes = [];
                            let adminDetails = response;
                            adminDetails.payment_types.filter(obj => obj.status == 'active').forEach(element => {
                                paymentTypes.push({ name: element.name, btn_name: element.btn_name, mode: element.mode, app_config: element.app_config });
                            });
                            if(req.body.payment_details) {
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
                            else { res.json({ status: true, data: subData, payment_types: paymentTypes }); }
                        });
                    }
                }
                else { res.json({ status: false, error: err, message: "Invalid package" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.change_plan = (req, res) => {
    store.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.body.store_id), "package_details.billing_status": true, "package_details.transaction_range": { $exists: true } } },
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
            let storeDetails = response[0];
            let trialFeatures = storeDetails.deployDetails[0].trial_features;
            if(storeDetails.package_details.package_id.toString()!=req.body.package_id) {
                let currencyType = storeDetails.currency_types.filter(obj => obj.default_currency)[0];
                let packIds = [mongoose.Types.ObjectId(storeDetails.package_details.package_id), mongoose.Types.ObjectId(req.body.package_id)];
                ysPackages.find({ _id: { $in: packIds }, status: 'active' }, function(err, response) {
                    if(!err && response && response.length===2) {
                        let packageList = response;
                        let alreadySubscribed = false;
                        ysOrders.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), status: 'active', payment_success: true }, function(err, response) {
                            if(!err && response) { alreadySubscribed = true; }
                            let discAmount = 0; let planDisc = 0;
                            let balanceDays = commonService.dateDiff(new Date(), storeDetails.package_details.expiry_date);
                            // current plan
                            let currPackIndex = packageList.findIndex(obj => obj._id.toString()==storeDetails.package_details.package_id.toString());
                            let currPlan = packageList[currPackIndex];
                            let currPackPricing = currPlan.currency_types[currencyType.country_code];
                            if(currencyType.country_code=='INR' && req.body.month > 1) {
                                // Essential
                                if(storeDetails.package_details.package_id=='620650bfc3357e26783c47ad') {
                                    currPackPricing.live = 0;
                                    currPackPricing.amount = 166.5;
                                }
                                // Professional
                                else if(storeDetails.package_details.package_id=='620650fbc3357e26783c47ae') {
                                    currPackPricing.live = 0;
                                    currPackPricing.amount = 416.5;
                                }
                            }
                            if(alreadySubscribed) {
                                planDisc = parseFloat((((currPackPricing.live + currPackPricing.amount)/30)*balanceDays).toFixed(2));
                                discAmount += planDisc;
                            }
                            // upgrade plan
                            let upgradePackIndex = packageList.findIndex(obj => obj._id.toString()==req.body.package_id);
                            let upgradePlan = packageList[upgradePackIndex];
                            let upgradePackPricing = upgradePlan.currency_types[currencyType.country_code];
                            let upgradePackPrice = (upgradePackPricing.live + upgradePackPricing.amount)*req.body.month;
                            if(currencyType.country_code=='INR' && req.body.month > 1) {
                                // Essential
                                if(req.body.package_id=='620650bfc3357e26783c47ad') {
                                    if(req.body.month==6) { upgradePackPrice = 999; }
                                    else if(req.body.month==12) { upgradePackPrice = 1999; }
                                }
                                // Professional
                                else if(req.body.package_id=='620650fbc3357e26783c47ae') {
                                    if(req.body.month==6) { upgradePackPrice = 2499; }
                                    else if(req.body.month==12) { upgradePackPrice = 4999; }
                                }
                            }
                            // total sales
                            orderList.aggregate([
                                {
                                    $match: {
                                        store_id: mongoose.Types.ObjectId(storeDetails._id), status: "active",
                                        created_on: { $gte: new Date(storeDetails.package_details.transaction_range.from), $lte: new Date() }
                                    }
                                },
                                { $group: { _id : null, total_sales : { $sum: "$final_price" } } }
                            ], function(err, response) {
                                let totalSales = 0; let transactionCharges = 0;
                                if(!err && response[0]) { totalSales = response[0].total_sales; }
                                let usageDays = commonService.dateDiff(storeDetails.package_details.transaction_range.from, new Date());
                                if(usageDays < 30) {
                                    currPackPricing.transaction_limit = parseFloat(((currPackPricing.transaction_limit/30)*usageDays).toFixed(2));
                                }
                                if(totalSales > currPackPricing.transaction_limit) {
                                    let diffAmt = totalSales - currPackPricing.transaction_limit;
                                    transactionCharges = parseFloat((diffAmt*(currPackPricing.transaction_fees/100)).toFixed(2));
                                }
                                // features
                                ysFeatures.find({ keyword: { $in: storeDetails.package_details.paid_features }, status: "active" }, function(err, response) {
                                    if(!err && response) {
                                        let currApps = []; let upgradeApps = []; let appCharges = 0; let makePayment = false;
                                        if(req.body.payment_details && req.body.upgrade_apps) { makePayment = true; }
                                        response.forEach(element => {
                                            // current apps
                                            if(balanceDays > 0) {
                                                let cPackIndex = element.linked_packages.findIndex(obj => obj.package_id.toString()==storeDetails.package_details.package_id.toString());
                                                if(cPackIndex!=-1 && element.linked_packages[cPackIndex].currency_types[currencyType.country_code].price > 0) {
                                                    let objData = { _id: element._id, name: element.name, keyword: element.keyword, image_list: element.image_list };
                                                    objData.price = element.linked_packages[cPackIndex].currency_types[currencyType.country_code].price;
                                                    objData.discount = parseFloat(((objData.price/30)*balanceDays).toFixed(2));
                                                    currApps.push(objData);
                                                    if(alreadySubscribed) { discAmount += objData.discount; }
                                                }
                                            }
                                            // upgrade apps
                                            let uPackIndex = element.linked_packages.findIndex(obj => obj.package_id.toString()==req.body.package_id);
                                            if(uPackIndex!=-1 && element.linked_packages[uPackIndex].currency_types[currencyType.country_code].price > 0) {
                                                let objData = { _id: element._id, name: element.name, keyword: element.keyword, image_list: element.image_list };
                                                objData.price = element.linked_packages[uPackIndex].currency_types[currencyType.country_code].price;
                                                if(makePayment) {
                                                    if(req.body.upgrade_apps.findIndex(obj => obj._id.toString()==objData._id.toString()) != -1) {
                                                        upgradeApps.push(objData);
                                                        appCharges += objData.price;
                                                    }
                                                }
                                                else {
                                                    upgradeApps.push(objData);
                                                    appCharges += objData.price;
                                                }
                                            }
                                        });
                                        appCharges = appCharges*req.body.month;
                                        let subData = {
                                            store_id: storeDetails._id, order_type: "plan_change", amount: 0, currency_type: currencyType, credit: 0, discount: discAmount,
                                            package_details: { _id: upgradePlan._id, price: upgradePackPrice, month: req.body.month },
                                            prev_package_details: { _id: currPlan._id, price: (currPackPricing.live + currPackPricing.amount), discount: planDisc },
                                            status: 'inactive', app_list: upgradeApps, prev_app_list: currApps, subscription_till: storeDetails.package_details.expiry_date,
                                            transaction_charges: transactionCharges, transaction_range: storeDetails.package_details.transaction_range
                                        };
                                        let totalAmt = upgradePackPrice + appCharges + transactionCharges;
                                        if(totalAmt >= discAmount) { subData.amount = totalAmt - discAmount; }
                                        else { subData.credit = discAmount - totalAmt; }
                                        // tax calc
                                        if(setupConfig.company_details.country==storeDetails.country && setupConfig.company_details.state==storeDetails.company_details.state) {
                                            subData.sgst = { percentage: setupConfig.company_details.sgst, amount: 0 };
                                            subData.cgst = { percentage: setupConfig.company_details.cgst, amount: 0 };
                                            subData.sgst.amount = parseFloat((((setupConfig.company_details.sgst)/100)*subData.amount).toFixed(2));
                                            subData.cgst.amount = parseFloat((((setupConfig.company_details.cgst)/100)*subData.amount).toFixed(2));
                                            subData.amount += subData.sgst.amount;
                                            subData.amount += subData.cgst.amount;
                                        }
                                        else {
                                            subData.igst = { percentage: setupConfig.company_details.igst, amount: 0 };
                                            subData.igst.amount = parseFloat((((setupConfig.company_details.igst)/100)*subData.amount).toFixed(2));
                                            subData.amount += subData.igst.amount;
                                        }
                                        subData.amount = parseFloat(subData.amount.toFixed(2));
                                        admin.findOne({}, function(err, response) {
                                            let paymentTypes = [];
                                            let adminDetails = response;
                                            adminDetails.payment_types.filter(obj => obj.status == 'active').forEach(element => {
                                                paymentTypes.push({ name: element.name, btn_name: element.btn_name, mode: element.mode, app_config: element.app_config });
                                            });
                                            if(makePayment) {
                                                // create payment
                                                subData.order_number = commonService.orderNumber();
                                                if(subData.amount > 0) {
                                                    subData.payment_details = req.body.payment_details;
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
                                                else {
                                                    let newFeaturesList = [];
                                                    subData.app_list.forEach(element => { newFeaturesList.push(element.keyword); });
                                                    let startDate = new Date().setHours(0,0,0,0);
                                                    let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*subData.package_details.month)-1) );
                                                    expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                                                    // transaction date
                                                    let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                                                    let transactionRange = { from: new Date(startDate), to: new Date(transEndDate) };
                                                    store.findByIdAndUpdate(storeDetails._id, {
                                                        $set: {
                                                            "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                                            "package_details.paid_features": newFeaturesList, "package_details.transaction_range": transactionRange,
                                                            "package_details.package_id": subData.package_details._id, status: "active",
                                                            "package_details.month": subData.package_details.month
                                                        },
                                                        $inc: { "package_details.credit": subData.credit }
                                                    }, function(err, response) {
                                                        if(!err && response) {
                                                            // uninstall trial apps
                                                            if(trialFeatures.length) {
                                                                trialFeatures.forEach(el => {
                                                                    if(el.status=='active' && !el.paid) {
                                                                        el.status = 'inactive';
                                                                        el.uninstalled = true;
                                                                    }
                                                                });
                                                                deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                                                { $set: { trial_features: trialFeatures } }, function(err, response) { });
                                                            }
                                                            res.json({ status: true });
                                                        }
                                                        else { res.json({ status: false, error: err, message: "Unable to update" }); }
                                                    });
                                                }
                                            }
                                            else {
                                                let respData = {
                                                    subscription_charges: upgradePackPrice, transaction_charges: transactionCharges,
                                                    app_charges: appCharges, discount: discAmount, upgrade_apps: upgradeApps
                                                };
                                                res.json({ status: true, data: respData, payment_data: subData, payment_types: paymentTypes });
                                            }
                                        });
                                    }
                                    else { res.json({ status: false, error: err, message: "Invalid features" }); }
                                });
                            });
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Invalid package" }); }
                });
            }
            else { res.json({ status: false, message: "Invalid package" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.billing_details = (req, res) => {
    store.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.body.store_id) } },
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
            let storeDetails = response[0];
            let trialFeatures = storeDetails.deployDetails[0].trial_features;
            let respData = { store_package_details: storeDetails.package_details, subscription_charge: 0, addon_price: 0, transaction_charges: 0 };
            let currencyType = storeDetails.currency_types.filter(obj => obj.default_currency)[0];
            if(storeDetails.package_details.billing_status && storeDetails.package_details.transaction_range && storeDetails.package_details.expiry_date) {
                // package details
                ysPackages.find({ status: 'active' }, function(err, response) {
                    if(!err && response) {
                        let packagesList = response.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
                        let packIndex = packagesList.findIndex(obj => obj._id.toString()==storeDetails.package_details.package_id.toString());
                        if(packIndex!=-1) {
                            let packageDetails = packagesList[packIndex];
                            respData.package_details = packageDetails;
                            let packagePricing = packageDetails.currency_types[currencyType.country_code];
                            if(currencyType.country_code=='INR' && storeDetails.package_details.month > 1) {
                                let selectedMonth = storeDetails.package_details.month;
                                // Essential
                                if(storeDetails.package_details.package_id=='620650bfc3357e26783c47ad') {
                                    packagePricing.live = 0;
                                    if(selectedMonth==6) { packagePricing.amount = 999; }
                                    else if(selectedMonth==12) { packagePricing.amount = 1999; }
                                }
                                // Professional
                                else if(storeDetails.package_details.package_id=='620650fbc3357e26783c47ae') {
                                    packagePricing.live = 0;
                                    if(selectedMonth==6) { packagePricing.amount = 2499; }
                                    else if(selectedMonth==12) { packagePricing.amount = 4999; }
                                }
                            }
                            respData.subscription_charge = (packagePricing.live + packagePricing.amount);
                            // get next package
                            let filteredPackages = packagesList.filter(obj => obj.category==packageDetails.category && obj.service==packageDetails.service && obj.rank > packageDetails.rank);
                            if(filteredPackages.length) { respData.next_package_details = filteredPackages[0]; }
                            // total sales
                            orderList.aggregate([
                                {
                                    $match: {
                                        store_id: mongoose.Types.ObjectId(storeDetails._id), status: "active",
                                        created_on: {
                                            $gte: new Date(storeDetails.package_details.transaction_range.from),
                                            $lte: new Date(storeDetails.package_details.transaction_range.to)
                                        }
                                    }
                                },
                                { $group: { _id : null, total_sales : { $sum: "$final_price" } } }
                            ], function(err, response) {
                                let totalSales = 0;
                                if(!err && response[0]) { totalSales = response[0].total_sales; }
                                if(totalSales > packagePricing.transaction_limit) {
                                    let diffAmt = totalSales - packagePricing.transaction_limit;
                                    respData.transaction_charges = parseFloat((diffAmt*(packagePricing.transaction_fees/100)).toFixed(2));
                                }
                                // paid features
                                let appList = [];
                                let queryParam = {
                                    "linked_packages.package_id": mongoose.Types.ObjectId(packageDetails._id), status: 'active',
                                    ["linked_packages.currency_types."+currencyType.country_code+".price"]: { $gt : 0 }
                                };
                                ysFeatures.find(queryParam, function(err, response) {
                                    if(!err && response) {
                                        let featuresList = response;
                                        storeDetails.package_details.paid_features.forEach(element => {
                                            let fIndex = featuresList.findIndex(obj => obj.keyword==element);
                                            let tIndex = trialFeatures.findIndex(obj => obj.name==element && obj.status=='inactive');
                                            if(fIndex!=-1 && tIndex==-1) {
                                                let pIndex = featuresList[fIndex].linked_packages.findIndex(obj =>obj.package_id.toString()==packageDetails._id.toString());
                                                if(pIndex!=-1) {
                                                    let feaPrice = featuresList[fIndex].linked_packages[pIndex].currency_types[currencyType.country_code].price;
                                                    respData.addon_price += feaPrice;
                                                    appList.push({ name: featuresList[fIndex].name, keyword: featuresList[fIndex].keyword, price: feaPrice });
                                                }
                                            }
                                        });
                                        admin.findOne({}, function(err, response) {
                                            let paymentTypes = [];
                                            let adminDetails = response;
                                            adminDetails.payment_types.filter(obj => obj.status == 'active').forEach(element => {
                                                paymentTypes.push({ name: element.name, btn_name: element.btn_name, mode: element.mode, app_config: element.app_config });
                                            });
                                            let payableAmount = respData.subscription_charge+respData.transaction_charges+(respData.addon_price)*req.body.month;
                                            let subData = {
                                                store_id: storeDetails._id, order_type: "plan_renewal", currency_type: currencyType, credit: storeDetails.package_details.credit,
                                                status: 'inactive', payment_details: req.body.payment_details, app_list: appList, transaction_charges: respData.transaction_charges,
                                                package_details: { _id: storeDetails.package_details.package_id, price: respData.subscription_charge, month: req.body.month },
                                                amount: payableAmount, transaction_range: storeDetails.package_details.transaction_range, discount: 0
                                            };
                                            // store discount
                                            if(storeDetails.package_details.disc_status) {
                                                subData.discount = storeDetails.package_details.disc_amount;
                                                if(storeDetails.package_details.disc_amount >= subData.amount) {
                                                    subData.discount = subData.amount;
                                                    subData.amount = 0;
                                                }
                                                else { subData.amount = subData.amount - storeDetails.package_details.disc_amount; }
                                            }
                                            // credit
                                            if(storeDetails.package_details.credit >= subData.amount) {
                                                subData.credit = subData.amount;
                                                subData.amount = 0;
                                            }
                                            else { subData.amount = subData.amount - storeDetails.package_details.credit; }
                                            // tax calc
                                            if(setupConfig.company_details.country==storeDetails.country && setupConfig.company_details.state==storeDetails.company_details.state) {
                                                subData.sgst = { percentage: setupConfig.company_details.sgst, amount: 0 };
                                                subData.cgst = { percentage: setupConfig.company_details.cgst, amount: 0 };
                                                subData.sgst.amount = parseFloat((((setupConfig.company_details.sgst)/100)*subData.amount).toFixed(2));
                                                subData.cgst.amount = parseFloat((((setupConfig.company_details.cgst)/100)*subData.amount).toFixed(2));
                                                subData.amount += subData.sgst.amount;
                                                subData.amount += subData.cgst.amount;
                                            }
                                            else {
                                                subData.igst = { percentage: setupConfig.company_details.igst, amount: 0 };
                                                subData.igst.amount = parseFloat((((setupConfig.company_details.igst)/100)*subData.amount).toFixed(2));
                                                subData.amount += subData.igst.amount;
                                            }
                                            subData.amount = parseFloat(subData.amount.toFixed(2));
                                            if(req.body.payment_details) {
                                                // create order
                                                subData.order_number = commonService.orderNumber();
                                                if(req.body.payment_details.name=="")
                                                {
                                                    let trialFeatures = storeDetails.deployDetails[0].trial_features;
                                                    let newFeaturesList = [];
                                                    storeDetails.package_details.paid_features.forEach(element => {
                                                        let tIndex = trialFeatures.findIndex(obj => obj.name==element && obj.status=='inactive');
                                                        if(tIndex==-1) { newFeaturesList.push(element); }
                                                    });
                                                    let startDate = new Date().setHours(0,0,0,0);
                                                    if(new Date() < new Date(storeDetails.package_details.expiry_date)) {
                                                        startDate = new Date(storeDetails.package_details.expiry_date).setDate(new Date(storeDetails.package_details.expiry_date).getDate() + 1);
                                                        startDate = new Date(startDate).setHours(0,0,0,0);
                                                    }
                                                    let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*subData.package_details.month)-1) );
                                                    expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                                                    // transaction date
                                                    let tfDate = storeDetails.package_details.transaction_range.to;
                                                    let transFromDate = new Date(tfDate).setDate(new Date(tfDate).getDate() + 1);
                                                    transFromDate = new Date(transFromDate).setHours(0,0,0,0);
                                                    let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                                                    let transactionRange = { from: new Date(transFromDate), to: new Date(transEndDate) };
                                                    store.findByIdAndUpdate(storeDetails._id, {
                                                        $set: {
                                                            status: "active", "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                                            "package_details.paid_features": newFeaturesList, "package_details.transaction_range": transactionRange
                                                        },
                                                        $inc: { "package_details.credit": -subData.credit }
                                                    }, function(err, response) {
                                                        if(!err) { res.json({ status: true }); }
                                                        else { res.json({ status: false, message: 'Unable to update' }); }
                                                    });
                                                }
                                                else if(req.body.payment_details.name=="Razorpay")
                                                {
                                                    // create payment
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
                                                res.json({ status: true, data: respData, payment_data: subData, payment_types: paymentTypes });
                                            }
                                        });
                                    }
                                    else { res.json({ status: false, error: err, message: "Unable to fetch features" }); }
                                });
                            });
                        }
                        else { res.json({ status: false, message: "Invalid package" }); }
                    }
                    else { res.json({ status: false, error: err, message: "Packages doesn't exists" }); }
                });
            }
            else { res.json({ status: true, data: respData }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid store" }); }
    });
}