const mongoose = require('mongoose');
const request = require('request');
const store = require("../src/models/store.model");
const customer = require("../src/models/customer.model");
const orderList = require('../src/models/order_list.model');
const couponList = require('../src/models/coupon_codes.model');
const donationList = require('../src/models/donation_list.model');
const restoredSection = require("../src/models/restored_section.model");
const ysOrders = require("../src/models/ys_orders.model");
const dpWalletMgmt = require("../src/models/dp_wallet_mgmt.model");
const mailService = require("../services/mail.service");
const commonService = require("../services/common.service");
const setupConfig = require('../config/setup.config');
const mailTemp = require('../config/mail-templates');
const defaultSetup = require('../config/default.setup');

/** cart recovery **/
exports.cartRecovery = function() {

    store.find({ status: 'active', abandoned_status: true }, function(err, response) {
        if(!err && response) {
            abandonedStores(response).then((respData) => {
                return true;
            });
        }
    });

}

function abandonedCustomers(storeDetails) {
    return new Promise((resolve, reject) => {
        let mailConfig = setupConfig.mail_config;
        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
        // get prev 2 hrs time
        let newDate = new Date().setHours( new Date().getHours() - 2 ); 
        customer.find({
            store_id: mongoose.Types.ObjectId(storeDetails._id), status: 'active', 'cart_list.0': { $exists: true },
            cart_recovery: true, cart_updated_on: { $lte: new Date(newDate) }
        }, { name: 1, email: 1 }, function(err, customerList) {
            if(!err && customerList) {
                for(let customerDetails of customerList)
                {
                    let copyYear = new Date().getFullYear();
                    mailTemp.abandoned(storeDetails).then((body) => {
                        let bodyContent = body;
                        let filePath = setupConfig.mail_base+storeDetails._id+'/abandoned.html';
                        request.get(filePath, function (err, response, body) {
                            if(!err && response.statusCode == 200) { bodyContent = body; }
                            bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                            bodyContent = bodyContent.replace("##copy_year##", copyYear);
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: customerDetails.email,
                                subject: "Your cart is waiting. Complete your order today.",
                                body: bodyContent
                            };
                            mailService.sendMailFromStore(sendData, function(err, response) {
                                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerDetails._id) },
                                { $set: { cart_recovery: false } }, function(err, response) { });
                                // if(!err && response) {
                                //     let mailResp = { status: 'send', updated_on: new Date() };
                                //     customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerDetails._id) },
                                //     { $set: { cart_recovery: false, mail_response: mailResp } }, function(err, response) { });
                                // }
                                // else {
                                //     let mailResp = { err: JSON.stringify(err), resp: JSON.stringify(response), updated_on: new Date() };
                                //     customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(customerDetails._id) },
                                //     { $set: { cart_recovery: false, mail_response: mailResp } }, function(err, response) { });
                                // }
                            });
                        });
                    });
                }
                resolve(true);
            }
            else { resolve(true); }
        });   
    });
}

async function abandonedStores(storeList) {
    for(let storeDetails of storeList)
    {
        await abandonedCustomers(storeDetails);
    }
}
/** cart recovery end **/

/** clear inactive orders **/
exports.clearInactiveOrders = function() {
    let clearDate = new Date().setDate(new Date().getDate() - 30);
    // restored sections
    restoredSection.deleteMany({ created_on: { $lte: new Date(clearDate) } }, function(err, response) { });
    // order list
    orderList.deleteMany({ status: "inactive", created_on: { $lte: new Date(clearDate) } }, function(err, response) { });
    // coupon codes
    couponList.deleteMany({ status: "inactive", created_on: { $lte: new Date(clearDate) } }, function(err, response) { });
    // donation list
    donationList.deleteMany({ status: "inactive", created_on: { $lte: new Date(clearDate) } }, function(err, response) { });
    // ys client payments
    ysOrders.deleteMany({ status: "inactive", created_on: { $lte: new Date(clearDate) } }, function(err, response) { });
    // delivery partner wallet payments
    dpWalletMgmt.deleteMany({ status: "inactive", created_on: { $lte: new Date(clearDate) } }, function(err, response) { });
    // invalid stores
    store.deleteMany({
        status: "inactive", temp_category: { $exists: true },
        "package_details.trial_expiry": { $exists: false }, created_on: { $lte: new Date(clearDate) }
    }, function(err, response) { });
    return true;
}

