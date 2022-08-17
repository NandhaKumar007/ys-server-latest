"use strict";
const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = bcrypt.genSaltSync(10);
const store = require("../../models/store.model");
const vendor = require("../../models/vendor.model");
const shipping = require("../../models/shipping_methods.model");
const store_features = require("../../models/store_features.model");
const vendorFeatures = require("../../models/vendor_features.model");
const productFeatures = require("../../models/product_features.model");
const commonService = require("../../../services/common.service");
const imgUploadService = require("../../../services/img_upload.service");
const mailTemp = require('../../../config/mail-templates');
const setupConfig = require('../../../config/setup.config');
const mailService = require("../../../services/mail.service");
const payoutService = require("../../../services/payout.service");
const whService = require("../../../services/warehouse.service");
const vendorWalletMgmt = require('../../models/vendor_wallet_mgmt.model');
const createPayment = require("../../../services/create_payment.service");

exports.list = (req, res) => {
    if(req.query.id || req.vendor_id) {
        let vendorId = "";
        if(req.query.id) { vendorId = req.query.id; }
        if(req.vendor_id) { vendorId = req.vendor_id; }
        vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(vendorId), status: { $ne: 'deleted' } }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        vendor.find({ store_id: mongoose.Types.ObjectId(req.id), status: { $ne: 'deleted' } }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

exports.add = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    req.body.page_url = commonService.urlFormat(req.body.company_details.brand);
    vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), status: { $ne: 'deleted' }, $or: [ { email: req.body.email }, { page_url: req.body.page_url } ] }, function(err, response) {
        if(!err && !response)
        {
            store.aggregate([
                { $match: {  _id: mongoose.Types.ObjectId(req.id), status: "active" } },
                {
                    $lookup: {
                        from: "store_features",
                        localField: "_id",
                        foreignField: "store_id",
                        as: "features"
                    }
                }
            ], function(err, response) {
                if(!err && response[0]) {
                    let storeDetails = response[0];
                    let storeFeatures = storeDetails.features[0];
                    req.body.store_id = req.id;
                    req.body.status = 'active';
                    req.body.session_key = new Date().valueOf();
                    req.body.password = bcrypt.hashSync(req.body.password, saltRounds);
                    vendor.create(req.body, function(err, response) {
                        if(!err && response) {
                            let vendorDetails = response;
                            createVendorProperties(storeDetails, storeFeatures, vendorDetails, req.body.password).then((respData) => {
                                res.json(respData);
                            });
                        }
                        else { res.json({ status: false, error: err, message: "Unable to create account" }); }
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid Store" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Email or brand already exists" }); }
    });
}

exports.update = (req, res) => {
    if(req.vendor_id) { req.body._id = req.vendor_id; }
    if(req.body.change_key) { req.body.session_key = new Date().valueOf(); }
    if(req.body.image && req.body.img_change) {
        let rootPath = 'uploads/'+req.id+'/vendors';
        imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
            req.body.image = img;
            vendor.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
            { $set: { image: req.body.image } }, { new: true }, function(err, response) {
                if(!err && response) { res.json({ status: true, data: response }); }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        });
    }
    else {
        vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), page_url: req.body.page_url, status: { $ne: 'deleted' }, _id: { $ne: mongoose.Types.ObjectId(req.body._id) } }, function(err, response) {
            if(!err && !response)
            {
                vendor.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: req.body }, { new: true }, function(err, response) {
                    if(!err && response) {
                        let vendorDetails = response;
                        // warehouse
                        if(req.body.update_warehouse) {
                            store_features.findOne({ store_id: mongoose.Types.ObjectId(vendorDetails.store_id) }, { courier_partners: 1 }, function(err, response) {
                                if(!err && response) {
                                    let cpList = response.courier_partners;
                                    whService.create({ courier_partners: cpList, vendor_details: vendorDetails }, function(err, response) {
                                        if(!err && response) {
                                            if(req.body.form_type=='change_status') {
                                                payoutService.disableVendor(vendorDetails, function(err, response) {
                                                    if(!err && response) { res.json({ status: true, data: vendorDetails }); }
                                                    else { res.json({ status: false, error: err, message: response }); }
                                                });
                                            }
                                            else {
                                                payoutService.updateVendor({ vendor_details: vendorDetails, form_data: req.body }, function(err, response) {
                                                    if(!err && response) { res.json({ status: true, data: vendorDetails }); }
                                                    else { res.json({ status: false, error: err, message: response }); }
                                                });
                                            }
                                        }
                                        else { res.json({ status: false, error: err, message: response }); }
                                    });
                                }
                                else { res.json({ status: false, error: err, message: "failure" }); }
                            });
                        }
                        else {
                            if(req.body.form_type=='change_status') {
                                payoutService.disableVendor(vendorDetails, function(err, response) {
                                    if(!err && response) { res.json({ status: true, data: vendorDetails }); }
                                    else { res.json({ status: false, error: err, message: response }); }
                                });
                            }
                            else {
                                payoutService.updateVendor({ vendor_details: vendorDetails, form_data: req.body }, function(err, response) {
                                    if(!err && response) { res.json({ status: true, data: vendorDetails }); }
                                    else { res.json({ status: false, error: err, message: response }); }
                                });
                            }
                        }
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else { res.json({ status: false, error: err, message: "Brand already exists" }); }
        });
    }
}

