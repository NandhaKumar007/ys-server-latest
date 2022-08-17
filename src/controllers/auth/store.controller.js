"use strict";
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('request');
const dateFormat = require('dateformat');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);
const jwtConfig = require('../../../config/jwtsecret');
const setupConfig = require('../../../config/setup.config');
const mailTemp = require('../../../config/mail-templates');
const store = require("../../models/store.model");
const vendor = require("../../models/vendor.model");
const storeFeatures = require("../../models/store_features.model");
const storeProperties = require("../../models/store_properties.model");
const ysPackages = require("../../models/ys_packages.model");
const mailService = require("../../../services/mail.service");
const commonService = require("../../../services/common.service");

exports.login = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    // store admin
    store.findOne({ email: req.body.email, status: "active" }, function(err, response) {
        if(!err && response) {
            let storeData = response;
            storeData.comparePassword(req.body.password, async function(err, isMatch) {
                if(!err && isMatch)
                {
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
                    res.json({ status: false, error: err, message: "Password does not match" });
                }
            });
        }
        else {
            // sub user
            storeFeatures.findOne({ "sub_users.email": req.body.email, "sub_users.status": "active" }, function(err, response) {
                if(!err && response) {
                    let storeId = response.store_id;
                    let subUserList = response.sub_users;
                    let index = subUserList.findIndex(obj => obj.email==req.body.email && obj.status=="active");
                    let subUser = subUserList[index];
                    bcrypt.compare(req.body.password, subUser.password, function(err, isMatch) {
                        if(!err && isMatch)
                        {
                            // pending update device token for sub-user
                            // JWT Token
                            const payload = { id: storeId, login_type: 'subuser', subuser_id: subUser._id, session_key: subUser.session_key };
                            const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                            store.aggregate([
                                { $match: {  _id: mongoose.Types.ObjectId(storeId), status: "active" } },
                                {
                                    $lookup: {
                                        from: "store_permissions",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "permissions"
                                    }
                                }
                            ], function(err, response) {
                                if(!err && response[0])
                                {
                                    let storePermission = response[0].permissions[0];
                                    let storeDetails = response[0];
                                    storeDetails.permissions = [];
                                    storeDetails.login_id = subUser._id;
                                    res.json({ status: true, token: token, login_type: 'subuser', data: storeDetails, store_permissions: storePermission, subuser_permissions: subUser.permissions });
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Invalid user" });
                                }
                            });
                        }
                        else {
                            res.json({ status: false, error: err, message: "Password does not match" });
                        }
                    });
                }
                else {
                    res.json({ status: false, error: null, message: "Invalid user" });
                }
            });
        }
    });
}

exports.login_v2 = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    // store admin
    store.aggregate([
        { $match: { email: req.body.email } },
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
            if(storeData.package_details.trial_expiry)
            {
                bcrypt.compare(req.body.password, storeData.password, function(err, isMatch) {
                    if(!err && isMatch)
                    {
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
                                let updateData = { last_login: new Date() };
                                if(req.body.app_token) { updateData.app_token = req.body.app_token; }
                                store.findByIdAndUpdate(storeData._id, { $set: updateData }, function(err, response) { });
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
                        res.json({ status: false, error: err, message: "Password does not match" });
                    }
                });
            }
            else {
                if(storeData.temp_token && storeData.status=='inactive') {
                    // send activation link
                    let activationLink = setupConfig.api_base+"others/store_activation?id="+storeData._id+"&token="+storeData.temp_token;
                    mailTemp.getYsMailTemplate('store_signup').then((body) => {
                        let bodyContent = body;
                        bodyContent = bodyContent.replace("##store_name##", storeData.name);
                        bodyContent = bodyContent.replace("##activation_link##", activationLink);
                        let sendData = {
                            config: setupConfig.ys_mail_config,
                            sendTo: storeData.email,
                            subject: "Activation for "+storeData.name,
                            body: bodyContent
                        };
                        mailService.sendMailFromAdmin(sendData, function(err, response) {
                            res.json({ status: false, error: null, message: "Please check the email sent to "+storeData.email+" to activate "+storeData.name+"." });
                        });
                    });
                }
                else {
                    res.json({ status: false, error: null, message: "Unable to login. Please contact yourstore team!" });
                }
            }
        }
        else {
            // sub user
            storeFeatures.findOne({ "sub_users.email": req.body.email, "sub_users.status": "active" }, function(err, response) {
                if(!err && response) {
                    let storeId = response.store_id;
                    let subUserList = response.sub_users;
                    let index = subUserList.findIndex(obj => obj.email==req.body.email && obj.status=="active");
                    let subUser = subUserList[index];
                    bcrypt.compare(req.body.password, subUser.password, function(err, isMatch) {
                        if(!err && isMatch)
                        {
                            // pending update device token for sub-user
                            // JWT Token
                            const payload = { id: storeId, login_type: 'subuser', subuser_id: subUser._id, session_key: subUser.session_key };
                            const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                            store.aggregate([
                                { $match: { _id: mongoose.Types.ObjectId(storeId), status: "active" } },
                                {
                                    $lookup: {
                                        from: "deploy_details",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "deployDetails"
                                    }
                                }
                            ], function(err, response) {
                                if(!err && response[0])
                                {
                                    let storeData = response[0];
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
                                            res.json({ status: true, token: token, login_type: 'subuser', data: storeData, ys_features: featureList, subuser_features: subUser.permission_list });
                                        }
                                        else {
                                            res.json({ status: false, error: err, message: "Invalid package" });
                                        }
                                    });
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Account expired" });
                                }
                            });
                        }
                        else {
                            res.json({ status: false, error: err, message: "Password does not match" });
                        }
                    });
                }
                else {
                    res.json({ status: false, error: null, message: "Invalid user" });
                }
            });
        }
    });
}

