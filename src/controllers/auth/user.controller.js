"use strict";
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);
const request = require('request');
const urlencode = require('urlencode');
const dateFormat = require('dateformat');
const jwtConfig = require('../../../config/jwtsecret');
const customer = require("../../models/customer.model");
const guestUser = require("../../models/guest_user.model");
const store = require("../../models/store.model");
const mailService = require("../../../services/mail.service");
const setupConfig = require('../../../config/setup.config');
const mailTemp = require('../../../config/mail-templates');
const commonService = require("../../../services/common.service");

exports.register = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    req.body.session_key = new Date().valueOf();
    customer.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), email: req.body.email, status: "active" }, function(err, response) {
        if(!err && !response) {
            store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
                if(!err && response) {
                    let storeDetails = response;
                    // get customers count
                    customer.find({ store_id: mongoose.Types.ObjectId(req.body.store_id) }).countDocuments({}, function(err, totalCustomers) {
                        req.body.unique_id = String(totalCustomers+1).padStart(6, '0');
                        let newCustomer = new customer(req.body);
                        // store
                        newCustomer.save(function(err, response) {
                            if(!err && response) {
                                let customerData = response;
                                const payload = { id: customerData._id, store_id: req.body.store_id, session_key: customerData.session_key };
                                const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                                // mail
                                let mailConfig = setupConfig.mail_config;
                                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                let copyYear = new Date().getFullYear();
                                mailTemp.signup(storeDetails).then((body) => {
                                    let bodyContent = body;
                                    let filePath = setupConfig.mail_base+storeDetails._id+'/signup.html';
                                    request.get(filePath, function (err, response, body) {
                                        if(!err && response.statusCode == 200) { bodyContent = body; }
                                        bodyContent = bodyContent.replace("##customer_name##", customerData.name);
                                        bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                        let sendData = {
                                            store_name: storeDetails.name,
                                            config: mailConfig,
                                            sendTo: req.body.email,
                                            subject: "Welcome to "+storeDetails.name+"!",
                                            body: bodyContent
                                        };
                                        mailService.sendMailFromStore(sendData, function(err, response) {
                                            res.json({ status: true, token: token, customer_details: customerData });
                                        });
                                    });
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Unable to register" });
                            }
                        });
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid Store" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Email already exists" });
        }
    });
}

exports.register_with_otp = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            if(req.body.email) {
                req.body.email = req.body.email.trim();
                req.body.email = req.body.email.toLowerCase();
            }
            if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
            if(req.body.mobile) { req.body.mobile = req.body.mobile.trim(); }
            req.body.status = "inactive";
            req.body.session_key = new Date().valueOf();
            customer.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id), $or: [ { email: req.body.email }, { mobile: req.body.mobile } ] }, function(err, response) {
                if(!err && response) {
                    if(response.status=='inactive') {
                        req.body.password = bcrypt.hashSync(req.body.password, saltRounds);
                        req.body.otp = Math.floor(100000+Math.random()*999999);
                        req.body.otp_request_on = new Date();
                        customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(response._id) },
                        { $set: req.body }, { new: true }, function(err, response) {
                            if(!err && response) {
                                let customerData = response;
                                // send otp
                                sendOtp(storeDetails, customerData).then((respData) => {
                                    res.json(respData);
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Failure" });
                            }
                        });
                    }
                    else {
                        let customerData = response;
                        if(customerData.email==req.body.email && customerData.mobile==req.body.mobile) {
                            res.json({ status: false, message: "Email and Mobile already exists" });
                        }
                        else if(customerData.email==req.body.email) {
                            res.json({ status: false, message: "Email already exists" });
                        }
                        else if(customerData.mobile==req.body.mobile) {
                            res.json({ status: false, message: "Mobile already exists" });
                        }
                        else {
                            res.json({ status: false, message: "Failure" });
                        }
                    }
                }
                else {
                    // get customers count
                    customer.find({ store_id: mongoose.Types.ObjectId(storeDetails._id) }).countDocuments({}, function(err, totalCustomers) {
                        req.body.unique_id = String(totalCustomers+1).padStart(6, '0');
                        req.body.otp = Math.floor(100000+Math.random()*999999);
                        req.body.otp_request_on = new Date();
                        let newCustomer = new customer(req.body);
                        // store
                        newCustomer.save(function(err, response) {
                            if(!err && response) {
                                let customerData = response;
                                // send otp
                                sendOtp(storeDetails, customerData).then((respData) => {
                                    res.json(respData);
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Unable to register" });
                            }
                        });
                    });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

exports.validate_otp = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.body.customer_id), otp: req.body.otp }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            // duration validation 15 minutes
            let timeStamp = ((customerData.otp_request_on).getTime() + (15*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) {
                // activate the customer
                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerData._id) }, { $set: { status: "active" } }, function(err, response) {
                    if(!err && response) {
                        store.findOne({ _id: mongoose.Types.ObjectId(customerData.store_id), status: "active" }, function(err, response) {
                            if(!err && response) {
                                let storeDetails = response;
                                const payload = { id: customerData._id, store_id: storeDetails._id, session_key: customerData.session_key };
                                const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                                // mail
                                let mailConfig = setupConfig.mail_config;
                                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                let copyYear = new Date().getFullYear();
                                mailTemp.signup(storeDetails).then((body) => {
                                    let bodyContent = body;
                                    let filePath = setupConfig.mail_base+storeDetails._id+'/signup.html';
                                    request.get(filePath, function (err, response, body) {
                                        if(!err && response.statusCode == 200) { bodyContent = body; }
                                        bodyContent = bodyContent.replace("##customer_name##", customerData.name);
                                        bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                        let sendData = {
                                            store_name: storeDetails.name,
                                            config: mailConfig,
                                            sendTo: customerData.email,
                                            subject: "Welcome to "+storeDetails.name+"!",
                                            body: bodyContent
                                        };
                                        mailService.sendMailFromStore(sendData, function(err, response) {
                                            res.json({ status: true, token: token, customer_details: customerData });
                                        });
                                    });
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Invalid Store" });
                            }
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Unable to activate" }); }
                });
            }
            else { res.json({ status: false, message: "OTP was expired" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid OTP" }); }
    });
}

exports.login = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    customer.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), email: req.body.email, status: "active" }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            customerData.comparePassword(req.body.password, async function(err, isMatch) {
                if(!err && isMatch)
                {
                    if(!req.body.cart_list) { req.body.cart_list = []; }
                    storeLocalData(customerData._id, req.body.cart_list).then(() => {
                        // customer details
                        customer.findOne({ _id: mongoose.Types.ObjectId(customerData._id) }, function(err, response) {
                            if(!err && response) {
                                const payload = { id: response._id, store_id: req.body.store_id, session_key: response.session_key };
                                const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                                res.json({ status: true, token: token, customer_details: response });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Failure" });
                            }
                        });
                    }).catch(function(error) {
                        res.json({ status: false, message: error });
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "The password that you've entered is incorrect" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid email" });
        }
    });
}

exports.social_login = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    customer.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), email: req.body.email, status: "active" }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            if(!req.body.cart_list) { req.body.cart_list = []; }
            storeLocalData(customerData._id, req.body.cart_list).then(() => {
                // customer details
                customer.findOne({ _id: mongoose.Types.ObjectId(customerData._id) }, function(err, response) {
                    if(!err && response) {
                        const payload = { id: response._id, store_id: req.body.store_id, session_key: response.session_key };
                        const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                        res.json({ status: true, token: token, customer_details: response });
                    }
                    else {
                        res.json({ status: false, error: err, message: "Failure" });
                    }
                });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else {
            store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
                if(!err && response) {
                    let storeDetails = response;
                    // get customers count
                    customer.find({ store_id: mongoose.Types.ObjectId(req.body.store_id) }).countDocuments({}, function(err, totalCustomers) {
                        req.body.unique_id = String(totalCustomers+1).padStart(6, '0');
                        req.body.session_key = new Date().valueOf();
                        customer.create(req.body, function(err, response) {
                            if(!err && response) {
                                let customerData = response;
                                const payload = { id: customerData._id, store_id: req.body.store_id, session_key: customerData.session_key };
                                const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                                // mail
                                let mailConfig = setupConfig.mail_config;
                                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                let copyYear = new Date().getFullYear();
                                mailTemp.signup(storeDetails).then((body) => {
                                    let bodyContent = body;
                                    let filePath = setupConfig.mail_base+storeDetails._id+'/signup.html';
                                    request.get(filePath, function (err, response, body) {
                                        if(!err && response.statusCode == 200) { bodyContent = body; }
                                        bodyContent = bodyContent.replace("##customer_name##", customerData.name);
                                        bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                        let sendData = {
                                            store_name: storeDetails.name,
                                            config: mailConfig,
                                            sendTo: req.body.email,
                                            subject: "Welcome to "+storeDetails.name+"!",
                                            body: bodyContent
                                        };
                                        mailService.sendMailFromStore(sendData, function(err, response) {
                                            res.json({ status: true, token: token, customer_details: customerData });
                                        });
                                    });
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Unable to register" });
                            }
                        });
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid Store" });
                }
            });
        }
    });
}

exports.guest_login = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    req.body.session_key = new Date().valueOf();
    let updateData = { login_on: new Date(), session_key: req.body.session_key, address_list: [] };
    if(req.body.cart_list.length) {
        updateData.cart_recovery = true;
        updateData.cart_updated_on = new Date();
        updateData.cart_list = req.body.cart_list;
    }
    if(req.body.address_list && req.body.address_list.length) {
        updateData.address_list = req.body.address_list;
    }
    guestUser.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.body.store_id), email: req.body.email, status: "active" },
    { $set: updateData }, { new: true }, function(err, response) {
        if(!err && response) {
            const payload = { id: response._id, store_id: req.body.store_id, session_key: response.session_key };
            const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
            res.json({ status: true, token: token, data: response });
        }
        else {
            guestUser.create(req.body, function(err, response) {
                if(!err && response) {
                    const payload = { id: response._id, store_id: req.body.store_id, session_key: response.session_key };
                    const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                    res.json({ status: true, token: token, data: response });
                }
                else { res.json({ status: false, error: err, message: "Unable to register" }); }
            });
        }
    });
}

