"use strict";
const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require("fs");

const store = require("../src/models/store.model");
const menus = require("../src/models/menu.model");
const section = require("../src/models/section.model");
const layout = require("../src/models/layout.model");
const products = require("../src/models/product.model");

const productFeatures = require("../src/models/product_features.model");
const storeFeatures = require("../src/models/store_features.model");
const deployDetails = require("../src/models/deploy_details.model");

const locations = require("../src/models/locations.model");
const policies = require("../src/models/policies.model");
const contactPage = require("../src/models/contact_page.model");
const sitemap = require("../src/models/sitemap.model");
const archive = require("../src/models/archive.model");
const extraPage = require("../src/models/extra_page.model");
const guestUser = require("../src/models/guest_user.model");

const feedback = require("../src/models/feedback.model");
const newsletter = require("../src/models/newsletter.model");
const vendorEnquiry = require("../src/models/vendor_enquiry.model");

const storeProperties = require("../src/models/store_properties.model");
const restoredSection = require("../src/models/restored_section.model");
const banner = require("../src/models/banner.model");

const giftCard = require("../src/models/gift_card.model");
const blogs = require("../src/models/blog.model");
const collection = require("../src/models/collection.model");
const discounts = require("../src/models/discounts.model");

const deliveryMethods = require("../src/models/delivery_methods.model");
const shippingMethods = require("../src/models/shipping_methods.model");

const customer = require("../src/models/customer.model");
const offerCodes = require("../src/models/offer_codes.model");

const orderList = require('../src/models/order_list.model');
const donationList = require('../src/models/donation_list.model');
const couponCodes = require("../src/models/coupon_codes.model");
const quotation = require("../src/models/quotation.model");
const paymentDetails = require("../src/models/payment_details.model");

const appointments = require("../src/models/appointments.model");
const appointmentServices = require("../src/models/appointment_services.model");
const dinamicOffers = require("../src/models/dinamic_offers.model");
const dinamicRewards = require("../src/models/dinamic_rewards.model");

const dpWalletMgmt = require("../src/models/dp_wallet_mgmt.model");
const modelHistory = require("../src/models/model_history.model");
const orderSession = require("../src/models/order_session.model");
const productReview = require("../src/models/product_reviews.model");
const quickOrders = require("../src/models/quick_orders.model");
const vendorSettlements = require("../src/models/vendor_settlements.model");

const mailTemp = require('../config/mail-templates');
const setupConfig = require('../config/setup.config');
const defaultSetup = require('../config/default.setup');
const mailService = require("../services/mail.service");
const commonService = require('../services/common.service');

// delete store
exports.deleteStorePermanently = function(storeId) {
    return new Promise((resolve, reject) => {
        store.findOne({ _id: mongoose.Types.ObjectId(storeId), status: "inactive" }, function(err, response) {
            if(!err && response) {
                appointmentServices.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                appointments.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                archive.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                banner.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                blogs.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                collection.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                contactPage.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                couponCodes.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                customer.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                deliveryMethods.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                deployDetails.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                dinamicOffers.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                dinamicRewards.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                discounts.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                donationList.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                dpWalletMgmt.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                extraPage.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                feedback.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                giftCard.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                guestUser.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                layout.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                locations.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                menus.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                modelHistory.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                newsletter.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                offerCodes.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                orderList.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                orderSession.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                paymentDetails.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                policies.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                productFeatures.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                productReview.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                products.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                quickOrders.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                quotation.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                restoredSection.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });

                section.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                shippingMethods.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                sitemap.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                storeFeatures.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                storeProperties.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                store.deleteOne({ _id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                
                vendorEnquiry.deleteMany({ store_id: mongoose.Types.ObjectId(storeId) }, function(err, response) { });
                resolve(true);
            }
            else { resolve(false); }
        });
    });
}

