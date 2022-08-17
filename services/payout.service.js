const mongoose = require('mongoose');
const request = require('request');
const vendor = require("../src/models/vendor.model");
const store = require("../src/models/store.model");

exports.createVendor = function(vendorData, callback) {

    store.findOne({
        _id: mongoose.Types.ObjectId(vendorData.store_id), "payout_gateway.status": "active"
    }, { payout_gateway: 1 }, function(err, response) {
        if(!err && response) {
            if(response.payout_gateway.name=='Razorpay') {
                // create contact
                razorpayContact(response.payout_gateway.config, vendorData).then((contactId) => {
                    // create account
                    vendorData.payout_contact_id = contactId;
                    razorpayAccount(response.payout_gateway.config, vendorData).then((accountId) => {
                        vendor.findByIdAndUpdate(vendorData._id, { $set: { payout_contact_id: contactId, "bank_details.payout_account_id": accountId } }, function(err, response) {
                            if(!err && response) { callback(false, true); }
                            else { callback(err, "payout update error"); }
                        });
                    }).catch((errData) => {
                        vendor.findByIdAndUpdate(vendorData._id, { $set: { payout_contact_id: contactId } }, function(err, response) {
                            callback(errData.error, errData.msg);
                        });
                    });
                }).catch((errData) => {
                    callback(errData.error, errData.msg);
                });
            }
            else { callback(true, "Invalid payment method"); }
        }
        else { callback(false, true); }
    });

}

exports.updateVendor = function(jsonData, callback) {
    
    let formData = jsonData.form_data;
    let vendorData = jsonData.vendor_details;
    store.findOne({
        _id: mongoose.Types.ObjectId(vendorData.store_id), "payout_gateway.status": "active"
    }, { payout_gateway: 1 }, function(err, response) {
        if(!err && response) {
            if(response.payout_gateway.name=='Razorpay') {
                // update contact
                if(formData.update_contact) {
                    razorpayContact(response.payout_gateway.config, vendorData).then(() => {
                        // update account
                        if(formData.update_bank) {
                            razorpayAccount(response.payout_gateway.config, vendorData).then((accountId) => {
                                vendor.findByIdAndUpdate(vendorData._id, { $set: { "bank_details.payout_account_id": accountId } }, function(err, response) {
                                    if(!err && response) { callback(false, true); }
                                    else { callback(err, "accountId update error"); }
                                });
                            }).catch((errData) => {
                                callback(errData.error, errData.msg);
                            });
                        }
                        else { callback(false, true); }
                    }).catch((errData) => {
                        callback(errData.error, errData.msg);
                    });
                }
                else if(formData.update_bank) {
                    razorpayAccount(response.payout_gateway.config, vendorData).then((accountId) => {
                        vendor.findByIdAndUpdate(vendorData._id, { $set: { "bank_details.payout_account_id": accountId } }, function(err, response) {
                            if(!err && response) { callback(false, true); }
                            else { callback(err, "accountId update error"); }
                        });
                    }).catch((errData) => {
                        callback(errData.error, errData.msg);
                    });
                }
                else { callback(false, true); }
            }
            else { callback(true, "Invalid payment method"); }
        }
        else { callback(false, true); }
    });

}

exports.disableVendor = function(vendorData, callback) {

    if(vendorData.payout_contact_id) {
        let vendorStatus = false;
        if(vendorData.status=='active') { vendorStatus = true; }
        store.findOne({
            _id: mongoose.Types.ObjectId(vendorData.store_id), "payout_gateway.status": "active"
        }, { payout_gateway: 1 }, function(err, response) {
            if(!err && response) {
                if(response.payout_gateway.name=='Razorpay') {
                    let pConfig = response.payout_gateway.config;
                    let auth = new Buffer.from(pConfig.key_id+':'+pConfig.key_secret).toString('base64');
                    let options = {
                        method: "PATCH", url: "https://api.razorpay.com/v1/contacts/"+vendorData.payout_contact_id,
                        headers: { Authorization: 'Basic '+auth, 'Content-Type': 'application/json' },
                        body: { active: vendorStatus }, json: true
                    };
                    request(options, function (err, response, body) {
                        let respData = response.body;
                        if(!err && !respData.error) { callback(false, true); }
                        else { callback(respData.error, "Unable to disable contact"); }
                    });
                }
                else { callback(true, "Invalid payment method"); }
            }
            else { callback(false, true); }
        });
    }
    else { callback(false, true); }

}

function razorpayContact(paymentConfig, vendorData) {
    return new Promise((resolve, reject) => {
        let methodType = "POST";
        let paymentUrl = "https://api.razorpay.com/v1/contacts";
        if(vendorData.payout_contact_id) {
            methodType = "PATCH";
            paymentUrl = "https://api.razorpay.com/v1/contacts/"+vendorData.payout_contact_id;
        }
        let formData = {
            name: vendorData.contact_person, email: vendorData.email,
            contact : vendorData.mobile, type: "vendor"
        };
        let auth = new Buffer.from(paymentConfig.key_id+':'+paymentConfig.key_secret).toString('base64');
        let options = {
            method: methodType, url: paymentUrl,
            headers: { Authorization: 'Basic '+auth, 'Content-Type': 'application/json' },
            body: formData, json: true
        };
        request(options, function (err, response, body) {
            let respData = response.body;
            if(!err && !respData.error) { resolve(respData.id); }
            else { reject({ error: respData.error, msg: "Unable to create contact" }); }
        });
    });
}

function razorpayAccount(paymentConfig, vendorData) {
    return new Promise((resolve, reject) => {
        let bankDetails = vendorData.bank_details;
        let auth = new Buffer.from(paymentConfig.key_id+':'+paymentConfig.key_secret).toString('base64');
        let formData = {
            contact_id: vendorData.payout_contact_id, account_type: "bank_account",
            bank_account: { name: bankDetails.beneficiary, ifsc: bankDetails.ifsc_code, account_number: bankDetails.acc_no }
        };
        let addOptions = {
            method: 'POST', url: "https://api.razorpay.com/v1/fund_accounts",
            headers: { Authorization: 'Basic '+auth, 'Content-Type': 'application/json' },
            body: formData, json: true
        };
        if(bankDetails.payout_account_id) {
            let options = {
                method: 'PATCH', url: "https://api.razorpay.com/v1/fund_accounts/"+bankDetails.payout_account_id,
                headers: { Authorization: 'Basic '+auth, 'Content-Type': 'application/json' },
                body: { active: false }, json: true
            };
            request(options, function (err, response, body) {
                let respData = response.body;
                if(!err && !respData.error) {
                    request(addOptions, function (err, response, body) {
                        let respData = response.body;
                        if(!err && !respData.error) { resolve(respData.id); }
                        else { reject({ error: respData.error, msg: "Unable to create account" }); }
                    });
                }
                else { reject({ error: respData.error, msg: "Unable to deactivate account" }); }
            });
        }
        else {
            request(addOptions, function (err, response, body) {
                let respData = response.body;
                if(!err && !respData.error) { resolve(respData.id); }
                else { reject({ error: respData.error, msg: "Unable to create account" }); }
            });
        }
    });
}