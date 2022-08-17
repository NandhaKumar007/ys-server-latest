"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const admin = require("../../models/admin.model");
const vendor = require("../../models/vendor.model");
const coupon = require("../../models/coupon_codes.model");
const orderList = require("../../models/order_list.model");
const storeFeatures = require("../../models/store_features.model");
const commonService = require("../../../services/common.service");
const storeService = require("../../../services/store.service");
const setupConfig = require('../../../config/setup.config');
const defaultSetup = require('../../../config/default.setup');
const mailTemp = require('../../../config/mail-templates');
const mailService = require("../../../services/mail.service");

exports.create_store = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    if(req.body.name) { req.body.name = req.body.name.trim(); }
    req.body.package_details = { package_id: setupConfig.free_plan };
    if(req.body.type && !setupConfig.base_plans[req.body.type]) { req.body.type = "order_based"; }
    if(!req.body.type) { req.body.type = "order_based"; }
    let serviceType = 'Genie';
    if(req.body.ys_category && req.body.ys_category=='pro') {
        let serviceList = {
            order_based: "B2C", quot_based: "B2B",
            service_based: "Service", multi_vendor: "Multi-Vendor"
        };
        serviceType = serviceList[req.body.type];
        req.body.package_details = { package_id: setupConfig.base_plans[req.body.type] };
    }
    store.find({}, { email: 1, sub_domain: 1 }, function(err, response) {
        if(!err && response) {
            let sIndex = response.findIndex(obj => obj.email==req.body.email);
            if(sIndex==-1) {
                // get existing sub-domain list
                let subDomainList = [];
                response.forEach(obj => {
                    if(obj.sub_domain) { subDomainList.push(obj.sub_domain); }
                });
                storeFeatures.findOne({ "sub_users.email": req.body.email }, function(err, response) {
                    if(!err && !response) {
                        // get category details
                        admin.findOne({}, function(err, response) {
                            if(!err && response) {
                                let catIndex = response.categories.findIndex(obj => obj.name==req.body.category && obj.status=='active');
                                if(catIndex!=-1)
                                {
                                    // sub domain
                                    let storeName = commonService.urlFormat(req.body.name);
                                    getDomainName(storeName, subDomainList).then((domainName) => {
                                        if(domainName) {
                                            req.body.sub_domain = domainName;
                                            req.body.base_url = setupConfig.sub_domain_base+req.body.sub_domain;
                                            // default currency
                                            if(req.body.currency_types) {
                                                req.body.currency_types.default_currency = true;
                                                req.body.currency_types = [req.body.currency_types];
                                            }
                                            req.body.status = "inactive";
                                            req.body.account_type = "client";
                                            req.body.session_key = new Date().valueOf();
                                            req.body.temp_category = req.body.category;
                                            req.body.temp_token = commonService.randomString(4)+new Date().valueOf()+commonService.randomString(4);
                                            req.body.seo_details = { page_title: req.body.name, meta_desc: req.body.description };
                                            let newStore = new store(req.body);
                                            // create store
                                            newStore.save(function(err, response) {
                                                if(!err && response) {
                                                    let storeDetails = response;
                                                    // send activation link
                                                    let activationLink = setupConfig.api_base+"others/store_activation?id="+storeDetails._id+"&token="+storeDetails.temp_token;
                                                    mailTemp.getYsMailTemplate('store_signup').then((body) => {
                                                        let bodyContent = body;
                                                        bodyContent = bodyContent.replace("##store_name##", storeDetails.name);
                                                        bodyContent = bodyContent.replace("##activation_link##", activationLink);
                                                        let sendData = {
                                                            config: setupConfig.ys_mail_config,
                                                            sendTo: storeDetails.email,
                                                            subject: "Activation for "+storeDetails.name,
                                                            body: bodyContent
                                                        };
                                                        mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                            // signup enquiry
                                                            mailTemp.getYsMailTemplate('signup_enquiry').then((body) => {
                                                                let bodyContent = body;
                                                                bodyContent = bodyContent.replace("##store_name##", storeDetails.name);
                                                                bodyContent = bodyContent.replace("##contact_person##", storeDetails.company_details.contact_person);
                                                                bodyContent = bodyContent.replace("##mobile##", storeDetails.company_details.dial_code+' '+storeDetails.company_details.mobile);
                                                                bodyContent = bodyContent.replace("##email##", storeDetails.email);
                                                                bodyContent = bodyContent.replace("##service_type##", serviceType);
                                                                bodyContent = bodyContent.replace("##category##", storeDetails.temp_category);
                                                                bodyContent = bodyContent.replace("##city##", storeDetails.company_details.city);
                                                                bodyContent = bodyContent.replace("##state##", storeDetails.company_details.state);
                                                                bodyContent = bodyContent.replace("##country##", storeDetails.country);
                                                                let nsSubject = "New Signup - "+serviceType;
                                                                if(req.body.query_params) {
                                                                    let qp = req.body.query_params;
                                                                    if(qp.t) { nsSubject += ' - '+qp.t }
                                                                    if(qp.p) { nsSubject += ' - '+qp.p }
                                                                    if(qp.v) { nsSubject += ' - '+qp.v }
                                                                    if(qp.s) { nsSubject += ' - '+qp.s }
                                                                    if(qp.b) { nsSubject += ' - '+qp.b }
                                                                }
                                                                let sendData = {
                                                                    config: setupConfig.ys_mail_config,
                                                                    sendTo: setupConfig.ys_mail_config.pre_sales_mail,
                                                                    subject: nsSubject,
                                                                    body: bodyContent
                                                                };
                                                                if(serviceType=='Genie') {
                                                                    sendData.sendTo = setupConfig.ys_mail_config.genie_sales_mail;
                                                                }
                                                                mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                    res.json({ status: true });
                                                                });
                                                            });
                                                        });
                                                    });
                                                }
                                                else { res.json({ status: false, error: err, message: "Unable to register" }); }
                                            });
                                        }
                                        else { res.json({ status: false, message: "Unable to create sub-domain" }); }
                                    });
                                }
                                else { res.json({ status: false, message: "Invalid category" }); }
                            }
                            else { res.json({ status: false, error: err, message: "Invalid user" }); }
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Email already exists" }); }
                });
            }
            else { res.json({ status: false, message: "Email already exists" }); }
        }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.store_activation = (req, res) => {
    if(req.query.id && mongoose.Types.ObjectId.isValid(req.query.id) && req.query.token) {
        store.findOne({
            _id: mongoose.Types.ObjectId(req.query.id), temp_token: { $ne: null }, status: "inactive",
            temp_token: req.query.token, "package_details.trial_expiry": { $exists: false }
        }, function(err, response) {
            if(!err && response) {
                let storeDetails = JSON.stringify(response);
                storeDetails = JSON.parse(storeDetails);
                admin.findOne({}, function(err, response) {
                    if(!err && response) {
                        let adminDetails = response;
                        // get category details
                        let catIndex = adminDetails.categories.findIndex(obj => obj.name==storeDetails.temp_category && obj.status=='active');
                        if(catIndex!=-1)
                        {
                            let catInfo = adminDetails.categories[catIndex];
                            // get template id
                            storeDetails.templateId = catInfo.next_template;
                            let nxtTemplateId = storeDetails.templateId + 1;
                            if(nxtTemplateId > adminDetails.total_templates) { nxtTemplateId = 1; }
                            // get content id
                            storeDetails.contentId = catInfo.next_content;
                            let nextContentId = storeDetails.contentId + 1;
                            if(nextContentId > adminDetails.total_contents) { nextContentId = 1; }
                            // get category image group id
                            storeDetails.categorySetId = catInfo.next_group_id;
                            let nxtCatGrpId = storeDetails.categorySetId + 1;
                            if(nxtCatGrpId > catInfo.product_groups.length) { nxtCatGrpId = 1; }
                            // get category image set
                            storeDetails.categoryImages = [1,2,3];
                            let prodGrpIndex = catInfo.product_groups.findIndex(obj => obj.id==storeDetails.categorySetId);
                            if(prodGrpIndex!=-1) {
                                storeDetails.categoryImages = catInfo.product_groups[prodGrpIndex].next_image_set;
                                let nxtImageSet = [1,2,3];
                                if(storeDetails.categoryImages[0]==1) { nxtImageSet = [3,1,2]; }
                                if(storeDetails.categoryImages[0]==3) { nxtImageSet = [2,3,1]; }
                                catInfo.product_groups[prodGrpIndex].next_image_set = nxtImageSet;
                            }
                            admin.findOneAndUpdate({  _id: mongoose.Types.ObjectId(adminDetails._id), "categories.name": storeDetails.temp_category },
                            { $set: {
                                "categories.$.next_template": nxtTemplateId, "categories.$.next_content": nextContentId,
                                "categories.$.next_group_id": nxtCatGrpId, "categories.$.product_groups": catInfo.product_groups
                            } }, function() { });
                            let appSetting = {};
                            // update store info
                            let trialExpDate = new Date().setDate(new Date().getDate() + 6);
                            trialExpDate = new Date(trialExpDate).setHours(23,59,59,999);
                            let updateData = { "package_details.trial_expiry": trialExpDate, status: "active", activated_on: new Date() };
                            updateData.payment_types = [
                                {
                                    name: "Gpay", btn_name: "Pay With Google Pay", rank: 1, status: "inactive",
                                    app_config: { merchant_name: storeDetails.name, merchant_code: catInfo.code }
                                },
                                {
                                    name: "COD", btn_name: "Cash on Delivery", rank: 2, status: "inactive",
                                    cod_config: { cod_charges: 0, max_amount: 0, sms_status: false }
                                }
                            ];
                            let storeCatDetails = defaultSetup.getStoreCatInfo(storeDetails, storeDetails.temp_category, storeDetails.templateId-1, storeDetails.contentId-1);
                            if(storeCatDetails) {
                                updateData['seo_details.page_title'] = storeCatDetails.site_title;
                                appSetting = {
                                    announcebar_status: true, announcebar_config: { content: storeCatDetails.announcement }
                                };
                            }
                            store.findByIdAndUpdate(storeDetails._id, {
                                $set: updateData, $unset: { temp_token: "", temp_category: "" }
                            }, function(err, response) {
                                if(!err) {
                                    storeService.activateStore(storeDetails, appSetting).then(() => {
                                        res.writeHead(301, { Location: setupConfig.store_login_base });
                                        res.end();
                                    }).catch((errData) => { res.send(errData); });
                                }
                                else { res.send("Unable to activate your account. Please contact yourstore team."); }
                            });
                        }
                        else { res.send("Your store category doesn't exists. Please contact yourstore team."); }
                    }
                    else { res.send("Unable to process your request. Please contact yourstore team."); }
                });
            }
            else { res.send("Invalid user"); }
        });
    }
    else { res.send("Invalid data"); }
}

exports.order_details = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.params.store_id) && mongoose.Types.ObjectId.isValid(req.params.order_id))
    {
        if(req.params.type=='order')
        {
            orderList.findOne({
                _id: mongoose.Types.ObjectId(req.params.order_id), store_id: mongoose.Types.ObjectId(req.params.store_id)
            }, function(err, response) {
                if(!err && response) {
                    if(req.query.vendor_id) {
                        let respData = { status: true, data: response };
                        vendor.findOne({ _id: mongoose.Types.ObjectId(req.query.vendor_id), store_id: mongoose.Types.ObjectId(req.params.store_id) }, function(err, response) {
                            if(!err && response) { respData.vendor_info = response; }
                            res.json(respData);
                        });
                    }
                    else { res.json({ status: true, data: response }); }
                }
                else {
                    res.json({ status: false, error: err, message: "Invalid order" });
                }
            });
        }
        else if(req.params.type=='coupon')
        {
            coupon.findOne({
                _id: mongoose.Types.ObjectId(req.params.order_id), store_id: mongoose.Types.ObjectId(req.params.store_id)
            }, { code: 0 }, function(err, response) {
                if(!err && response) {
                    res.json({ status: true, data: response });
                } else {
                    res.json({ status: false, message: "Invalid order" });
                }
            });
        }
        else { res.json({ status: false, message: "Invalid order type" }); }
    }
    else { res.json({ status: false, message: "Invalid request" }); }
}