exports.forgot_request = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    store.findOne({ email: req.body.email }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let token = commonService.randomString(4)+new Date().valueOf()+commonService.randomString(4);
            store.findOneAndUpdate({ email: req.body.email },
            { $set: { temp_token: token, forgot_request_on: new Date() } }, function(err, response) {
                if(!err) {
                    let resetLink = setupConfig.store_login_base+'/session/password-recovery/'+token;
                    mailTemp.getYsMailTemplate('pwd_recovery').then((body) => {
                        let bodyContent = body.replace("##customer_name##", storeDetails.company_details.contact_person);
                        bodyContent = bodyContent.replace("##recovery_link##", resetLink);
                        let sendData = {
                            config: setupConfig.ys_mail_config,
                            sendTo: req.body.email,
                            subject: "Password Reset Request.",
                            body: bodyContent
                        };
                        mailService.sendMailFromAdmin(sendData, function(err, response) {
                            if(!err && response) {
                                res.json({ status: true, message: "Email sent successfully" });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Couldn't send email" });
                            }
                        });
                    });
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.validate_forgot_request = (req, res) => {
    store.findOne({ temp_token: req.body.temp_token }, function(err, response) {
        if(!err && response) {
            // duration validation 60 minutes
            let timeStamp = ((response.forgot_request_on).getTime() + (60*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) {
                res.json({ status: true, message: "success" });
            }
            else { res.json({ status: false, error: err, message: "Link was expired" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.update_pwd = (req, res) => {
    store.findOne({ temp_token: req.body.temp_token }, function(err, response) {
        if(!err && response) {
            // duration validation 60 minutes
            let storeDetails = response;
            let timeStamp = ((response.forgot_request_on).getTime() + (60*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) {
                let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
                let sessionKey = new Date().valueOf();
                store.findOneAndUpdate({ temp_token: req.body.temp_token },
                { $set: { password: newPwd, temp_token: null, session_key: sessionKey } }, function(err, response) {
                    if(!err) {
                        let currentDate = dateFormat(new Date(), "mmmm d yyyy")+' at '+dateFormat(new Date(), "h:MM:ss TT");
                        mailTemp.getYsMailTemplate('pwd_updated').then((body) => {
                            let bodyContent = body.replace("##customer_name##", storeDetails.company_details.contact_person);
                            bodyContent = bodyContent.replace("##email##", storeDetails.email);
                            bodyContent = bodyContent.replace("##time##", currentDate);
                            let sendData = {
                                config: setupConfig.ys_mail_config,
                                sendTo: storeDetails.email,
                                subject: "Your password has been reset.",
                                body: bodyContent
                            };
                            mailService.sendMailFromAdmin(sendData, function(err, response) {
                                res.json({ status: true });
                            });
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else { res.json({ status: false, error: err, message: "Link was expired" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.vendor_login = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    vendor.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), email: req.body.email, status: "active" }, function(err, response) {
        if(!err && response) {
            let vendorDetails = response;
            let storeId = vendorDetails.store_id;
            bcrypt.compare(req.body.password, vendorDetails.password, function(err, isMatch) {
                if(!err && isMatch)
                {
                    // JWT Token
                    const payload = { id: storeId, login_type: 'vendor', vendor_id: vendorDetails._id, session_key: vendorDetails.session_key };
                    const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                    store.aggregate([
                        { $match: { _id: mongoose.Types.ObjectId(storeId), status: "active" } },
                        {
                            $lookup: {
                                from: "deploy_details",
                                localField: "_id",
                                foreignField: "store_id",
                                as: "deployDetails"
                            }
                        }
                    ], function(err, response) {
                        if(!err && response[0])
                        {
                            let storeData = response[0];
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
                                    res.json({ status: true, token: token, login_type: 'vendor', data: storeData, ys_features: featureList, vendor_details: vendorDetails });
                                }
                                else { res.json({ status: false, error: err, message: "Invalid package" }); }
                            });
                        }
                        else { res.json({ status: false, error: err, message: "Account expired" }); }
                    });
                }
                else { res.json({ status: false, error: err, message: "Password does not match" }); }
            });
        }
        else { res.json({ status: false, error: null, message: "Invalid user" }); }
    });
}

exports.vendor_forgot_request = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            vendor.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id), email: req.body.email, status: "active" }, function(err, response) {
                if(!err && response) {
                    let vendorDetails = response;
                    let token = commonService.randomString(4)+new Date().valueOf()+commonService.randomString(4);
                    vendor.findOneAndUpdate({ _id: mongoose.Types.ObjectId(vendorDetails._id) },
                    { $set: { temp_token: token, forgot_request_on: new Date() } }, function(err, response) {
                        if(!err) {
                            let mailConfig = setupConfig.mail_config;
                            if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                            let copyYear = new Date().getFullYear();
                            let resetLink = setupConfig.store_login_base+'/vendor/password-recovery/'+token+'/'+storeDetails._id;
                            mailTemp.pwd_recovery(storeDetails).then((body) => {
                                let bodyContent = body;
                                let filePath = setupConfig.mail_base+storeDetails._id+'/pwd_recovery.html';
                                request.get(filePath, function (err, response, body) {
                                    if(!err && response.statusCode == 200) { bodyContent = body; }
                                    bodyContent = bodyContent.replace("##customer_name##", vendorDetails.contact_person);
                                    bodyContent = bodyContent.replace("##recovery_link##", resetLink);
                                    bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                    let sendData = {
                                        store_name: storeDetails.name,
                                        config: mailConfig,
                                        sendTo: req.body.email,
                                        subject: "Password Reset Request.",
                                        body: bodyContent
                                    };
                                    mailService.sendMailFromStore(sendData, function(err, response) {
                                        if(!err && response) {
                                            res.json({ status: true, message: "Email sent successfully" });
                                        }
                                        else {
                                            res.json({ status: false, error: err, message: "Couldn't send email" });
                                        }
                                    });
                                });
                            });
                        }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid user" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid store" }); }
    });
}

exports.validate_vendor_forgot_request = (req, res) => {
    vendor.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), temp_token: req.body.temp_token, status: 'active' }, function(err, response) {
        if(!err && response) {
            // duration validation 60 minutes
            let timeStamp = ((response.forgot_request_on).getTime() + (60*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) {
                res.json({ status: true, message: "success" });
            }
            else { res.json({ status: false, error: err, message: "Link was expired" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.update_vendor_pwd = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            vendor.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id), temp_token: req.body.temp_token, status: 'active' }, function(err, response) {
                if(!err && response) {
                    // duration validation 60 minutes
                    let vendorDetails = response;
                    let timeStamp = ((vendorDetails.forgot_request_on).getTime() + (60*60000));
                    let currentTime = new Date().valueOf();
                    if(timeStamp > currentTime) {
                        let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
                        let sessionKey = new Date().valueOf();
                        vendor.findOneAndUpdate({ _id: mongoose.Types.ObjectId(vendorDetails._id) },
                        { $set: { password: newPwd, temp_token: null, session_key: sessionKey } }, function(err, response) {
                            if(!err) {
                                // mail
                                let mailConfig = setupConfig.mail_config;
                                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                let copyYear = new Date().getFullYear();
                                let currentDate = dateFormat(new Date(), "mmmm d yyyy")+' at '+dateFormat(new Date(), "h:MM:ss TT");
                                mailTemp.pwd_updated(storeDetails).then((body) => {
                                    let bodyContent = body;
                                    let filePath = setupConfig.mail_base+storeDetails._id+'/pwd_updated.html';
                                    request.get(filePath, function (err, response, body) {
                                        if(!err && response.statusCode == 200) { bodyContent = body; }
                                        bodyContent = bodyContent.replace("##customer_name##", vendorDetails.contact_person);
                                        bodyContent = bodyContent.replace("##email##", vendorDetails.email);
                                        bodyContent = bodyContent.replace("##time##", currentDate);
                                        bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                        let sendData = {
                                            store_name: storeDetails.name,
                                            config: mailConfig,
                                            sendTo: vendorDetails.email,
                                            subject: "Your password has been reset.",
                                            body: bodyContent
                                        };
                                        mailService.sendMailFromStore(sendData, function(err, response) {
                                            res.json({ status: true });
                                        });
                                    });
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Link was expired" }); }
                }
                else { res.json({ status: false, error: err, message: "Invalid user" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid store" }); }
    });
}