/** trial expiry **/
exports.trialExpiry = function() {

    let startDate = new Date().setHours(0,0,0,0);
    let endDate = new Date().setDate(new Date().getDate() + 4);
    endDate = new Date(endDate).setHours(23,59,59,999);
    store.find({
        status: 'active', account_type: 'client', "package_details.billing_status": false,
        "package_details.trial_expiry": { $gte: new Date(startDate), $lte: new Date(endDate) }
    }, function(err, response) {
        if(!err && response) {
            for(let storeDetails of response)
            {
                let diffDays = commonService.dateDiff(storeDetails.created_on, new Date());
                let dIndex = defaultSetup.daywise_discounts.findIndex(obj => obj.days==diffDays);
                if(dIndex!=-1) {
                    let discPercentage = defaultSetup.daywise_discounts[dIndex].discount;
                    let remainingDays = commonService.dateDiff(startDate, storeDetails.package_details.trial_expiry);
                    let expiryLeft = 'today';
                    if(remainingDays > 0) {
                        if(remainingDays > 1) { expiryLeft = remainingDays+" days" }
                        else { expiryLeft = remainingDays+" day" }
                    }
                    if(remainingDays===5) {
                        // trial discount mail
                        mailTemp.getYsMailTemplate('trial_discount').then((body) => {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##expiry_left##", expiryLeft);
                            bodyContent = bodyContent.replace("##disc_percentage##", discPercentage);
                            let sendData = {
                                config: setupConfig.ys_mail_config,
                                sendTo: storeDetails.email,
                                subject: "Select a plan now and get "+discPercentage+"% discount for "+storeDetails.name,
                                body: bodyContent,
                                cc_mail: setupConfig.ys_mail_config.notify_mail
                            };
                            if(storeDetails.mail_config.billing_mail) {
                                sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                            }
                            mailService.sendMailFromAdmin(sendData, function(err, response) { });
                        });
                    }
                    else if(remainingDays<=3) {
                        // trial expiry mail
                        mailTemp.getYsMailTemplate('trial_expiry').then((body) => {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##expiry_left##", expiryLeft);
                            bodyContent = bodyContent.replace("##disc_percentage##", discPercentage);
                            let sendData = {
                                config: setupConfig.ys_mail_config,
                                sendTo: storeDetails.email,
                                subject: "Trial ends in "+expiryLeft+" for "+storeDetails.name,
                                body: bodyContent,
                                cc_mail: setupConfig.ys_mail_config.notify_mail
                            };
                            if(storeDetails.mail_config.billing_mail) {
                                sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                            }
                            mailService.sendMailFromAdmin(sendData, function(err, response) { });
                        });
                    }
                }
            }
            return true;
        }
        else { return false; }
    });

}