exports.vendor_signup = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    store.findOne({ _id: mongoose.Types.ObjectId(req.body.store_id), status: "active" }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            vendor.find({ store_id: mongoose.Types.ObjectId(req.body.store_id) }, { page_url: 1, email: 1 }, function(err, response) {
                if(!err && response) {
                    if(response.findIndex(el => el.email==req.body.email) == -1) {
                        let vendorLinks = [];
                        response.forEach(obj => {
                            if(obj.page_url) { vendorLinks.push(obj.page_url); }
                        });
                        let brandName = commonService.urlFormat(req.body.company_details.brand);
                        getDomainName(brandName, vendorLinks).then((pageUrl) => {
                            if(pageUrl) {
                                req.body.page_url = pageUrl;
                                req.body.status = 'inactive';
                                req.body.session_key = new Date().valueOf();
                                vendor.create(req.body, function(err, response) {
                                    if(!err && response) {
                                        let mailConfig = setupConfig.mail_config;
                                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                        mailTemp.vendor_account_creation(storeDetails).then((body) => {
                                            let bodyContent = body;
                                            bodyContent = bodyContent.replace("##vendor_name##", req.body.contact_person);
                                            let sendData = {
                                                store_name: storeDetails.name,
                                                config: mailConfig,
                                                sendTo: req.body.email,
                                                subject: "We have received your request for vendor registration",
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
                                    else { res.json({ status: false, error: err, message: "Unable to create account" }); }
                                });
                            }
                            else { res.json({ status: false, message: "Unable to create link" }); }
                        });
                    }
                    else { res.json({ status: false, error: err, message: "Email already exists" }); }
                }
                else { res.json({ status: false, error: err, message: "Failure" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid Store" }); }
    });
}

function getDomNameCont(domain, existingDomains, concatNumber) {
    let domainPosibilityList = [];
    if(concatNumber > 0) {
        domainPosibilityList = [
            { name: 'shop-'+domain+'-'+concatNumber },
            { name: 'store-'+domain+'-'+concatNumber },
            { name: 'the-'+domain+'-'+concatNumber },
            { name: 'online-'+domain+'-'+concatNumber },
            { name: 'buy-'+domain+'-'+concatNumber },
            { name: domain+'-shop'+'-'+concatNumber },
            { name: domain+'-store'+'-'+concatNumber },
            { name: domain+'-online'+'-'+concatNumber },
            { name: 'shop-'+domain+'-store'+'-'+concatNumber },
            { name: 'shop-'+domain+'-online'+'-'+concatNumber },
            { name: 'store-'+domain+'-shop'+'-'+concatNumber },
            { name: 'store-'+domain+'-online'+'-'+concatNumber },
            { name: 'the-'+domain+'-shop'+'-'+concatNumber },
            { name: 'the-'+domain+'-store'+'-'+concatNumber },
            { name: 'the-'+domain+'-online'+'-'+concatNumber },
            { name: 'online-'+domain+'-shop'+'-'+concatNumber },
            { name: 'online-'+domain+'-store'+'-'+concatNumber },
            { name: 'buy-'+domain+'-shop'+'-'+concatNumber },
            { name: 'buy-'+domain+'-store'+'-'+concatNumber },
            { name: 'buy-'+domain+'-online'+'-'+concatNumber }
        ];
    }
    else {
        domainPosibilityList = [
            { name: domain },
            { name: 'shop-'+domain },
            { name: 'store-'+domain },
            { name: 'the-'+domain },
            { name: 'online-'+domain },
            { name: 'buy-'+domain },
            { name: domain+'-shop' },
            { name: domain+'-store' },
            { name: domain+'-online' },
            { name: 'shop-'+domain+'-store' },
            { name: 'shop-'+domain+'-online' },
            { name: 'store-'+domain+'-shop' },
            { name: 'store-'+domain+'-online' },
            { name: 'the-'+domain+'-shop' },
            { name: 'the-'+domain+'-store' },
            { name: 'the-'+domain+'-online' },
            { name: 'online-'+domain+'-shop' },
            { name: 'online-'+domain+'-store' },
            { name: 'buy-'+domain+'-shop' },
            { name: 'buy-'+domain+'-store' },
            { name: 'buy-'+domain+'-online' },
            { name: domain+'-1' },
            { name: domain+'-2' },
            { name: domain+'-3' },
            { name: domain+'-4' },
            { name: domain+'-5' },
            { name: domain+'-6' },
            { name: domain+'-7' },
            { name: domain+'-8' },
            { name: domain+'-9' }
        ];
    }
    for(let data of domainPosibilityList)
    {
        if(existingDomains.indexOf(data.name)==-1) {
            return data.name;
        }
    }
}

function getDomainName(domain, subDomainList) {
    return new Promise((resolve, reject) => {
        let dName = "";
        for(let i=0; i<=99999; i++)
        {
            dName = getDomNameCont(domain, subDomainList, i);
            if(dName) { break; }
        }
        resolve(dName);
    });
}