// send pwd recovery mail
exports.forgot_request = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            customer.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id), email: req.body.email, status: "active" }, function(err, response) {
                if(!err && response) {
                    let customerDetails = response;
                    let token = commonService.randomString(4)+new Date().valueOf()+commonService.randomString(4);
                    customer.findOneAndUpdate({ _id: customerDetails._id },
                    { $set: { temp_token: token, forgot_request_on: new Date() } }, function(err, response) {
                        if(!err) {
                            // mail
                            let mailConfig = setupConfig.mail_config;
                            if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                            let copyYear = new Date().getFullYear();
                            let resetLink = storeDetails.base_url+'/others/password-recovery/'+token;
                            mailTemp.pwd_recovery(storeDetails).then((body) => {
                                let bodyContent = body;
                                let filePath = setupConfig.mail_base+storeDetails._id+'/pwd_recovery.html';
                                request.get(filePath, function (err, response, body) {
                                    if(!err && response.statusCode == 200) { bodyContent = body; }
                                    bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
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
                        else {
                            res.json({ status: false, error: err, message: "Failure" });
                        }
                    });
                }
                else {
                    res.json({ status: false, error: err, message: "Email not found. Please sign up." });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

exports.validate_forgot_request = (req, res) => {
    customer.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), temp_token: req.body.temp_token }, function(err, response) {
        if(!err && response) {
            // duration validation 60 minutes
            let timeStamp = ((response.forgot_request_on).getTime() + (60*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) {
                res.json({ status: true, message: "success" });
            }
            else {
                res.json({ status: false, error: err, message: "Link was expired" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid user" });
        }
    });
}

exports.update_pwd = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            customer.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id), temp_token: req.body.temp_token }, function(err, response) {
                if(!err && response) {
                    // duration validation 60 minutes
                    let customerDetails = response;
                    let timeStamp = ((response.forgot_request_on).getTime() + (60*60000));
                    let currentTime = new Date().valueOf();
                    if(timeStamp > currentTime) {
                        let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
                        let sessionKey = new Date().valueOf();
                        customer.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(storeDetails._id), temp_token: req.body.temp_token },
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
                                        bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                                        bodyContent = bodyContent.replace("##email##", customerDetails.email);
                                        bodyContent = bodyContent.replace("##time##", currentDate);
                                        bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                        let sendData = {
                                            store_name: storeDetails.name,
                                            config: mailConfig,
                                            sendTo: customerDetails.email,
                                            subject: "Your password has been reset.",
                                            body: bodyContent
                                        };
                                        mailService.sendMailFromStore(sendData, function(err, response) {
                                            res.json({ status: true });
                                        });
                                    });
                                });
                            }
                            else {
                                res.json({ status: false, error: err, message: "Failure" });
                            }
                        });
                    }
                    else {
                        res.json({ status: false, error: err, message: "Link was expired" });
                    }
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid user" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