/** plan expiry **/
exports.planExpiry = function() {

    let startDate = new Date().setHours(0,0,0,0);
    let endDate = new Date().setDate(new Date().getDate() + 4);
    endDate = new Date(endDate).setHours(23,59,59,999);
    store.aggregate([{
        $match : {
            status: 'active', account_type: 'client', "package_details.billing_status": true,
            "package_details.expiry_date": { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
    }], function(err, response) {
        if(!err && response) {
            for(let storeDetails of response)
            {
                let expiryLeft = 'today';
                let diffDays = commonService.dateDiff(startDate, storeDetails.package_details.expiry_date); 
                if(diffDays > 0) {
                    if(diffDays > 1) { expiryLeft = diffDays+" days" }
                    else { expiryLeft = diffDays+" day" }
                }
                // send mail
                mailTemp.getYsMailTemplate('plan_expiry').then((body) => {
                    let bodyContent = body;
                    bodyContent = bodyContent.replace("##expiry_left##", expiryLeft);
                    let sendData = {
                        config: setupConfig.ys_mail_config,
                        sendTo: storeDetails.email,
                        subject: "Plan expires in "+expiryLeft+" for "+storeDetails.name,
                        body: bodyContent,
                        cc_mail: setupConfig.ys_mail_config.notify_mail
                    };
                    if(storeDetails.mail_config.billing_mail) {
                        sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                    }
                    mailService.sendMailFromAdmin(sendData, function(err, response) { });
                });
            }
            return true;
        }
        else { return false; }
    });

}

/** account expired **/
exports.accountExpired = function(accountType) {

    let queryParams = {
        account_type: 'client', status: 'active', "package_details.billing_status": true, "package_details.expiry_date": { $lt: new Date() }
    };
    if(accountType=='trial') {
        queryParams = {
            account_type: 'client', status: 'active', "package_details.billing_status": false, "package_details.trial_expiry": { $lt: new Date() }
        };
    }
    store.aggregate([{ $match : queryParams }], function(err, response) {
        if(!err && response) {
            for(let storeDetails of response)
            {
                store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(storeDetails._id) },
                { $set: { status: 'inactive', session_key: new Date().valueOf() } }, function(err, response) {
                    if(!err && response) {
                        // send mail
                        if(accountType=='trial') {
                            mailTemp.getYsMailTemplate('trial_expired').then((body) => {
                                let bodyContent = body;
                                let sendData = {
                                    config: setupConfig.ys_mail_config,
                                    sendTo: storeDetails.email,
                                    subject: "Trial expired for "+storeDetails.name,
                                    body: bodyContent,
                                    cc_mail: setupConfig.ys_mail_config.notify_mail
                                };
                                if(storeDetails.mail_config.billing_mail) {
                                    sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                }
                                mailService.sendMailFromAdmin(sendData, function(err, response) { });
                            });
                        }
                        else {
                            mailTemp.getYsMailTemplate('plan_expired').then((body) => {
                                let bodyContent = body;
                                bodyContent = bodyContent.replace("##store_name##", storeDetails.name);
                                let sendData = {
                                    config: setupConfig.ys_mail_config,
                                    sendTo: storeDetails.email,
                                    subject: "Store paused. Re-activate "+storeDetails.name,
                                    body: bodyContent,
                                    cc_mail: setupConfig.ys_mail_config.notify_mail
                                };
                                if(storeDetails.mail_config.billing_mail) {
                                    sendData.cc_mail = sendData.cc_mail+", "+storeDetails.mail_config.billing_mail;
                                }
                                mailService.sendMailFromAdmin(sendData, function(err, response) { });
                            });
                        }
                    }
                });
            }
            return true;
        }
        else { return false; }
    });

}

/** educational mail **/
exports.educationalMail = function() {

    let emailList = [
        { file_name: "education/logo", subject: "Make your new logo in 30 Seconds!" },
        { file_name: "education/domain", subject: "Tips to choose the perfect domain name for your website" },
        { file_name: "education/product", subject: "Tricks in naming products to help you sell better" },
        { file_name: "education/payment", subject: "Setup free payment collection using UPI & Bank Transfer" },
        { file_name: "education/shipping", subject: "Ship your products easily across India" }
    ];
    let startDate = new Date().setHours(0,0,0,0);
    let endDate = new Date().setDate(new Date().getDate() - 5);
    endDate = new Date(endDate).setHours(0,0,0,0);
    store.find({ status: 'active', account_type: 'client', activated_on: { $gte: new Date(endDate), $lte: new Date(startDate) } },
    { activated_on: 1, email: 1 }, function(err, response) {
        if(!err && response) {
            for(let storeDetails of response)
            {
                let diffDays = commonService.dateDiff(storeDetails.activated_on, new Date())-1;
                if(diffDays > 0) {
                    mailTemp.getYsMailTemplate(emailList[diffDays-1].file_name).then((body) => {
                        let bodyContent = body;
                        let sendData = {
                            config: setupConfig.ys_mail_config,
                            sendTo: storeDetails.email,
                            subject: emailList[diffDays-1].subject,
                            body: bodyContent
                        };
                        mailService.sendMailFromAdmin(sendData, function(err, response) { });
                    });
                }
            }
            return true;
        }
        else { return false; }
    });

}