"use strict";
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const store = require("../../models/store.model");
const admin = require("../../models/admin.model");
const deployDetails = require("../../models/deploy_details.model");
const dpWalletMgmt = require("../../models/dp_wallet_mgmt.model");
const ysOrders = require("../../models/ys_orders.model");
const setupConfig = require("../../../config/setup.config");
const commonService = require("../../../services/common.service");
const pdfService = require("../../../services/pdf_generator.service");
const mailService = require("../../../services/mail.service");
const mailTemp = require('../../../config/mail-templates');
const defaultSetup = require('../../../config/default.setup');

exports.razorpay_webhook = (req, res) => {
    admin.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, function(err, response) {
        if(!err && response) {
            let adminDetails = response;
            let signature = req.get('x-razorpay-signature');
	        let validSignature = Razorpay.validateWebhookSignature(JSON.stringify(req.body), signature, req.params.id);
            if(validSignature) {
                let orderData = req.body.payload.payment.entity;
                orderData.webhook = true;
                let paymentId = orderData.id;
                let orderType = orderData.notes.my_order_type;
                let orderId = orderData.notes.my_order_id;
                // COMPLETED
                if(orderData.status === 'captured') {
                    // for client signup
                    if(orderType=='dp_wallet') {
                        dpWalletMgmt.findOne({ _id: mongoose.Types.ObjectId(orderId), status: 'inactive' }, function(err, response) {
                            if(!err && response) {
                                let orderDetails = response;
                                dpWalletMgmt.findByIdAndUpdate(orderId, { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                    if(!err && response) {
                                        // update credit
                                        store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.store_id) },
                                        { $inc: { "dp_wallet_details.balance": orderDetails.final_price } }, { new: true }, function(err, response) {
                                            if(!err && response) {
                                                dpWalletMgmt.findByIdAndUpdate(orderId, { $set: { balance: response.dp_wallet_details.balance } }, function(err, response) { });
                                                res.json({ status: true });
                                            }
                                            else { res.json({ status: false, message: 'Credit update error. Please contact yourstore team' }); }
                                        });
                                    }
                                    else { res.json({ status: false, message: 'Payment update error. Please contact yourstore team' }); }
                                });
                            }
                            else { res.json({ status: false, message: 'Invalid Order' }); }
                        });
                    }
                    else if(orderType=='purchase_plan' || orderType=='plan_renewal' || orderType=='plan_change' || orderType=='purchase_app') {
                        ysOrders.findOne({ _id: mongoose.Types.ObjectId(orderId), status: 'inactive' }, function(err, response) {
                            if(!err && response) {
                                let orderDetails = response;
                                let invoiceNumber = commonService.invoiceNumber(adminDetails.invoice_config);
                                ysOrders.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) },
                                { $set: { invoice_number: invoiceNumber, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } },
                                { new: true }, function(err, response) {
                                    if(!err && response) {
                                        orderDetails = response;
                                        admin.findByIdAndUpdate(adminDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                        if(orderType=='purchase_plan') {
                                            store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
                                                if(!err && response) {
                                                    let storeDetails = response;
                                                    let startDate = new Date().setHours(0,0,0,0);
                                                    let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*orderDetails.package_details.month)-1) );
                                                    expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                                                    // transaction date
                                                    let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                                                    let transactionRange = { from: new Date(startDate), to: new Date(transEndDate) };
                                                    store.findByIdAndUpdate(storeDetails._id, {
                                                        $set: {
                                                            status: "active", "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                                            "package_details.transaction_range": transactionRange, "package_details.package_id": orderDetails.package_details._id,
                                                            "package_details.month": orderDetails.package_details.month
                                                        }
                                                    }, function(err, response) {
                                                        if(!err) {
                                                            deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                                            { $set: { "deploy_stages.package": true } }, function(err, response) { });
                                                            // send mail
                                                            pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                let packageInfo = {}; let appList = "";
                                                                let packageId = orderDetails.package_details._id.toString();
                                                                if(defaultSetup.package_details[packageId]) {
                                                                    packageInfo = defaultSetup.package_details[packageId];
                                                                    packageInfo.app_list.forEach(app => {
                                                                        appList += "<li>"+app+"</li>";
                                                                    });
                                                                }
                                                                mailTemp.getYsMailTemplate('plan_purchase').then((body) => {
                                                                    let bodyContent = body;
                                                                    bodyContent = bodyContent.replace("##plan_name##", packageInfo.name);
                                                                    bodyContent = bodyContent.replace("##app_list##", appList);
                                                                    let sendData = {
                                                                        config: setupConfig.ys_mail_config,
                                                                        sendTo: storeDetails.email,
                                                                        subject: "Congrats! You have selected a plan for "+storeDetails.name,
                                                                        body: bodyContent,
                                                                        cc_mail: setupConfig.ys_mail_config.sales_mail,
                                                                        attachments: [{
                                                                            filename: orderDetails.invoice_number+".pdf",
                                                                            path: setupConfig.api_base+filePath
                                                                        }]
                                                                    };
                                                                    if(storeDetails.mail_config.billing_mail) {
                                                                        sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                    }
                                                                    mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                        res.json({ status: true });
                                                                    });
                                                                });
                                                            });
                                                        }
                                                        else { res.json({ status: false, message: 'Unable to update' }); }
                                                    });
                                                }
                                                else { res.json({ status: false, message: 'Invalid Store' }); }
                                            });
                                        }
                                        else if(orderType=='plan_renewal') {
                                            store.aggregate([
                                                { $match: { _id: mongoose.Types.ObjectId(orderDetails.store_id) } },
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
                                                    let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*orderDetails.package_details.month)-1) );
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
                                                        $inc: { "package_details.credit": -orderDetails.credit }
                                                    }, function(err, response) {
                                                        if(!err) {
                                                            // send mail
                                                            pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                let packageInfo = {};
                                                                let packageId = storeDetails.package_details.package_id.toString();
                                                                if(defaultSetup.package_details[packageId]) {
                                                                    packageInfo = defaultSetup.package_details[packageId];
                                                                }
                                                                mailTemp.getYsMailTemplate('plan_renewal').then((body) => {
                                                                    let bodyContent = body;
                                                                    bodyContent = bodyContent.replace("##plan_name##", packageInfo.name);
                                                                    let sendData = {
                                                                        config: setupConfig.ys_mail_config,
                                                                        sendTo: storeDetails.email,
                                                                        subject: "Plan renewed for "+storeDetails.name,
                                                                        body: bodyContent,
                                                                        cc_mail: setupConfig.ys_mail_config.notify_mail,
                                                                        attachments: [{
                                                                            filename: orderDetails.invoice_number+".pdf",
                                                                            path: setupConfig.api_base+filePath
                                                                        }]
                                                                    };
                                                                    if(storeDetails.mail_config.billing_mail) {
                                                                        sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                    }
                                                                    mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                        res.json({ status: true });
                                                                    });
                                                                });
                                                            });
                                                        }
                                                        else { res.json({ status: false, message: 'Unable to update' }); }
                                                    });
                                                }
                                                else { res.json({ status: false, message: 'Invalid Store' }); }
                                            });
                                        }
                                        else if(orderType=='plan_change') {
                                            store.aggregate([
                                                { $match: { _id: mongoose.Types.ObjectId(orderDetails.store_id) } },
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
                                                    let newFeaturesList = [];
                                                    orderDetails.app_list.forEach(element => { newFeaturesList.push(element.keyword); });
                                                    let startDate = new Date().setHours(0,0,0,0);
                                                    let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*orderDetails.package_details.month)-1) );
                                                    expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                                                    // transaction date
                                                    let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                                                    let transactionRange = { from: new Date(startDate), to: new Date(transEndDate) };
                                                    store.findByIdAndUpdate(storeDetails._id, {
                                                        $set: {
                                                            "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                                            "package_details.paid_features": newFeaturesList, "package_details.transaction_range": transactionRange,
                                                            status: "active", "package_details.package_id": orderDetails.package_details._id,
                                                            "package_details.month": orderDetails.package_details.month
                                                        },
                                                        $inc: { "package_details.credit": orderDetails.credit }
                                                    }, function(err, response) {
                                                        if(!err) {
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
                                                            // send mail
                                                            pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                let packageInfo = {}; let appList = "";
                                                                let packageId = orderDetails.package_details._id.toString();
                                                                if(defaultSetup.package_details[packageId]) {
                                                                    packageInfo = defaultSetup.package_details[packageId];
                                                                    packageInfo.app_list.forEach(app => {
                                                                        appList += "<li>"+app+"</li>";
                                                                    });
                                                                }
                                                                mailTemp.getYsMailTemplate('plan_change').then((body) => {
                                                                    let bodyContent = body;
                                                                    bodyContent = bodyContent.replace("##plan_name##", packageInfo.name);
                                                                    bodyContent = bodyContent.replace("##app_list##", appList);
                                                                    let sendData = {
                                                                        config: setupConfig.ys_mail_config,
                                                                        sendTo: storeDetails.email,
                                                                        subject: "You have updated the plan for "+storeDetails.name,
                                                                        body: bodyContent,
                                                                        cc_mail: setupConfig.ys_mail_config.notify_mail,
                                                                        attachments: [{
                                                                            filename: orderDetails.invoice_number+".pdf",
                                                                            path: setupConfig.api_base+filePath
                                                                        }]
                                                                    };
                                                                    if(storeDetails.mail_config.billing_mail) {
                                                                        sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                    }
                                                                    mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                        res.json({ status: true });
                                                                    });
                                                                });
                                                            });
                                                        }
                                                        else { res.json({ status: false, message: 'Unable to update' }); }
                                                    });
                                                }
                                                else { res.json({ status: false, message: 'Invalid Store' }); }
                                            });
                                        }
                                        else {
                                            // purchase_app
                                            store.aggregate([
                                                { $match: { _id: mongoose.Types.ObjectId(orderDetails.store_id) } },
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
                                                    let storeFeatures = storeDetails.package_details.paid_features;
                                                    let trialFeatures = storeDetails.deployDetails[0].trial_features;
                                                    orderDetails.app_list.forEach(element => {
                                                        let tIndex = trialFeatures.findIndex(obj => obj.name==element.name);
                                                        if(tIndex!=-1) {
                                                            trialFeatures[tIndex].paid = true;
                                                            trialFeatures[tIndex].status = "active";
                                                            trialFeatures[tIndex].uninstalled = false;
                                                        }
                                                        storeFeatures.push(element.name);
                                                    });
                                                    storeFeatures = new Set(storeFeatures);
                                                    storeFeatures = Array.from(storeFeatures);
                                                    deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                                    { $set: { trial_features: trialFeatures } }, function(err, response) {
                                                        store.findByIdAndUpdate(storeDetails._id, { $set: { "package_details.paid_features": storeFeatures } }, function(err, response) {
                                                            if(!err) {
                                                                // send mail
                                                                pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                    mailTemp.getYsMailTemplate('app_payment').then((body) => {
                                                                        let bodyContent = body;
                                                                        let sendData = {
                                                                            config: setupConfig.ys_mail_config,
                                                                            sendTo: storeDetails.email,
                                                                            subject: "App successfully added to "+storeDetails.name,
                                                                            body: bodyContent,
                                                                            cc_mail: setupConfig.ys_mail_config.notify_mail,
                                                                            attachments: [{
                                                                                filename: orderDetails.invoice_number+".pdf",
                                                                                path: setupConfig.api_base+filePath
                                                                            }]
                                                                        };
                                                                        if(storeDetails.mail_config.billing_mail) {
                                                                            sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                        }
                                                                        mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                            res.json({ status: true });
                                                                        });
                                                                    });
                                                                });
                                                            }
                                                            else { res.json({ status: false, message: 'Unable to update' }); }
                                                        });
                                                    });
                                                }
                                                else { res.json({ status: false, message: 'Invalid Store' }); }
                                            });
                                        }
                                    }
                                    else { res.json({ status: false, message: 'Payment update error. Please contact yourstore team' }); }
                                });
                            }
                            else { res.json({ status: false, message: 'Invalid Order' }); }
                        });
                    }
                    else { res.json({ status: false, message: 'Invalid Order' }); }
                }
                else {
                    // if order status != success
                    if(orderType=='dp_wallet') {
                        dpWalletMgmt.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) },
                        { $set: { "payment_details.payment_id": paymentId, "payment_details.status": orderData.status } }, function(err, response) { });
                    }
                    else if(orderType=='purchase_plan' || orderType=='plan_renewal' || orderType=='plan_change' || orderType=='purchase_app') {
                        ysOrders.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) },
                        { $set: { "payment_details.payment_id": paymentId, "payment_details.status": orderData.status } }, function(err, response) { });
                    }
                    res.json({ status: false, message: 'Payment '+orderData.status });
                }
            }
            else { res.json({ status: false, message: "Invalid signature" }); }
        }
        else { res.json({ status: false, message: "Invalid user" }); }
    });
}