// activate store
exports.activateStore = function(storeDetails, appSetting) {
    return new Promise((resolve, reject) => {
        let storeId = storeDetails._id.toString();
        // policies
        let baseUrl = storeDetails.base_url.replace("https://", "");
        defaultSetup.policies.forEach(obj => {
            obj.store_id = storeId;
            obj.content = obj.content.replace(/##store_name##/g, storeDetails.name);
            obj.content = obj.content.replace(/##domain_name##/g, baseUrl);
            obj.content = obj.content.replace(/##city##/g, storeDetails.company_details.city);
        });
        // Store Properties
        let compDetails = storeDetails.company_details;
        defaultSetup.footer_config.contact_config.content = "<p>"+storeDetails.email+"</p>";
        defaultSetup.footer_config.address_config.content = "<p>"+compDetails.name+"</p><p>"+compDetails.address+"</p><p>"+compDetails.city+", "+compDetails.state+" "+compDetails.pincode+".</p>";
        storeProperties.create({
            store_id: storeId, footer_config: defaultSetup.footer_config, application_setting: appSetting
        }, function(err, response) {
            if(!err) {
                // Product Features
                let taxRates = [];
                if(storeDetails.country=='India') {
                    taxRates.push({
                        "home_country" : "India", "home_state" : compDetails.state,
                        "name" : "No Tax", "primary" : true, "sgst" : 0, "cgst" : 0, "igst" : 0
                    });
                }
                productFeatures.create({ store_id: storeId, tax_rates: taxRates }, function(err, response) {
                    if(!err) {
                        let taxRateId = null;
                        if(response.tax_rates.length) {
                            taxRateId = response.tax_rates[0]._id.toString();
                        }
                        // Store Features
                        storeFeatures.create({ store_id: storeId }, function(err, response) {
                            if(!err) {
                                // deploy details
                                deployDetails.create({
                                    store_id: mongoose.Types.ObjectId(storeId), category: storeDetails.temp_category,
                                    template_set_id: storeDetails.templateId, content_set_id: storeDetails.contentId,
                                    category_set_id: storeDetails.categorySetId, category_images: storeDetails.categoryImages
                                }, function(err, response) {
                                    if(!err) {
                                        // menu list
                                        defaultSetup.menu.forEach((menu) => { menu.store_id = storeId; });
                                        menus.insertMany(defaultSetup.menu, function(err, response) {
                                            if(!err) {
                                                // product list
                                                defaultSetup.product.forEach((product) => {
                                                    product.store_id = storeId;
                                                    if(taxRateId) { product.taxrate_id = taxRateId; }
                                                });
                                                products.insertMany(defaultSetup.product, function(err, response) {
                                                    if(!err) {
                                                        // policies
                                                        policies.insertMany(defaultSetup.policies, function(err, response) {
                                                            if(!err) {
                                                                // about us
                                                                let aboutUsConfig = {
                                                                    store_id: storeId, name: "About Us", page_url: "about-us",
                                                                    content: "<h3>About Us</h3><br><p class='ql-align-justify'>"+storeDetails.seo_details.meta_desc+"</p>"
                                                                };
                                                                extraPage.create(aboutUsConfig, function(err, response) {
                                                                    if(!err) {
                                                                        // contact us
                                                                        let contactUsConfig = defaultSetup.contactUsConfig(storeDetails);
                                                                        contactPage.create(contactUsConfig, function(err, response) {
                                                                            if(!err) {
                                                                                // sitemap
                                                                                let siteMapData = "<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9' xmlns:xhtml='http://www.w3.org/1999/xhtml'><url><loc>"+storeDetails.base_url+"/</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url></urlset>";
                                                                                sitemap.create({ store_id: mongoose.Types.ObjectId(storeId), content: siteMapData }, function(err, response) {
                                                                                    if(!err) {
                                                                                        // send activated mail
                                                                                        mailTemp.getYsMailTemplate('store_activated').then((body) => {
                                                                                            let bodyContent = body;
                                                                                            bodyContent = bodyContent.replace("##disc_percentage##", defaultSetup.daywise_discounts[0].discount);
                                                                                            let sendData = {
                                                                                                config: setupConfig.ys_mail_config,
                                                                                                sendTo: storeDetails.email,
                                                                                                subject: "Say hello to "+storeDetails.name,
                                                                                                body: bodyContent,
                                                                                                cc_mail: setupConfig.ys_mail_config.notify_mail
                                                                                            };
                                                                                            mailService.sendMailFromAdmin(sendData, function(err, response) {
                                                                                                resolve(true);
                                                                                            });
                                                                                        });
                                                                                    }
                                                                                    else { reject("Unable to add sitemap. Please contact yourstore team."); }
                                                                                });
                                                                            }
                                                                            else { reject("Unable to add contact us. Please contact yourstore team."); }
                                                                        });
                                                                    }
                                                                    else { reject("Unable to add about us. Please contact yourstore team."); }
                                                                });
                                                            }
                                                            else { reject("Unable to add policies. Please contact yourstore team."); }
                                                        });
                                                    }
                                                    else { reject("Unable to create product list. Please contact yourstore team."); }
                                                });
                                            }
                                            else { reject("Unable to create menu list. Please contact yourstore team."); }
                                        });
                                    }
                                    else { reject("Unable to create deploy details. Please contact yourstore team."); }
                                });
                            }
                            else { reject("Unable to set store features. Please contact yourstore team."); }
                        });
                    }
                    else { reject("Unable to set product features. Please contact yourstore team."); }
                });
            }
            else { reject("Unable to set store properties. Please contact yourstore team."); }
        });
    });
}

// layout
exports.create_layout = function(storeId) {
    return new Promise((resolve, reject) => {
        store.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(storeId) } },
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
                let deployData = storeDetails.deployDetails[0];
                // remove segments
                layout.deleteMany({ store_id: mongoose.Types.ObjectId(storeDetails._id) }, function(err, response) {
                    if(!err) {
                        let lrp = "uploads/"+storeId+"/layouts";
                        if(fs.existsSync(lrp)) { fs.rmdirSync(lrp, { recursive: true }); }
                        let configData = {
                            storeId: storeId, category: deployData.category, colorCode: deployData.theme_colors.primary,
                            templateId: deployData.template_set_id, contentId: deployData.content_set_id,
                            catSetId: deployData.category_set_id, catImages: deployData.category_images
                        };
                        let txtColor = "dark";
                        let storeTheme = commonService.lightOrDark(deployData.theme_colors.primary);
                        if(storeTheme=='dark') { txtColor = "light"; }
                        let layoutDetails = defaultSetup.layouts(storeDetails, configData.category, configData.templateId-1, configData.contentId-1);
                        if(layoutDetails)
                        {
                            layoutDetails.forEach((obj) => {
                                obj.store_id = storeId;
                                if(obj.type=='section') {
                                    obj.image_list.forEach(el => {  el.content_details.text_color = txtColor; });
                                }
                            });
                            let rootPath = "uploads/"+configData.storeId+"/layouts";
                            if(!fs.existsSync(rootPath)) {
                                fs.mkdir(rootPath, { recursive: true }, (err) => {
                                    if(!err) {
                                        uploadLayoutImages(layoutDetails, configData).then((updatedLayoutList) => {
                                            layout.insertMany(updatedLayoutList, function(err, response) {
                                                if(!err && response) {
                                                    if(storeDetails.seo_details.h1_tag) { resolve({ status: true }); }
                                                    else {
                                                        let primIndex = updatedLayoutList.findIndex(el => el.type=='primary_slider');
                                                        if(primIndex!=-1) {
                                                            let h1Tag = updatedLayoutList[primIndex].image_list[0].content_details.heading;
                                                            store.findByIdAndUpdate(storeDetails._id, { $set: { "seo_details.h1_tag": h1Tag } }, function(err, response) {
                                                                resolve({ status: true });
                                                            });
                                                        }
                                                        else { resolve({ status: true }); }
                                                    }
                                                }
                                                else { reject({ status: false, error: err, message: "Unable to add layout" }); }
                                            });
                                        });
                                    }
                                    else { reject({ status: false, error: err, message: "Unable to create layout directory" }); }
                                });
                            }
                            else {
                                uploadLayoutImages(layoutDetails, configData).then((updatedLayoutList) => {
                                    layout.insertMany(updatedLayoutList, function(err, response) {
                                        if(!err && response) {
                                            if(storeDetails.seo_details.h1_tag) { resolve({ status: true }); }
                                            else {
                                                let primIndex = updatedLayoutList.findIndex(el => el.type=='primary_slider');
                                                if(primIndex!=-1) {
                                                    let h1Tag = updatedLayoutList[primIndex].image_list[0].content_details.heading;
                                                    store.findByIdAndUpdate(storeDetails._id, { $set: { "seo_details.h1_tag": h1Tag } }, function(err, response) {
                                                        resolve({ status: true });
                                                    });
                                                }
                                                else { resolve({ status: true }); }
                                            }
                                        }
                                        else { reject({ status: false, error: err, message: "Unable to add layout" }); }
                                    });
                                });
                            }
                        }
                        else { reject({ status: false, message: "Invalid category" }); }
                    }
                    else { reject({ status: false, error: err, message: "Unable to clear segments" }); }
                });
            }
            else { reject({ status: false, error: err, message: "Invalid store" }); }
        });
    });
}