function sendOtp(storeDetails, customerData) {
    return new Promise((resolve, reject) => {
        let smsConfig = storeDetails.sms_config;
        if(smsConfig && smsConfig.provider=='24x7SMS') {
            let mobileNo = customerData.dial_code+customerData.mobile;
            let msgContent = smsConfig.msg_content.replace(/#OTP#/g, customerData.otp);
            let smsOptions = {
                method: 'get',
                url: 'https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY='+smsConfig.api_key+'&MobileNo='+mobileNo+'&SenderID='+smsConfig.sender_id+'&Message='+urlencode(msgContent)+'&ServiceName='+smsConfig.service_name+'&DLTTemplateID='+smsConfig.template_id,
            };
            request(smsOptions, function (err, response) {
                if(!err && response.statusCode == 200) {
                    if(response.body.indexOf('success')!=-1) {
                        resolve({ status: true, data: { customer_id: customerData._id } });
                    }
                    else { resolve({ status: false, error: response.body, message: "Unable to send SMS" }); }
                }
                else { resolve({ status: false, error: err, message: "SMS gateway error" }); }
            });
        }
        else {
            // resolve({ status: false, message: "Invalid SMS provider" });
            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerData._id) },
            { $set: { status: "active" } }, { new: true }, function(err, response) {
                if(!err && response) {
                    const payload = { id: customerData._id, store_id: storeDetails._id, session_key: customerData.session_key };
                    const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                    // mail
                    let mailConfig = setupConfig.mail_config;
                    if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                    let copyYear = new Date().getFullYear();
                    mailTemp.signup(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/signup.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerData.name);
                            bodyContent = bodyContent.replace("##copy_year##", copyYear);
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerData.email,
                                subject: "Welcome to "+storeDetails.name+"!",
                                body: bodyContent
                            };
                            mailService.sendMailFromStore(sendData, function(err, response) {
                                resolve({ status: true, token: token, customer_details: customerData });
                            });
                        });
                    });
                }
                else {
                    resolve({ status: false, error: err, message: "Failure" });
                }
            }); 
        }
    });
}

function storeLocalData(customerId, newCartList) {
    return new Promise((resolve, reject) => {
        customer.findOne({ _id: mongoose.Types.ObjectId(customerId) }, function(err, response) {
            if(!err && response) {
                // update cart list
                let existCartList = response.cart_list;
                newCartList.forEach(x => {
                    let index = existCartList.findIndex(obj => obj.product_id==x.product_id && JSON.stringify(obj.variant_types)==JSON.stringify(x.variant_types));
                    if(index!=-1) existCartList[index] = x;
                    else existCartList.push(x);
                });
                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerId) },
                { $set: { cart_list: existCartList } }, function(err, response) {
                    resolve(true);
                });
            }
            else {
                reject("Invalid user");
            }
        });
    });
}