exports.link_account = (req, res) => {
    vendor.findOne({
        store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id),
        payout_contact_id: { $exists: false }
    }, function(err, response) {
        if(!err && response) {
            payoutService.createVendor(response, function(err, response) {
                if(!err && response) { res.json({ status: true }); }
                else { res.json({ status: false, error: err, message: response }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid Vendor" }); }
    });
}

exports.hard_remove = (req, res) => {
    vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let vendorDetails = response;
            if(vendorDetails.password && vendorDetails.status!='declined') {
                vendor.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: { status: 'deleted', session_key: new Date().valueOf() } }, function(err, response) {
                    if(!err && response) {
                        shipping.deleteMany({ store_id: mongoose.Types.ObjectId(vendorDetails.store_id), vendor_id: mongoose.Types.ObjectId(vendorDetails._id) }, function(err, response) { });
                        vendorFeatures.deleteMany({ store_id: mongoose.Types.ObjectId(vendorDetails.store_id), _id: mongoose.Types.ObjectId(vendorDetails._id) }, function(err, response) { });
                        productFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { tag_list: 1 }, function(err, response) {
                            if(!err && response) {
                                let newTagList = [];
                                response.tag_list.forEach(el => {
                                    if(!el.vendor_list) { el.vendor_list = []; }
                                    let vtlIndex = el.vendor_list.findIndex(ven => ven.vendor_id.toString()==vendorDetails._id.toString());
                                    if(vtlIndex!=-1) { el.vendor_list.splice(vtlIndex, 1); }
                                    newTagList.push(el);
                                });
                                productFeatures.updateOne({ store_id: mongoose.Types.ObjectId(req.id) },
                                { $set: { tag_list: newTagList } }, function(err, response) {
                                    payoutService.disableVendor(vendorDetails, function(err, response) {
                                        if(!err && response) { res.json({ status: true }); }
                                        else { res.json({ status: false, error: err, message: response }); }
                                    });
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Unable to fetch product features" }); }
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else {
                vendor.deleteOne({ _id: mongoose.Types.ObjectId(vendorDetails._id) }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else { res.json({ status: false, error: err, message: "Invalid vendor" }); }
    });
}

exports.activation = (req, res) => {
    vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive", password: { $exists: false } }, function(err, response) {
        if(!err && response) {
            let vendorDetails = response;
            store.aggregate([
                { $match: {  _id: mongoose.Types.ObjectId(req.id), status: "active" } },
                {
                    $lookup: {
                        from: "store_features",
                        localField: "_id",
                        foreignField: "store_id",
                        as: "features"
                    }
                }
            ], function(err, response) {
                if(!err && response[0]) {
                    let storeDetails = response[0];
                    let storeFeatures = storeDetails.features[0];
                    if(req.body.type=='approve') {
                        let randomString = commonService.randomString(8);
                        let new_pwd = bcrypt.hashSync(randomString, saltRounds);
                        vendor.findOneAndUpdate({ _id: mongoose.Types.ObjectId(vendorDetails._id) },
                        { $set: { password: new_pwd, status: "active" } }, function(err, response) {
                            if(!err && response) {
                                createVendorProperties(storeDetails, storeFeatures, vendorDetails, randomString).then((respData) => {
                                    res.json(respData);
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                    else if(req.body.type=='decline') {
                        vendor.findOneAndUpdate({ _id: mongoose.Types.ObjectId(vendorDetails._id) },
                        { $set: { password: 'NA', status: "declined" } }, function(err, response) {
                            if(!err && response) {
                                mailTemp.vendor_account_rejection(storeDetails).then((body) => {
                                    let bodyContent = body;
                                    bodyContent = bodyContent.replace("##vendor_name##", vendorDetails.contact_person);
                                    let sendData = {
                                        store_name: storeDetails.name,
                                        config: mailConfig,
                                        sendTo: vendorDetails.email,
                                        subject: "Your vendor account is not approved",
                                        body: bodyContent,
                                        cc_mail: storeDetails.email
                                    };
                                    if(storeDetails.mail_config.vendor_enquiry_email) {
                                        sendData.cc_mail = storeDetails.mail_config.vendor_enquiry_email;
                                    }
                                    // send mail
                                    mailService.sendMailFromStore(sendData, function(err, response) {
                                        if(!err && response) { res.json({ status: true }); }
                                        else { res.json({ status: false, error: err, message: "Email send failed" }); }
                                    });
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                    else { res.json({ status: false, message: "Invalid type" }); }
                }
                else { res.json({ status: false, error: err, message: "Invalid Store" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid vendor" }); }
    });
}

exports.update_pwd = (req, res) => {
    let new_pwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
    vendor.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: { password: new_pwd, session_key: new Date().valueOf() } }, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.change_pwd = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id), status: 'active' }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            vendor.findOne({ _id: mongoose.Types.ObjectId(req.vendor_id), store_id: mongoose.Types.ObjectId(storeDetails._id), status: 'active' }, function(err, response) {
                if(!err && response) {
                    let vendorDetails = response;
                    response.comparePassword(req.body.current_pwd, async function(err, isMatch) {
                        if(!err && isMatch) {
                            let newPwd = bcrypt.hashSync(req.body.new_pwd, saltRounds);
                            let sessionKey = new Date().valueOf();
                            vendor.findOneAndUpdate({ _id: mongoose.Types.ObjectId(vendorDetails._id) },
                            { $set: { password: newPwd, session_key: sessionKey } }, function(err, response) {
                                if(!err) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Failure" }); }
                            });
                        }
                        else { res.json({ status: false, error: err, message: "Incorrect Password" }); }
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid user" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid Store" }); }
    });
}

function createVendorProperties(storeDetails, storeFeatures, vendorDetails, vendorPwd) {
    return new Promise((resolve, reject) => {
        shipping.deleteMany({ store_id: mongoose.Types.ObjectId(vendorDetails.store_id), vendor_id: mongoose.Types.ObjectId(vendorDetails._id) }, function(err, response) { });
        vendorFeatures.deleteMany({ store_id: mongoose.Types.ObjectId(vendorDetails.store_id), _id: mongoose.Types.ObjectId(vendorDetails._id) }, function(err, response) { });
        let shipType = vendorDetails.company_details.shipping_type;
        let shippingPriceConfig = { price: 100, free_above: 499 };
        if(storeDetails.additional_features.shipping_price_config) {
            shippingPriceConfig = storeDetails.additional_features.shipping_price_config;
        }
        // domestic shipping
        let domesShipInfo = {
            store_id: vendorDetails.store_id,
            vendor_id: vendorDetails._id,
            shipping_type: "Domestic",
            name: "Domestic Shipping",
            tracking_link: "-",
            delivery_time: "2 to 5 days",
            shipping_price: shippingPriceConfig.price
        };
        // international shipping
        let interShipInfo = {
            store_id: vendorDetails.store_id,
            vendor_id: vendorDetails._id,
            shipping_type: "International",
            name: "International Shipping",
            tracking_link: "-",
            delivery_time: "More than 5 days",
            shipping_price: shippingPriceConfig.price
        };
        // zone based
        if(storeFeatures.default_domes_zones.length) {
            domesShipInfo.price = 0;
            delete domesShipInfo.delivery_time;
            domesShipInfo.domes_zone_status = true;
            domesShipInfo.domes_zones = storeFeatures.default_domes_zones;
        }
        if(storeFeatures.default_inter_zones.length) {
            interShipInfo.price = 0;
            delete interShipInfo.delivery_time;
            interShipInfo.inter_zone_status = true;
            interShipInfo.inter_zones = storeFeatures.default_inter_zones;
        }
        if(shipType=='free') {
            domesShipInfo.shipping_price = 0;
            interShipInfo.shipping_price = 0;
        }
        else if(shipType=='free_above') {
            domesShipInfo.free_shipping = true;
            domesShipInfo.minimum_price = shippingPriceConfig.free_above;
            interShipInfo.free_shipping = true;
            interShipInfo.minimum_price = shippingPriceConfig.free_above;
        }
        // shipping methods
        shipping.insertMany([domesShipInfo, interShipInfo], function(err, response) {
            if(!err && response) {
                // vendor properties
                productFeatures.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id) }, function(err, response) {
                    if(!err && response) {
                        let prodFeatures = response;
                        let featuresData = {
                            _id: vendorDetails._id,
                            store_id: prodFeatures.store_id,
                            addon_list: prodFeatures.addon_list.filter(obj => obj.status=="active"),
                            measurement_set: prodFeatures.measurement_set.filter(obj => obj.status=="active"),
                            footnote_list: prodFeatures.footnote_list,
                            faq_list: prodFeatures.faq_list.filter(obj => obj.status=="active"),
                            size_chart: prodFeatures.size_chart.filter(obj => obj.status=="active")
                        };
                        let newTagList = [];
                        prodFeatures.tag_list.forEach(el => {
                            if(!el.vendor_list) { el.vendor_list = []; }
                            if(el.status=='active') {
                                let vtlIndex = el.vendor_list.findIndex(ven => ven.vendor_id.toString()==vendorDetails._id.toString());
                                if(vtlIndex!=-1) { el.vendor_list.splice(vtlIndex, 1); }
                                el.vendor_list.push({ vendor_id: vendorDetails._id, option_list: el.option_list });
                            }
                            newTagList.push(el);
                        });
                        vendorFeatures.create(featuresData, function(err, response) {
                            if(!err && response) {
                                productFeatures.updateOne({ store_id: mongoose.Types.ObjectId(storeDetails._id) },
                                { $set: { tag_list: newTagList } }, function(err, response) {
                                    if(!err) {
                                        let mailConfig = setupConfig.mail_config;
                                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                        mailTemp.vendor_account_activation(storeDetails).then((body) => {
                                            let bodyContent = body;
                                            bodyContent = bodyContent.replace("##vendor_name##", vendorDetails.contact_person);
                                            bodyContent = bodyContent.replace("##store_cp_name##", storeDetails.company_details.contact_person);
                                            bodyContent = bodyContent.replace("##login_id##", vendorDetails.email);
                                            bodyContent = bodyContent.replace("##password##", vendorPwd);
                                            let sendData = {
                                                store_name: storeDetails.name,
                                                config: mailConfig,
                                                sendTo: vendorDetails.email,
                                                subject: "Your vendor account has been activated",
                                                body: bodyContent,
                                                cc_mail: storeDetails.email
                                            };
                                            if(storeDetails.mail_config.vendor_enquiry_email) {
                                                sendData.cc_mail = storeDetails.mail_config.vendor_enquiry_email;
                                            }
                                            // payout
                                            payoutService.createVendor(vendorDetails, function(err, response) {
                                                if(!err && response) {
                                                    // warehouse
                                                    whService.create({ courier_partners: storeFeatures.courier_partners, vendor_details: vendorDetails }, function(err, response) {
                                                        if(!err && response) {
                                                            // send mail
                                                            mailService.sendMailFromStore(sendData, function(err, response) {
                                                                if(!err && response) { resolve({ status: true }); }
                                                                else { resolve({ status: false, error: err, message: "Email send failed" }); }
                                                            });
                                                        }
                                                        else { resolve({ status: false, error: err, message: response }); }
                                                    });
                                                }
                                                else { resolve({ status: false, error: err, message: response }); }
                                            });
                                        });
                                    }
                                    else { resolve({ status: false, error: err, message: "Unable to create vendor product tags" }); }
                                });
                            }
                            else { resolve({ status: false, error: err, message: "Unable to create vendor features" }); }
                        });
                    }
                    else { resolve({ status: false, error: err, message: "Unable to fetch product features" }); }
                });
            }
            else { resolve({ status: false, error: err, message: "Unable to create shipping method" }); }
        });
    });
}

// vendor wallet top-up
exports.vendor_wallet_stmt = (req, res) => {
    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
    vendor.findOne({ _id: mongoose.Types.ObjectId(req.vendor_id) }, function(err, response) {
        if(!err && response) {
            let balance = 0;
            if(response.wallet_balance) {
                balance = response.wallet_balance;
            }
            vendorWalletMgmt.find({ store_id: mongoose.Types.ObjectId(req.id), status: 'active', created_on: { $gte: new Date(fromDate), $lt: new Date(toDate) } }, function(err, response) {
                if(!err && response) { res.json({ status: true, list: response, balance: balance }); }
                else { res.json({ status: true, list: [], balance: balance }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.vendor_wallet_topup= (req, res)=>{
    req.body.store_id = req.id;
    req.body.order_number = commonService.orderNumber();
    if(req.body.order_info === 'Top Up'){
        req.body.order_type = 'credit';
        vendorWalletMgmt.create(req.body, function(err, response){
            if(!err && response){
                let orderDetails = response;
                // create payment
                if(orderDetails.payment_details.name=="Razorpay")
                {
                    createPayment.createRazorpayForVendor(orderDetails, function(err, response) {
                        if(!err && response) {
                            res.json({ status: true, data: response });
                        }
                        else {
                            res.json({ status: false, error: err, message: response });
                        }
                    });
                }else{
                    res.json({status: false, error: err, message: 'Invalid payment method'})
                }
            }else{ res.json({status: false, error: err, message: 'Unable to place order'}) }
        });
    }else{ res.json({status: false, error: err, message: 'Unable to place order'}) }
   
}