function processSegment(segmentData, configData) {
    let imgQuality = 90;
    let rootPath = "uploads/"+configData.storeId+"/layouts";
    let randomName = new Date().valueOf()+'-'+Math.floor(Math.random() * Math.floor(999999));
    let templatePath = "uploads/yourstore/templates/"+configData.templateId;
    return new Promise((resolve, reject) => {
        if(segmentData.unique_name=='primary_slider') {
            for(let i=0; i<segmentData.image_list.length; i++)
            {
                let imgData = segmentData.image_list[i];
                imgData.desktop_img = rootPath+"/desktop_primary_slider.jpg";
                imgData.desk_small_img = rootPath+"/desktop_primary_slider_s.jpg";
                imgData.mobile_img = rootPath+"/mobile_primary_slider.jpg";
                imgData.mob_small_img = rootPath+"/mobile_primary_slider_s.jpg";
                if(i>0) {
                    imgData.desktop_img = rootPath+"/desktop-"+randomName+".jpg";
                    imgData.desk_small_img = rootPath+"/desktop-"+randomName+"_s.jpg";
                    imgData.mobile_img = rootPath+"/mobile-"+randomName+".jpg";
                    imgData.mob_small_img = rootPath+"/mobile-"+randomName+"_s.jpg";
                }
                let desktopCompImg = "uploads/yourstore/store-categories/"+configData.category+"/"+configData.catSetId+"/desktop/"+configData.catImages[0+i]+".png";
                let mobileCompImg = "uploads/yourstore/store-categories/"+configData.category+"/"+configData.catSetId+"/mobile/"+configData.catImages[0+i]+".png";
                // desktop
                sharp(templatePath+'/desktop-primary-banner.png')
                .flatten({ background: configData.colorCode })
                .composite([{
                    input: desktopCompImg,
                    left: imgData.desktop_coordinates.left, top: imgData.desktop_coordinates.top
                }])
                .jpeg({ quality: imgQuality, chromaSubsampling: '4:4:4' })
                .toFile(imgData.desktop_img)
                .then(() => {
                    sharp(imgData.desktop_img).resize(277, 103).toFile(imgData.desk_small_img, (err, info) => {
                        // mobile
                        sharp(templatePath+'/mobile-primary-banner.png')
                        .flatten({ background: configData.colorCode })
                        .composite([{
                            input: mobileCompImg,
                            left: imgData.mobile_coordinates.left, top: imgData.mobile_coordinates.top
                        }])
                        .jpeg({ quality: imgQuality, chromaSubsampling: '4:4:4' })
                        .toFile(imgData.mobile_img)
                        .then(() => {
                            sharp(imgData.mobile_img).resize(171, 210).toFile(imgData.mob_small_img, (err, info) => { });
                        }).catch((err) => { console.log("1", err); });
                    });
                }).catch((err) => { console.log("2", err); });
            }
            resolve(segmentData.image_list);
        }
        else if(segmentData.unique_name=='brand_highlighted_section' || segmentData.unique_name=='advantage_highlighted_section') {
            let desktopImg = rootPath+"/"+randomName+".jpg";
            let compositeConfig = {
                input: "uploads/"+configData.storeId+"/brand-logo.png",
                gravity: 'center'
            };
            if(segmentData.unique_name=='advantage_highlighted_section') {
                compositeConfig = {
                    input: "uploads/yourstore/store-categories/"+configData.category+"/"+configData.catSetId+"/advantage/"+configData.catImages[2]+".png",
                    left: segmentData.coordinates.left, top: segmentData.coordinates.top
                };
            }
            sharp(templatePath+'/highlighted-section.png')
            .flatten({ background: configData.colorCode })
            .composite([compositeConfig])
            .jpeg({ quality: imgQuality, chromaSubsampling: '4:4:4' })
            .toFile(desktopImg)
            .then(() => {
                let lowResFileName = rootPath+"/"+randomName+"_s.jpg";
                sharp(desktopImg).resize(154, 86).toFile(lowResFileName, (err, info) => {
                    segmentData.image_list[0].desktop_img = desktopImg;
                    resolve(segmentData.image_list);
                });
            }).catch((err) => { console.log("3", err); });
        }
        else if(segmentData.type=='section') {
            let desktopImg = rootPath+"/yspi-"+randomName+".jpg";
            sharp(templatePath+'/grid-section.png')
            .flatten({ background: configData.colorCode })
            .jpeg({ quality: imgQuality, chromaSubsampling: '4:4:4' })
            .toFile(desktopImg)
            .then(() => {
                let lowResFileName = rootPath+"/yspi-"+randomName+"_s.jpg";
                sharp(desktopImg).resize(90, 90).toFile(lowResFileName, (err, info) => {
                    segmentData.image_list.forEach(el => { el.desktop_img = desktopImg; });
                    resolve(segmentData.image_list);
                });
            }).catch((err) => { console.log("4", err); });
        }
        else { resolve(segmentData.image_list); }
    });
}

