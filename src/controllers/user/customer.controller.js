"use strict";
const mongoose = require('mongoose');
const request = require('request');
const urlencode = require('urlencode');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);
const store = require("../../models/store.model");
const product = require("../../models/product.model");
const customer = require("../../models/customer.model");
const feedback = require("../../models/feedback.model");
const commonService = require("../../../services/common.service");
const validationService = require("../../../services/validation.service");

exports.details = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.update = (req, res) => {
    delete req.body.store_id; delete req.body.email; delete req.body.password;
    delete req.body.unique_id; delete req.body.session_key; delete req.body.status;
    delete req.body.model_list; delete req.body.address_list;
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    if(req.body.cart_list && req.body.cart_list.length)
    {
        customer.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.id) } },
            {
                $lookup: {
                    from: "store_permissions",
                    localField: "store_id",
                    foreignField: "store_id",
                    as: "storeProperties"
                }
            }
        ], function(err, response) {
            if(!err && response[0]) {
                let customerDetails = response[0];
                let qtyInfo = customerDetails.storeProperties[0].application_setting.min_qty;
                validationService.processCartList(customerDetails.store_id, qtyInfo, req.body.cart_list).then((updatedCartList) => {
                    req.body.cart_list = updatedCartList;
                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                    { $set: req.body }, { new: true }, function(err, response) {
                        if(!err && response) {
                            res.json({ status: true, data: response });
                        }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else { res.json({ status: false, message: "Invalid user" }); }
        });
    }
    else {
        customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
        { $set: req.body }, { new: true }, function(err, response) {
            if(!err && response) {
                res.json({ status: true, data: response });
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}

exports.update_mobile = (req, res) => {
    if(req.body.mobile) { req.body.mobile = req.body.mobile.trim(); }
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            customer.findOne({
                store_id: mongoose.Types.ObjectId(customerData.store_id), mobile: req.body.mobile, _id: { $ne: mongoose.Types.ObjectId(customerData._id) }
            }, function(err, response) {
                if(!err && response) {
                    res.json({ status: false, message: "Mobile already exists" });
                }
                else {
                    let updateData = { mobile: req.body.mobile };
                    if(req.body.dial_code) { updateData.dial_code = req.body.dial_code; }
                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                    { $set: updateData }, { new: true }, function(err, response) {
                        if(!err && response) {
                            res.json({ status: true, data: response });
                        }
                        else {
                            res.json({ status: false, error: err, message: "Failure" });
                        }
                    });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

exports.change_pwd = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response) {
            response.comparePassword(req.body.current_pwd, async function(err, isMatch) {
                if(!err && isMatch) {
                    let sessionKey = new Date().valueOf();
                    let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
                    customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                    { $set: { password: newPwd, session_key: sessionKey } }, function(err, response) {
                        if(!err) {
                            res.json({ status: true });
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

exports.feedback = (req, res) => {
    req.body.customer_id = req.id;
    feedback.create(req.body, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
};

// OTP
exports.generate_otp = (req, res) => {
    if(req.body.mobile) { req.body.mobile = req.body.mobile.trim(); }
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            customer.findOne({
                store_id: mongoose.Types.ObjectId(customerData.store_id), mobile: req.body.mobile, _id: { $ne: mongoose.Types.ObjectId(customerData._id) }
            }, function(err, response) {
                if(!err && response) {
                    res.json({ status: false, message: "Mobile already exists" });
                }
                else {
                    store.findOne({ _id: mongoose.Types.ObjectId(customerData.store_id) }, function(err, response) {
                        if(!err && response) {
                            let storeDetails = response;
                            let otpData = {otp: Math.floor(100000+Math.random()*999999), otp_request_on: new Date() };
                            customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) }, { $set: otpData }, function(err, response) {
                                if(!err && response) {
                                    let smsConfig = storeDetails.sms_config;
                                    if(smsConfig && smsConfig.provider=='24x7SMS') {
                                        let mobileNo = req.body.dial_code+req.body.mobile;
                                        let msgContent = smsConfig.msg_content.replace(/#OTP#/g, otpData.otp);
                                        let smsOptions = {
                                            method: 'get',
                                            url: 'https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY='+smsConfig.api_key+'&MobileNo='+mobileNo+'&SenderID='+smsConfig.sender_id+'&Message='+urlencode(msgContent)+'&ServiceName='+smsConfig.service_name+'&DLTTemplateID='+smsConfig.template_id,
                                        };
                                        request(smsOptions, function (err, response) {
                                            if(!err && response.statusCode == 200) {
                                                if(response.body.indexOf('success')!=-1) {
                                                    res.json({ status: true });
                                                }
                                                else { res.json({ status: false, error: response.body, message: "Unable to send SMS" }); }
                                            }
                                            else { res.json({ status: false, error: err, message: "SMS gateway error" }); }
                                        });
                                    }
                                    else {
                                        res.json({ status: false, message: "Invalid SMS provider" });
                                    }
                                }
                                else {
                                    res.json({ status: false, error: err, message: "Update failure" });
                                }
                            });
                        }
                        else {
                            res.json({ status: false, error: err, message: "Invalid Store" });
                        }
                    });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}

exports.validate_otp = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id), otp: req.body.otp }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            // duration validation 15 minutes
            let timeStamp = ((customerData.otp_request_on).getTime() + (15*60000));
            let currentTime = new Date().valueOf();
            if(timeStamp > currentTime) { res.json({ status: true }); }
            else { res.json({ status: false, message: "OTP was expired" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid OTP" }); }
    });
}

// update wish list
exports.update_wish_list = (req, res) => {
    customer.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let itemIds = [];
            response.wish_list.forEach(el => { itemIds.push(el.product_id); });
            processWishList(response.wish_list, response.store_id, itemIds).then((updatedWishList) => {
                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.id) },
                { $set: { wish_list: updatedWishList } }, { new: true }, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, data: response });
                    }
                    else {
                        res.json({ status: false, error: err, message: "Failure" });
                    }
                });
            });
        } else {
            res.json({ status: false, message: "Invalid store" });
        }
    });
}

function processWishList(wishList, storeId, itemIds) {
    return new Promise((resolve, reject) => {
        let updatedWishList = [];
        product.find({ store_id: mongoose.Types.ObjectId(storeId), _id: { $in: itemIds }, status: "active", archive_status: false }, function(err, response) {
            if(!err && response) {
                let dbProductList = response;
                for(let productDetails of wishList)
                {
                    let pIndex = dbProductList.findIndex(obj => obj._id.toString()==productDetails.product_id.toString());
                    if(pIndex!=-1) {
                        let item = dbProductList[pIndex];
                        productDetails.sku = item.sku;
                        productDetails.name = item.name;
                        productDetails.selling_price = item.selling_price;
                        productDetails.disc_status = item.disc_status;
                        productDetails.disc_percentage = item.disc_percentage;
                        productDetails.discounted_price = item.discounted_price;
                        productDetails.image = item.image_list[0].image;
                        productDetails.seo_status = item.seo_status;
                        productDetails.seo_details = item.seo_details;
                        if(item.hsn_code) { productDetails.hsn_code = item.hsn_code; }
                        updatedWishList.push(productDetails);
                    }
                }
                resolve(updatedWishList);
            }
            else { resolve(updatedWishList); }
        });
    });
}