exports.razorpay_store_payment_status = (req, res) => {
    admin.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, function(err, response) {
        if(!err && response) {
            let adminDetails = response;
            let paymentMethod = adminDetails.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length && req.body.razorpay_payment_id)
            {
                let paymentCallback = paymentMethod[0].admin_panel_callback;
                let instance = new Razorpay(paymentMethod[0].config);
                instance.payments.fetch(req.body.razorpay_payment_id, function(err, orderData) {
                    if(!err && orderData) {
                        let paymentId = orderData.id;
                        let orderType = orderData.notes.my_order_type;
                        let orderId = orderData.notes.my_order_id;
                        // COMPLETED
                        if(orderData.status === 'captured') {
                            // for client signup
                            if(orderType=='dp_wallet') {
                                dpWalletMgmt.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let orderDetails = response;
                                        if(orderDetails.status=='active') {
                                            // redirect to website
                                            res.writeHead(301, {Location: paymentCallback.return_url+'/wallet/'+orderDetails._id});
                                            res.end();
                                        }
                                        else {
                                            dpWalletMgmt.findByIdAndUpdate(orderId, { $set: { payment_success: true, "payment_details.payment_id": paymentId, status: "active" } }, function(err, response) {
                                                if(!err && response) {
                                                    // update credit
                                                    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.store_id) },
                                                    { $inc: { "dp_wallet_details.balance": orderDetails.final_price } }, { new: true }, function(err, response) {
                                                        if(!err && response) {
                                                            dpWalletMgmt.findByIdAndUpdate(orderId, { $set: { balance: response.dp_wallet_details.balance } }, function(err, response) { });
                                                            res.writeHead(301, {Location: paymentCallback.return_url+'/wallet/'+orderDetails._id});
                                                            res.end();
                                                        }
                                                        else {
                                                            res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Credit update error. Please contact yourstore team"});
                                                            res.end();
                                                        }
                                                    });
                                                }
                                                else {
                                                    res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Payment update error. Please contact yourstore team"});
                                                    res.end();
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid payment"});
                                        res.end();
                                    }
                                });
                            }
                            else if(orderType=='purchase_plan' || orderType=='plan_renewal' || orderType=='plan_change' || orderType=='purchase_app') {
                                ysOrders.findOne({ _id: mongoose.Types.ObjectId(orderId) }, function(err, response) {
                                    if(!err && response) {
                                        let orderDetails = response;
                                        if(orderDetails.status=='active') {
                                            // redirect to website
                                            res.writeHead(301, {Location: paymentCallback.return_url+'/ys-order/'+orderDetails._id});
                                            res.end();
                                        }
                                        else {
                                            let invoiceNumber = commonService.invoiceNumber(adminDetails.invoice_config);
                                            ysOrders.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) },
                                            { $set: { invoice_number: invoiceNumber, payment_success: true, "payment_details.payment_id": paymentId, status: "active" } },
                                            { new: true }, function(err, response) {
                                                if(!err && response) {
                                                    orderDetails = response;
                                                    admin.findByIdAndUpdate(adminDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                                                    if(orderType=='purchase_plan') {
                                                        store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
                                                            if(!err && response) {
                                                                let storeDetails = response;
                                                                let startDate = new Date().setHours(0,0,0,0);
                                                                let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*orderDetails.package_details.month)-1) );
                                                                expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                                                                // transaction date
                                                                let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                                                                let transactionRange = { from: new Date(startDate), to: new Date(transEndDate) };
                                                                store.findByIdAndUpdate(storeDetails._id, {
                                                                    $set: {
                                                                        status: "active", "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                                                        "package_details.transaction_range": transactionRange, "package_details.package_id": orderDetails.package_details._id,
                                                                        "package_details.month": orderDetails.package_details.month
                                                                    }
                                                                }, function(err, response) {
                                                                    if(!err) {
                                                                        deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                                                        { $set: { "deploy_stages.package": true } }, function(err, response) { });
                                                                        // send mail
                                                                        pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                            let packageInfo = {}; let appList = "";
                                                                            let packageId = orderDetails.package_details._id.toString();
                                                                            if(defaultSetup.package_details[packageId]) {
                                                                                packageInfo = defaultSetup.package_details[packageId];
                                                                                packageInfo.app_list.forEach(app => {
                                                                                    appList += "<li>"+app+"</li>";
                                                                                });
                                                                            }
                                                                            mailTemp.getYsMailTemplate('plan_purchase').then((body) => {
                                                                                let bodyContent = body;
                                                                                bodyContent = bodyContent.replace("##plan_name##", packageInfo.name);
                                                                                bodyContent = bodyContent.replace("##app_list##", appList);
                                                                                let sendData = {
                                                                                    config: setupConfig.ys_mail_config,
                                                                                    sendTo: storeDetails.email,
                                                                                    subject: "Congrats! You have selected a plan for "+storeDetails.name,
                                                                                    body: bodyContent,
                                                                                    cc_mail: setupConfig.ys_mail_config.sales_mail,
                                                                                    attachments: [{
                                                                                        filename: orderDetails.invoice_number+".pdf",
                                                                                        path: setupConfig.api_base+filePath
                                                                                    }]
                                                                                };
                                                                                if(storeDetails.mail_config.billing_mail) {
                                                                                    sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                                }
                                                                                mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                                    res.writeHead(301, {Location: paymentCallback.return_url+'/ys-order/'+orderDetails._id});
                                                                                    res.end();
                                                                                });
                                                                            });
                                                                        });
                                                                    }
                                                                    else {
                                                                        res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Unable to update"});
                                                                        res.end();
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid store"});
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                    else if(orderType=='plan_renewal') {
                                                        store.aggregate([
                                                            { $match: { _id: mongoose.Types.ObjectId(orderDetails.store_id) } },
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
                                                                let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*orderDetails.package_details.month)-1) );
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
                                                                    $inc: { "package_details.credit": -orderDetails.credit }
                                                                }, function(err, response) {
                                                                    if(!err) {
                                                                        // send mail
                                                                        pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                            let packageInfo = {};
                                                                            let packageId = storeDetails.package_details.package_id.toString();
                                                                            if(defaultSetup.package_details[packageId]) {
                                                                                packageInfo = defaultSetup.package_details[packageId];
                                                                            }
                                                                            mailTemp.getYsMailTemplate('plan_renewal').then((body) => {
                                                                                let bodyContent = body;
                                                                                bodyContent = bodyContent.replace("##plan_name##", packageInfo.name);
                                                                                let sendData = {
                                                                                    config: setupConfig.ys_mail_config,
                                                                                    sendTo: storeDetails.email,
                                                                                    subject: "Plan renewed for "+storeDetails.name,
                                                                                    body: bodyContent,
                                                                                    cc_mail: setupConfig.ys_mail_config.notify_mail,
                                                                                    attachments: [{
                                                                                        filename: orderDetails.invoice_number+".pdf",
                                                                                        path: setupConfig.api_base+filePath
                                                                                    }]
                                                                                };
                                                                                if(storeDetails.mail_config.billing_mail) {
                                                                                    sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                                }
                                                                                mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                                    res.writeHead(301, {Location: paymentCallback.return_url+'/ys-order/'+orderDetails._id});
                                                                                    res.end();
                                                                                });
                                                                            });
                                                                        });
                                                                    }
                                                                    else {
                                                                        res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Unable to update"});
                                                                        res.end();
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid store"});
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                    else if(orderType=='plan_change') {
                                                        store.aggregate([
                                                            { $match: { _id: mongoose.Types.ObjectId(orderDetails.store_id) } },
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
                                                                let newFeaturesList = [];
                                                                orderDetails.app_list.forEach(element => { newFeaturesList.push(element.keyword); });
                                                                let startDate = new Date().setHours(0,0,0,0);
                                                                let expiryDate = new Date(startDate).setDate(new Date(startDate).getDate() + ((30*orderDetails.package_details.month)-1) );
                                                                expiryDate = new Date(expiryDate).setHours(23,59,59,999);
                                                                // transaction date
                                                                let transEndDate = new Date(expiryDate).setDate(new Date(expiryDate).getDate() - 5);
                                                                let transactionRange = { from: new Date(startDate), to: new Date(transEndDate) };
                                                                store.findByIdAndUpdate(storeDetails._id, {
                                                                    $set: {
                                                                        "package_details.billing_status": true, "package_details.expiry_date": new Date(expiryDate),
                                                                        "package_details.paid_features": newFeaturesList, "package_details.transaction_range": transactionRange,
                                                                        status: "active", "package_details.package_id": orderDetails.package_details._id,
                                                                        "package_details.month": orderDetails.package_details.month
                                                                    },
                                                                    $inc: { "package_details.credit": orderDetails.credit }
                                                                }, function(err, response) {
                                                                    if(!err) {
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
                                                                        // send mail
                                                                        pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                            let packageInfo = {}; let appList = "";
                                                                            let packageId = orderDetails.package_details._id.toString();
                                                                            if(defaultSetup.package_details[packageId]) {
                                                                                packageInfo = defaultSetup.package_details[packageId];
                                                                                packageInfo.app_list.forEach(app => {
                                                                                    appList += "<li>"+app+"</li>";
                                                                                });
                                                                            }
                                                                            mailTemp.getYsMailTemplate('plan_change').then((body) => {
                                                                                let bodyContent = body;
                                                                                bodyContent = bodyContent.replace("##plan_name##", packageInfo.name);
                                                                                bodyContent = bodyContent.replace("##app_list##", appList);
                                                                                let sendData = {
                                                                                    config: setupConfig.ys_mail_config,
                                                                                    sendTo: storeDetails.email,
                                                                                    subject: "You have updated the plan for "+storeDetails.name,
                                                                                    body: bodyContent,
                                                                                    cc_mail: setupConfig.ys_mail_config.notify_mail,
                                                                                    attachments: [{
                                                                                        filename: orderDetails.invoice_number+".pdf",
                                                                                        path: setupConfig.api_base+filePath
                                                                                    }]
                                                                                };
                                                                                if(storeDetails.mail_config.billing_mail) {
                                                                                    sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                                }
                                                                                mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                                    res.writeHead(301, {Location: paymentCallback.return_url+'/ys-order/'+orderDetails._id});
                                                                                    res.end();
                                                                                });
                                                                            });
                                                                        });
                                                                    }
                                                                    else {
                                                                        res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Unable to update"});
                                                                        res.end();
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid store"});
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        // purchase_app
                                                        store.aggregate([
                                                            { $match: { _id: mongoose.Types.ObjectId(orderDetails.store_id) } },
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
                                                                let storeFeatures = storeDetails.package_details.paid_features;
                                                                let trialFeatures = storeDetails.deployDetails[0].trial_features;
                                                                orderDetails.app_list.forEach(element => {
                                                                    let tIndex = trialFeatures.findIndex(obj => obj.name==element.keyword);
                                                                    if(tIndex!=-1) {
                                                                        trialFeatures[tIndex].paid = true;
                                                                        trialFeatures[tIndex].status = "active";
                                                                        trialFeatures[tIndex].uninstalled = false;
                                                                    }
                                                                    storeFeatures.push(element.keyword);
                                                                });
                                                                storeFeatures = new Set(storeFeatures);
                                                                storeFeatures = Array.from(storeFeatures);
                                                                deployDetails.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                                                { $set: { trial_features: trialFeatures } }, function(err, response) {
                                                                    store.findByIdAndUpdate(storeDetails._id, { $set: { "package_details.paid_features": storeFeatures } }, function(err, response) {
                                                                        if(!err) {
                                                                            // send mail
                                                                            pdfService.ysPayments(storeDetails, orderDetails).then((filePath) => {
                                                                                mailTemp.getYsMailTemplate('app_payment').then((body) => {
                                                                                    let bodyContent = body;
                                                                                    let sendData = {
                                                                                        config: setupConfig.ys_mail_config,
                                                                                        sendTo: storeDetails.email,
                                                                                        subject: "App successfully added to "+storeDetails.name,
                                                                                        body: bodyContent,
                                                                                        cc_mail: setupConfig.ys_mail_config.notify_mail,
                                                                                        attachments: [{
                                                                                            filename: orderDetails.invoice_number+".pdf",
                                                                                            path: setupConfig.api_base+filePath
                                                                                        }]
                                                                                    };
                                                                                    if(storeDetails.mail_config.billing_mail) {
                                                                                        sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                                                                    }
                                                                                    mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                                        res.writeHead(301, {Location: paymentCallback.return_url+'/ys-order/'+orderDetails._id});
                                                                                        res.end();
                                                                                    });
                                                                                });
                                                                            });
                                                                        }
                                                                        else {
                                                                            res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Unable to update"});
                                                                            res.end();
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                            else {
                                                                res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid store"});
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                }
                                                else {
                                                    res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Payment update error. Please contact yourstore team"});
                                                    res.end();
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        // if invalid order
                                        res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid payment"});
                                        res.end();
                                    }
                                });
                            }
                            else {
                                // if invalid order type
                                res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Invalid Order"});
                                res.end();
                            }
                        }
                        else {
                            // if order status != success
                            if(orderType=='dp_wallet') {
                                dpWalletMgmt.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) },
                                { $set: { "payment_details.payment_id": paymentId, "payment_details.status": orderData.status } }, function(err, response) { });
                            }
                            else if(orderType=='purchase_plan' || orderType=='plan_renewal' || orderType=='plan_change' || orderType=='purchase_app') {
                                ysOrders.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) },
                                { $set: { "payment_details.payment_id": paymentId, "payment_details.status": orderData.status } }, function(err, response) { });
                            }
                            res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Payment "+orderData.status});
                            res.end();
                        }
                    }
                    else {
                        // if invalid order
                        res.writeHead(301, {Location: paymentCallback.cancel_url+"?response=Payment Error"});
                        res.end();
                    }
                });
            }
            else {
                // invalid payment method
                res.send('Invalid payment method or missing paymentId');
            }
        }
        else {
            // invalid store
            res.send('Invalid Data');
        }
    });
}