async function uploadLayoutImages(layoutList, configData) {
    let sectionGridImg = null;
    for(let obj of layoutList) {
        if(obj.type=='section') {
            if(!sectionGridImg) {
                obj.image_list = await processSegment(obj, configData);
                sectionGridImg = obj.image_list[0].desktop_img;
            }
            else { obj.image_list.forEach(el => { el.desktop_img = sectionGridImg; }); }
        }
        else { obj.image_list = await processSegment(obj, configData); }
    }
    return layoutList;
}

// update sitemap
exports.updateStoreSitemap = function(storeId) {
    return new Promise((resolve, reject) => {
        let prevDate = new Date().setDate(new Date().getDate() - 1);
        store.findOne({ _id: mongoose.Types.ObjectId(storeId), status: 'active', account_type: 'client', sitemap_updated_on: { $lte: new Date(prevDate) } }, function(err, response) {
            if(!err && response) {
                let storeDetails = response;
                let productList = []; let sectionList = []; let blogList = [];
                // products
                products.find({ store_id: mongoose.Types.ObjectId(storeDetails._id), archive_status: false, status: 'active', stock: { $gt: 0 } }, { store_id: 1, seo_status: 1, seo_details: 1 }, function(err, proResp) {
                    if(!err && proResp) { productList = proResp; }
                    // sections
                    section.find({ store_id: mongoose.Types.ObjectId(storeDetails._id), status: 'active' }, function(err, sectionResp) {
                        if(!err && sectionResp) { sectionList = sectionResp; }
                        // blogs
                        blogs.find({ store_id: mongoose.Types.ObjectId(storeDetails._id), status: "enabled" }, { store_id: 1, seo_status: 1, seo_details: 1 }, function(err, blogResp) {
                            if(!err && blogResp) { blogList = blogResp; }
                            // generate sitemap data
                            let mapData = "<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9' xmlns:xhtml='http://www.w3.org/1999/xhtml'><url><loc>"+storeDetails.base_url+"/</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                            // common list
                            buildCommonSitemap(storeDetails.base_url, storeDetails.default_sitemap).then((respData) => {
                                mapData += respData;
                                // section list
                                buildSectionSitemap(storeDetails.base_url, sectionList).then((respData) => {
                                    mapData += respData;
                                    // product list
                                    buildSitemap(storeDetails.base_url, "product", productList).then((respData) => {
                                        mapData += respData;
                                        // blog list
                                        buildSitemap(storeDetails.base_url, "blogs", blogList).then((respData) => {
                                            mapData += respData+"</urlset>";
                                            sitemap.findOne({ store_id: mongoose.Types.ObjectId(storeDetails._id) }, function(err, response) {
                                                if(!err && response) {
                                                    sitemap.findByIdAndUpdate(response._id, { $set: { content: mapData, updated_on: new Date() } }, function(err, response) {
                                                        if(!err) {
                                                            store.findByIdAndUpdate(storeDetails._id, { $set: { sitemap_updated_on: new Date() } }, function(err, response) {
                                                                resolve(true);
                                                            });
                                                        }
                                                        else {
                                                            console.log("sitemap update err", err);
                                                            resolve(true);
                                                        }
                                                    });
                                                }
                                                else {
                                                    sitemap.create({ store_id: mongoose.Types.ObjectId(storeDetails._id), content: mapData }, function(err, response) {
                                                        if(!err) {
                                                            store.findByIdAndUpdate(storeDetails._id, { $set: { sitemap_updated_on: new Date() } }, function(err, response) {
                                                                resolve(true);
                                                            });
                                                        }
                                                        else {
                                                            console.log("sitemap update err", err);
                                                            resolve(true);
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else { resolve(true); }
        });
    });
}

function buildCommonSitemap(base_url, list) {
    return new Promise((resolve, reject) => {
        let mapUrl = "";
        for(let i=0; i<list.length; i++)
        {
            mapUrl += "<url><loc>"+base_url+"/"+list[i]+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
        }
        resolve(mapUrl);
    });
}

function buildSectionSitemap(base_url, sectionList) {
    return new Promise((resolve, reject) => {
        let mapUrl = "";
        for(let i=0; i<sectionList.length; i++)
        {
            let categoryList = sectionList[i].categories;
            if(categoryList.length)
            {
                for(let j=0; j<categoryList.length; j++)
                {
                    let subCategoryList = categoryList[j].sub_categories;
                    if(subCategoryList.length)
                    {
                        for(let k=0; k<subCategoryList.length; k++)
                        {
                            if(subCategoryList[k].seo_status) {
                                mapUrl += "<url><loc>"+base_url+"/category/"+subCategoryList[k].seo_details.page_url+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                            }
                            else {
                                mapUrl += "<url><loc>"+base_url+"/category/"+subCategoryList[k]._id+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                            }
                        }
                    }
                    else {
                        if(categoryList[j].seo_status) {
                            mapUrl += "<url><loc>"+base_url+"/category/"+categoryList[j].seo_details.page_url+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                        }
                        else {
                            mapUrl += "<url><loc>"+base_url+"/category/"+categoryList[j]._id+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                        }
                    }
                }
            }
            else {
                if(sectionList[i].seo_status) {
                    mapUrl += "<url><loc>"+base_url+"/category/"+sectionList[i].seo_details.page_url+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                }
                else {
                    mapUrl += "<url><loc>"+base_url+"/category/"+sectionList[i]._id+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
                }
            }
        }
        resolve(mapUrl);
    });
}

function buildSitemap(base_url, type, list) {
    return new Promise((resolve, reject) => {
        let mapUrl = "";
        for(let i=0; i<list.length; i++)
        {
            if(list[i].seo_status) {
                mapUrl += "<url><loc>"+base_url+"/"+type+"/"+list[i].seo_details.page_url+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
            }
            else {
                mapUrl += "<url><loc>"+base_url+"/"+type+"/"+list[i]._id+"</loc><lastmod>"+new Date().toISOString()+"</lastmod><priority>1.00</priority></url>";
            }
        }
        resolve(mapUrl);
    });
}

// calculate vendor settlement
exports.calc_settlement_amount = function(orderDetails, vendorId) {
    return new Promise((resolve, reject) => {
        let vIndex = orderDetails.vendor_list.findIndex(obj => obj.vendor_id==vendorId);
        if(vIndex!=-1) {
            vendorSettlements.findOne({ order_id: mongoose.Types.ObjectId(orderDetails._id), vendor_id: mongoose.Types.ObjectId(vendorId) }, function(err, response) {
                if(!err && !response) {
                    deployDetails.findOne({ store_id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
                        if(!err && response) {
                            let deployData = response;
                            let vendorOrderInfo = orderDetails.vendor_list[vIndex];
                            let settlemInfo = {
                                store_id: orderDetails.store_id, order_id: orderDetails._id, vendor_id: vendorId,
                                pg_in_pct: 0, pg_charges: 0, tax_in_pct: 0, cmsn_tax: 0, items_cmsn: 0, settlement_amt: 0,
                                order_total: (vendorOrderInfo.shipping_cost + vendorOrderInfo.gift_wrapper)
                            };
                            let itemList = orderDetails.item_list.filter(el => el.vendor_id==vendorId && el.item_status!='c_confirmed');
                            calcCartTotal(itemList).then((cartTotal) => {
                                settlemInfo.order_total += cartTotal;
                                let priceRange = deployData.price_range.sort((a, b) => 0 - (a.price > b.price ? -1 : 1));
                                settlemInfo.total_cmsn = vendorOrderInfo.shipping_method.dp_charges;
                                if(deployData.cmsn_type=='flat') {
                                    let cmsnPercent = (deployData.cmsn_in_pct/100);
                                    settlemInfo.items_cmsn = parseFloat((cartTotal*cmsnPercent).toFixed(2));
                                    settlemInfo = contCalc(orderDetails, vendorOrderInfo, settlemInfo, deployData.cmsn_config);
                                    createSettlement(deployData, settlemInfo).then(() => { resolve(true); })
                                    .catch(function(error) { reject(error); });
                                }
                                else if(deployData.cmsn_type=='order_range' && priceRange.length) {
                                    let prIndex = priceRange.findIndex(obj => obj.price > cartTotal);
                                    if(prIndex==-1) prIndex = priceRange.length - 1;
                                    else prIndex--;
                                    let cmsnPercent = (priceRange[prIndex].percentage/100);
                                    settlemInfo.items_cmsn = parseFloat((cartTotal*cmsnPercent).toFixed(2));
                                    settlemInfo = contCalc(orderDetails, vendorOrderInfo, settlemInfo, deployData.cmsn_config);
                                    createSettlement(deployData, settlemInfo).then(() => { resolve(true); })
                                    .catch(function(error) { reject(error); });
                                }
                                else if(deployData.cmsn_type=='product_range' && priceRange.length) {
                                    calcItemsCmsn(itemList, priceRange).then((itemsCmsn) => {
                                        settlemInfo.items_cmsn = itemsCmsn;
                                        settlemInfo = contCalc(orderDetails, vendorOrderInfo, settlemInfo, deployData.cmsn_config);
                                        createSettlement(deployData, settlemInfo).then(() => { resolve(true); })
                                        .catch(function(error) { reject(error); });
                                    });
                                }
                                else { reject({ status: false, message: "Invalid commission type" }); }
                            });
                        }
                        else { reject({ status: false, message: "Invalid order. Unable to fetch commission info" }); }
                    });
                }
                else { reject({ status: false, message: "Settlement already created" }); }
            });
        }
        else { reject({ status: false, message: "Invalid vendor" }); }
    });
}

function createSettlement(deployData, settlemData) {
    return new Promise((resolve, reject) => {
        settlemData.settlement_on = new Date().setDate(new Date().getDate() + deployData.cmsn_config.settlem_in_days);
        settlemData.order_number = commonService.orderNumber();
        settlemData.invoice_number = "";
        if(deployData.vendor_inv_status && deployData.vendor_inv_config) {
            settlemData.invoice_number = commonService.invoiceNumber(deployData.vendor_inv_config);
        }
        vendorSettlements.create(settlemData, function(err, response) {
            if(!err, response) {
                if(settlemData.invoice_number) {
                    deployDetails.findByIdAndUpdate(deployData._id, { $inc: { "vendor_inv_config.next_invoice_no": 1 } }, function(err, response) { });
                }
                resolve(true);
            }
            else { reject({ status: false, error: err, message: "Unable to create settlement" }); }
        });
    });
}

function calcCartTotal(itemList) {
    return new Promise((resolve, reject) => {
        let cartTotal = 0;
        for(let item of itemList)
        {
            cartTotal += (item.final_price*item.quantity);
            if(item.unit!="Pcs") { cartTotal += item.addon_price; }
        }
        resolve(cartTotal);
    });
}

function calcItemsCmsn(itemList, priceRange) {
    return new Promise((resolve, reject) => {
        let totalCommission = 0;
        for(let item of itemList)
        {
            let prIndex = priceRange.findIndex(obj => obj.price > item.discounted_price);
            if(prIndex==-1) prIndex = priceRange.length - 1;
            else prIndex--;
            let cmsnPercent = (priceRange[prIndex].percentage/100);
            let finalPrice = 0;
            if(item.unit=='Pcs') finalPrice = (item.final_price*item.quantity);
            else finalPrice = ((item.final_price*item.quantity)+item.addon_price);
            totalCommission += parseFloat((finalPrice*cmsnPercent).toFixed(2));
        }
        resolve(totalCommission);
    });
}

function contCalc(orderDetails, vendorOrderInfo, settlemInfo, cmsnConfig) {
    settlemInfo.total_cmsn += settlemInfo.items_cmsn;
    // payment gateway charges
    if(orderDetails.payment_details.name!='COD' && cmsnConfig.pgw_charges>0) {
        settlemInfo.pg_in_pct = cmsnConfig.pgw_charges;
        let pgCharges = (cmsnConfig.pgw_charges/100);
        settlemInfo.pg_charges = parseFloat((vendorOrderInfo.grand_total*pgCharges).toFixed(2));
        settlemInfo.total_cmsn += settlemInfo.pg_charges;
    }
    // tax on commission
    if(cmsnConfig.tax_on_cmsn && cmsnConfig.tax_in_pct>0) {
        settlemInfo.tax_in_pct = cmsnConfig.tax_in_pct;
        let cmsnTax = (cmsnConfig.tax_in_pct/100);
        settlemInfo.cmsn_tax =parseFloat((settlemInfo.total_cmsn*cmsnTax).toFixed(2));
    }
    settlemInfo.settlement_amt = (settlemInfo.order_total-(settlemInfo.total_cmsn+settlemInfo.cmsn_tax));
    return settlemInfo;
}