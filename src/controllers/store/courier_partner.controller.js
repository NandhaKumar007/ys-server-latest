"use strict";
const mongoose = require('mongoose');
const request = require('request');
const admin = require("../../models/admin.model");
const store = require("../../models/store.model");
const vendor = require("../../models/vendor.model");
const orderList = require("../../models/order_list.model");
const dpWalletMgmt = require("../../models/dp_wallet_mgmt.model");
const storeFeatures = require("../../models/store_features.model");
const commonService = require("../../../services/common.service");
const createPayment = require("../../../services/create_payment.service");
const setupConfig = require("../../../config/setup.config");

exports.list = (req, res) => {
    if(req.query.id) {
        storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
            if(!err && response) {
                let cpList = response.courier_partners;
                let cpIndex = cpList.findIndex(obj => obj._id.toString()==req.query.id);
                if(cpIndex!=-1) { res.json({ status: true, data: cpList[cpIndex] }); }
                else { res.json({ status: false, message: "Invalid courier partner" }); }
            }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response.courier_partners }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
}

exports.add = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
        if(!err && response) {
            let cpList = response.courier_partners;
            let cpIndex = cpList.findIndex(obj => obj.name==req.body.name);
            if(cpIndex==-1) {
                storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $push: { courier_partners: req.body } }, { new: true }, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response.courier_partners }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            }
            else { res.json({ status: false, message: "Courier partner already exists" }); }
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.update = (req, res) => {
    storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), "courier_partners._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "courier_partners.$": req.body } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.courier_partners }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.hard_remove = (req, res) => {
    storeFeatures.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $pull: { "courier_partners" : { "_id": mongoose.Types.ObjectId(req.body._id) } } }, { new: true }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.courier_partners }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

exports.create_order = (req, res) => {
    if(req.body.vendor_id) {
        vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.vendor_id) }, function(err, response) {
            if(!err && response) {
                let vendorDetails = response;
                orderList.findOne({
                    store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id),
                    status: 'active', 'vendor_list.vendor_id': mongoose.Types.ObjectId(req.body.vendor_id)
                }, function(err, response) {
                    if(!err && response) {
                        let orderDetails = response;
                        let vendorOrderDetails = orderDetails.vendor_list.filter(el => el.vendor_id.toString()==req.body.vendor_id)[0];
                        if(req.body.selected_cp=='Others') {
                            let shippingData = {
                                "vendor_list.$.cp_status": true, "vendor_list.$.shipping_method.tracking_number": req.body.tracking_number,
                                "vendor_list.$.shipping_method.name": req.body.name, "vendor_list.$.shipping_method.tracking_link": req.body.tracking_link
                            };
                            orderList.findOneAndUpdate({
                                _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id)
                            }, { $set: shippingData }, function(err, response) {
                                if(!err) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Invalid order" }); }
                            });
                        }
                        else {
                            storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
                                if(!err && response) {
                                    let cpList = response.courier_partners;
                                    let cpIndex = cpList.findIndex(obj => obj.name==req.body.selected_cp && obj.status=='active');
                                    if(cpIndex!=-1) {
                                        let dpConfig = cpList[cpIndex];
                                        if(dpConfig.name=='Delhivery') {
                                            let pIndex = vendorDetails.pickup_locations.findIndex(el => el.name==dpConfig.name);
                                            if(pIndex!=-1) {
                                                dpConfig.metadata.seller_name = vendorDetails.company_details.name;
                                                dpConfig.metadata.pickup_id = vendorDetails.pickup_locations[pIndex].location_id;
                                                createDelhiveryOrder(dpConfig, orderDetails, vendorOrderDetails).then((shippingData) => {
                                                    orderList.findOneAndUpdate({
                                                        _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id)
                                                    }, { $set: shippingData }, function(err, response) {
                                                        if(!err) { res.json({ status: true }); }
                                                        else { res.json({ status: false, error: err, message: "Invalid order" }); }
                                                    });
                                                })
                                                .catch((errData) => { res.json(errData); });
                                            }
                                            else { res.json({ status: false, message: "Pickup location doesn't exists" }); }
                                        }
                                        else { res.json({ status: false, message: "Invalid courier partner" }); }
                                    }
                                    else { res.json({ status: false, message: "Invalid courier partner" }); }
                                }
                                else { res.json({ status: false, error: err, message: "failure" }); }
                            });
                        }
                    }
                    else { res.json({ status: false, error: err, message: "Invalid order" }); }
                });
            }
            else { res.json({ status: false, error: err, message: "Invalid vendor" }); }
        });
    }
    else {
        orderList.findOne({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id),
            status: 'active', 'vendor_list.0': { $exists: false }
        }, function(err, response) {
            if(!err && response) {
                let orderDetails = response;
                if(req.body.selected_cp=='Others') {
                    let shippingData = {
                        cp_status: true, "shipping_method.tracking_number": req.body.tracking_number,
                        "shipping_method.name": req.body.name, "shipping_method.tracking_link": req.body.tracking_link
                    };
                    orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
                    { $set: shippingData }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Invalid order" }); }
                    });
                }
                else {
                    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
                        if(!err && response) {
                            let cpList = response.courier_partners;
                            let cpIndex = cpList.findIndex(obj => obj.name==req.body.selected_cp && obj.status=='active');
                            if(cpIndex!=-1) {
                                let dpConfig = cpList[cpIndex];
                                if(dpConfig.name=='Delhivery') {
                                    createDelhiveryOrder(dpConfig, orderDetails, null).then((shippingData) => {
                                        orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
                                        { $set: shippingData }, function(err, response) {
                                            if(!err) { res.json({ status: true }); }
                                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                                        });
                                    })
                                    .catch((errData) => { res.json(errData); });
                                }
                                else { res.json({ status: false, message: "Invalid courier partner" }); }
                            }
                            else { res.json({ status: false, message: "Invalid courier partner" }); }
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
}

exports.order_details = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
        if(!err && response) {
            let cpList = response.courier_partners;
            let cpIndex = cpList.findIndex(obj => obj.name==req.query.type && obj.status=='active');
            if(cpIndex!=-1) {
                let dpConfig = cpList[cpIndex];
                if(dpConfig.name=='Delhivery') {
                    dpConfig.base_url = "https://staging-express.delhivery.com";
                    if(dpConfig.mode=='live') { dpConfig.base_url = "https://track.delhivery.com"; }
                    const options = {
                        url: dpConfig.base_url+'/api/p/packing_slip?wbns='+req.query.wbn,
                        method: 'GET', json: true,
                        headers: { 'Authorization': 'Token '+dpConfig.token }
                    };
                    request(options, function(err, response, body) {
                        if(!err && response.statusCode == 200) {
                            res.json({ status: true, data: body });
                        }
                        else { res.json({ status: false, message: "Unable to get order." }); }
                    });
                }
                else { res.json({ status: false, message: "Invalid courier partner" }); }
            }
            else { res.json({ status: false, message: "Invalid courier partner" }); }
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.update_order = (req, res) => {
    if(req.body.vendor_id) {
        orderList.findOne({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id),
            status: 'active', 'vendor_list.vendor_id': mongoose.Types.ObjectId(req.body.vendor_id)
        }, function(err, response) {
            if(!err && response) {
                let orderDetails = response;
                let vendorOrderDetails = orderDetails.vendor_list.filter(el => el.vendor_id.toString()==req.body.vendor_id)[0];
                let cpOrders = vendorOrderDetails.cp_orders.filter(el => el.status=='active');
                if(vendorOrderDetails.cp_status && cpOrders.length) {
                    let cpOrderDetails = cpOrders[0];
                    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
                        if(!err && response) {
                            let cpList = response.courier_partners;
                            let cpIndex = cpList.findIndex(obj => obj.name==cpOrderDetails.name && obj.status=='active');
                            if(cpIndex!=-1) {
                                let dpConfig = cpList[cpIndex];
                                if(dpConfig.name=='Delhivery') {
                                    updateDelhiveryOrder(dpConfig, cpOrderDetails, orderDetails, vendorOrderDetails._id).then(() => {
                                        res.json({ status: true });
                                    })
                                    .catch((errData) => { res.json(errData); });
                                }
                                else { res.json({ status: false, message: "Invalid courier partner" }); }
                            }
                            else { res.json({ status: false, message: "Invalid courier partner" }); }
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, message: "Order doesn't exists" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
    else {
        orderList.findOne({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id),
            status: 'active', 'vendor_list.0': { $exists: false }
        }, function(err, response) {
            if(!err && response) {
                let orderDetails = response;
                let cpOrders = orderDetails.cp_orders.filter(el => el.status=='active');
                if(orderDetails.cp_status && cpOrders.length) {
                    let cpOrderDetails = cpOrders[0];
                    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
                        if(!err && response) {
                            let cpList = response.courier_partners;
                            let cpIndex = cpList.findIndex(obj => obj.name==cpOrderDetails.name && obj.status=='active');
                            if(cpIndex!=-1) {
                                let dpConfig = cpList[cpIndex];
                                if(dpConfig.name=='Delhivery') {
                                    updateDelhiveryOrder(dpConfig, cpOrderDetails, orderDetails, null).then(() => {
                                        res.json({ status: true });
                                    })
                                    .catch((errData) => { res.json(errData); });
                                }
                                else { res.json({ status: false, message: "Invalid courier partner" }); }
                            }
                            else { res.json({ status: false, message: "Invalid courier partner" }); }
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else { res.json({ status: false, message: "Order doesn't exists" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
}

exports.cancel_order = (req, res) => {
    if(req.body.vendor_id) {
        orderList.findOne({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id),
            status: 'active', 'vendor_list.vendor_id': mongoose.Types.ObjectId(req.body.vendor_id)
        }, function(err, response) {
            if(!err && response) {
                let orderDetails = response;
                let vendorOrderDetails = orderDetails.vendor_list.filter(el => el.vendor_id.toString()==req.body.vendor_id)[0];
                let cpOrders = vendorOrderDetails.cp_orders.filter(el => el.status=='active');
                if(vendorOrderDetails.cp_status && cpOrders.length) {
                    let cpOrderDetails = cpOrders[0];
                    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
                        if(!err && response) {
                            let cpList = response.courier_partners;
                            let cpIndex = cpList.findIndex(obj => obj.name==cpOrderDetails.name && obj.status=='active');
                            if(cpIndex!=-1) {
                                let dpConfig = cpList[cpIndex];
                                if(dpConfig.name=='Delhivery') {
                                    cancelDelhiveryOrder(dpConfig, cpOrderDetails).then(() => {
                                        vendorOrderDetails.cp_orders.map(element => { element.status = 'inactive' });
                                        let shippingData = {
                                            "vendor_list.$.cp_status": false, "vendor_list.$.cp_orders": vendorOrderDetails.cp_orders, "vendor_list.$.shipping_method.name": "",
                                            "vendor_list.$.shipping_method.tracking_number": "", "vendor_list.$.shipping_method.tracking_link": ""
                                        };
                                        orderList.findOneAndUpdate({
                                            _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id)
                                        }, { $set: shippingData }, function(err, response) {
                                            if(!err) { res.json({ status: true }); }
                                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                                        });
                                    })
                                    .catch((errData) => { res.json(errData); });
                                }
                                else { res.json({ status: false, message: "Invalid courier partner" }); }
                            }
                            else { res.json({ status: false, message: "Invalid courier partner" }); }
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else if(req.body.type=='Others') {
                    let shippingData = {
                        "vendor_list.$.cp_status": false, "vendor_list.$.shipping_method.name": "",
                        "vendor_list.$.shipping_method.tracking_number": "", "vendor_list.$.shipping_method.tracking_link": ""
                    };
                    orderList.findOneAndUpdate({
                        _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id)
                    }, { $set: shippingData }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Invalid order" }); }
                    });
                }
                else { res.json({ status: false, message: "Order doesn't exists" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
    else {
        orderList.findOne({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id),
            status: 'active', 'vendor_list.0': { $exists: false }
        }, function(err, response) {
            if(!err && response) {
                let orderDetails = response;
                let cpOrders = orderDetails.cp_orders.filter(el => el.status=='active');
                if(orderDetails.cp_status && cpOrders.length) {
                    let cpOrderDetails = cpOrders[0];
                    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
                        if(!err && response) {
                            let cpList = response.courier_partners;
                            let cpIndex = cpList.findIndex(obj => obj.name==cpOrderDetails.name && obj.status=='active');
                            if(cpIndex!=-1) {
                                let dpConfig = cpList[cpIndex];
                                if(dpConfig.name=='Delhivery') {
                                    cancelDelhiveryOrder(dpConfig, cpOrderDetails).then(() => {
                                        orderDetails.cp_orders.map(element => { element.status = 'inactive' });
                                        let shippingData = {
                                            cp_status: false, cp_orders: orderDetails.cp_orders, "shipping_method.name": "",
                                            "shipping_method.tracking_number": "", "shipping_method.tracking_link": ""
                                        };
                                        orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
                                        { $set: shippingData }, function(err, response) {
                                            if(!err) { res.json({ status: true }); }
                                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                                        });
                                    })
                                    .catch((errData) => { res.json(errData); });
                                }
                                else { res.json({ status: false, message: "Invalid courier partner" }); }
                            }
                            else { res.json({ status: false, message: "Invalid courier partner" }); }
                        }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else if(req.body.type=='Others') {
                    let shippingData = {
                        cp_status: false, "shipping_method.name": "",
                        "shipping_method.tracking_number": "", "shipping_method.tracking_link": ""
                    };
                    orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
                    { $set: shippingData }, function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Invalid order" }); }
                    });
                }
                else { res.json({ status: false, message: "Order doesn't exists" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
}

exports.pickup_request = (req, res) => {
    storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { courier_partners: 1 }, function(err, response) {
        if(!err && response) {
            let cpList = response.courier_partners;
            let cpIndex = cpList.findIndex(obj => obj.name==req.body.name && obj.status=='active');
            if(cpIndex!=-1) {
                let dpConfig = cpList[cpIndex];
                if(req.body.vendor_id) {
                    if(req.body.order_list.length) {
                        vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.vendor_id) }, function(err, response) {
                            if(!err && response) {
                                let vendorDetails = response;
                                if(dpConfig.name=='Delhivery') {
                                    let plIndex = vendorDetails.pickup_locations.findIndex(obj => obj.name==dpConfig.name);
                                    if(plIndex!=-1) {
                                        req.body.pickup_id = vendorDetails.pickup_locations[plIndex].location_id;
                                        req.body.package_count = req.body.order_list.length;
                                        delhiveryPickupRequest(dpConfig, req.body).then((pickupId) => {
                                            // update pickId
                                            for(let i=0; i<req.body.order_list.length; i++)
                                            {
                                                let orderData = req.body.order_list[i];
                                                orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderData._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(orderData.vendor_id) },
                                                { $set: { "vendor_list.$.pickup_id": pickupId } }, function() { });
                                            }
                                            res.json({ status: true });
                                        })
                                        .catch((errData) => { res.json(errData); });
                                    }
                                    else { res.json({ status: false, message: "Warehouse doesn't exists" }); }
                                }
                                else { res.json({ status: false, message: "Invalid courier partner" }); }
                            }
                            else { res.json({ status: false, error: err, message: "Invalid Vendor" }); }
                        });
                    }
                    else {
                        orderList.find({
                            store_id: mongoose.Types.ObjectId(req.id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id), status: 'active',
                            'vendor_list.order_status': 'confirmed', 'vendor_list.cp_status': true, 'vendor_list.pickup_id': { $exists: false } }, function(err, response) {
                            if(!err && response) {
                                let cpActiveOrders = [];
                                response.forEach(el => {
                                    let oIndex = el.vendor_list.findIndex(ven => ven.cp_status && !ven.pickup_id && ven.order_status=='confirmed' && ven.vendor_id.toString()==req.body.vendor_id);
                                    if(oIndex!=-1) {
                                        let vOrderdetails = el.vendor_list[oIndex];
                                        let cpIndex = vOrderdetails.cp_orders.findIndex(obj => obj.name==req.body.name && obj.status=='active');
                                        if(cpIndex!=-1) {
                                            cpActiveOrders.push({ _id: el._id, order_number: el.order_number, vendor_id: req.body.vendor_id });
                                        }
                                    }
                                });
                                res.json({ status: true, list: cpActiveOrders });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                }
                else {
                    if(req.body.order_list.length) {
                        if(dpConfig.name=='Delhivery') {
                            req.body.pickup_id = dpConfig.metadata.pickup_id;
                            req.body.package_count = req.body.order_list.length;
                            delhiveryPickupRequest(dpConfig, req.body).then((pickupId) => {
                                // update pickId
                                for(let i=0; i<req.body.order_list.length; i++)
                                {
                                    let orderData = req.body.order_list[i];
                                    orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderData._id) }, { $set: { pickup_id: pickupId } }, function() { });
                                }
                                res.json({ status: true });
                            })
                            .catch((errData) => { res.json(errData); });
                        }
                        else { res.json({ status: false, message: "Invalid courier partner" }); }
                    }
                    else {
                        orderList.find({ store_id: mongoose.Types.ObjectId(req.id), order_status: 'confirmed', status: 'active', cp_status: true, pickup_id: { $exists: false } }, function(err, response) {
                            if(!err && response) {
                                let cpActiveOrders = [];
                                response.forEach(el => {
                                    let cpIndex = el.cp_orders.findIndex(obj => obj.name==req.body.name && obj.status=='active');
                                    if(cpIndex!=-1) {
                                        cpActiveOrders.push({ _id: el._id, order_number: el.order_number });
                                    }
                                });
                                res.json({ status: true, list: cpActiveOrders });
                            }
                            else { res.json({ status: false, error: err, message: "Failure" }); }
                        });
                    }
                }
            }
            else { res.json({ status: false, message: "Invalid courier partner" }); }
        }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
    if(req.body.vendor_id) {

    }
    else {

    }
}

// DUNZO
exports.dunzo_create_order = (req, res) => {
    orderList.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }, function(err, response) {
        if(!err && response) {
            let orderDetails = response;
            store.aggregate([
                { $match:
                    { _id: mongoose.Types.ObjectId(orderDetails.store_id), dp_wallet_status: true, "dp_wallet_details.balance": { $gt: 0 } }
                },
                { $lookup:
                    { from: "store_features", localField: "_id", foreignField: "store_id", as: "storeFeatures" }
                }
            ], function(err, response) {
                if(!err && response[0]) {
                    let storeDetails = response[0];
                    // charge calc
                    let dpWalletData = {
                        store_id: orderDetails.store_id, order_id: orderDetails._id, order_number: orderDetails.order_number, order_type: 'debit',
                        order_info: 'New Order', order_price: orderDetails.shipping_method.dp_charges, final_price: orderDetails.shipping_method.dp_charges,
                        status: 'active', currency: storeDetails.currency_types.filter(obj => obj.default_currency)[0].country_code, additional_charges: 0
                    }
                    let walletBalance = storeDetails.dp_wallet_details.balance;
                    if(storeDetails.dp_wallet_details.charge_type=='amount') {
                        dpWalletData.additional_charges = storeDetails.dp_wallet_details.charge_value;
                    }
                    else {
                        dpWalletData.additional_charges = Math.ceil(orderDetails.final_price*(storeDetails.dp_wallet_details.charge_value/100));
                    }
                    // tax calc
                    if(setupConfig.company_details.country==storeDetails.country && setupConfig.company_details.state==storeDetails.company_details.state) {
                        dpWalletData.sgst = { percentage: setupConfig.company_details.sgst, amount: 0 };
                        dpWalletData.cgst = { percentage: setupConfig.company_details.cgst, amount: 0 };
                        dpWalletData.sgst.amount = parseFloat((((setupConfig.company_details.sgst)/100)*dpWalletData.additional_charges).toFixed(2));
                        dpWalletData.cgst.amount = parseFloat((((setupConfig.company_details.cgst)/100)*dpWalletData.additional_charges).toFixed(2));
                        dpWalletData.final_price += dpWalletData.sgst.amount;
                        dpWalletData.final_price += dpWalletData.cgst.amount;
                    }
                    else {
                        dpWalletData.igst = { percentage: setupConfig.company_details.igst, amount: 0 };
                        dpWalletData.igst.amount = parseFloat((((setupConfig.company_details.igst)/100)*dpWalletData.additional_charges).toFixed(2));
                        dpWalletData.final_price += dpWalletData.igst.amount;
                    }
                    dpWalletData.final_price += dpWalletData.additional_charges;
                    dpWalletData.balance = walletBalance - dpWalletData.final_price;
                    if(dpWalletData.final_price > 0 && walletBalance >= dpWalletData.final_price) {
                        let cpOrders = orderDetails.cp_orders;
                        let courierPartnerDetails = storeDetails.storeFeatures[0].courier_partners.filter(obj => obj.name=='Dunzo');
                        if(courierPartnerDetails.length) {
                            courierPartnerDetails = courierPartnerDetails[0];
                            const options = {
                                method: 'POST',
                                url: courierPartnerDetails.base_url+'/api/v2/tasks',
                                headers: {
                                    'Content-Type': 'application/json', 'Accept-Language': 'en_US', 'client-id': courierPartnerDetails.metadata.client_id,
                                    'Authorization': courierPartnerDetails.token
                                },
                                body: req.body.form_data,
                                json: true
                            };
                            request(options, function(err, response, body) {
                                if(!err) {
                                    if(response.statusCode == 200 || response.statusCode == 201) {
                                        // order created
                                        cpOrders.push({ name: "Dunzo", order_id: body.task_id });
                                        let shippingData = { cp_orders: cpOrders, cp_status: true };
                                        orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                                        { $set: shippingData }, function(err, response) {
                                            if(!err) {
                                                // update debit
                                                dpWalletMgmt.create(dpWalletData, function(err, response) {
                                                    if(!err && response)
                                                    {
                                                        store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.store_id) },
                                                        { $inc: { "dp_wallet_details.balance": -dpWalletData.final_price } }, function(err, response) {
                                                            if(!err && response) { res.json({ status: true }); }
                                                            else { res.json({ status: false, message: 'Credit update error' }); }
                                                        });
                                                    }
                                                    else { res.json({ status: false, error: err, message: "Unable to add record to statement" }); }
                                                });
                                            }
                                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                                        });
                                    }
                                    else { res.json({ status: false, error: response.statusCode, message: body.message }); }
                                }
                                else { res.json({ status: false, error: err, message: "Unable to create order." }); }
                            });
                        }
                        else { res.json({ status: false, message: "Invalid courier service" }); }
                    }
                    else { res.json({ status: false, message: "Insufficient balance in wallet" }); }
                }
                else { res.json({ status: false, error: err, message: "Invalid user | Wallet not enabled | Insufficient balance in wallet" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.dunzo_order_status = (req, res) => {
    orderList.aggregate([
        { $match:
            { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.order_id), status: 'active' }
        },
        { $lookup: 
            { from: "store_features", localField: "store_id", foreignField: "store_id", as: "storeFeatures" }
        }
    ], function(err, response) {
        if(!err && response[0]) {
            let orderDetails = response[0];
            let cpOrders = orderDetails.cp_orders;
            let cpIndex = cpOrders.findIndex(obj => obj.name=='Dunzo' && obj.status=='active' && obj.order_id==req.query.courier_id);
            let courierPartnerDetails = orderDetails.storeFeatures[0].courier_partners.filter(obj => obj.name=='Dunzo');
            if(courierPartnerDetails.length && cpIndex!=-1) {
                courierPartnerDetails = courierPartnerDetails[0];
                const options = {
                    method: 'GET',
                    url: courierPartnerDetails.base_url+'/api/v1/tasks/'+cpOrders[cpIndex].order_id+'/status',
                    headers: {
                        'Content-Type': 'application/json', 'Accept-Language': 'en_US', 'client-id': courierPartnerDetails.metadata.client_id,
                        'Authorization': courierPartnerDetails.token
                    },
                    json: true
                };
                request(options, function(err, response, body) {
                    if(!err) {
                        if(response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204 || response.statusCode == 304) {
                            res.json({ status: true, data: body });
                        }
                        else { res.json({ status: false, error: response.statusCode, message: body.message }); }
                    }
                    else { res.json({ status: false, error: err, message: "Unable to get status." }); }
                });
            }
            else { res.json({ status: false, message: "Invalid courier service" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.cancel_dunzo_order = (req, res) => {
    orderList.aggregate([
        { $match:
            { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: 'active' }
        },
        { $lookup: 
            { from: "store_features", localField: "store_id", foreignField: "store_id", as: "storeFeatures" }
        }
    ], function(err, response) {
        if(!err && response[0]) {
            let orderDetails = response[0];
            let cpOrders = orderDetails.cp_orders;
            let cpIndex = cpOrders.findIndex(obj => obj.name=='Dunzo' && obj.status=='active');
            let courierPartnerDetails = orderDetails.storeFeatures[0].courier_partners.filter(obj => obj.name=='Dunzo');
            if(courierPartnerDetails.length && cpIndex!=-1) {
                courierPartnerDetails = courierPartnerDetails[0];
                cpOrders.map(element => { element.status = 'inactive' });
                const options = {
                    method: 'POST',
                    url: courierPartnerDetails.base_url+'/api/v1/tasks/'+cpOrders[cpIndex].order_id+'/_cancel',
                    headers: {
                        'Content-Type': 'application/json', 'Accept-Language': 'en_US', 'client-id': courierPartnerDetails.metadata.client_id,
                        'Authorization': courierPartnerDetails.token
                    },
                    body: req.body.form_data,
                    json: true
                };
                request(options, function(err, response, body) {
                    if(!err) {
                        if(response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204 || response.statusCode == 304) {
                            let shippingData = { cp_status: false, cp_orders: cpOrders };
                            orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                            { $set: shippingData }, function(err, response) {
                                if(!err) { res.json({ status: true }); }
                                else { res.json({ status: false, error: err, message: "Invalid order" }); }
                            });
                        }
                        else { res.json({ status: false, error: response.statusCode, message: body.message }); }
                    }
                    else { res.json({ status: false, error: err, message: "Unable to cancel order." }); }
                });
            }
            else { res.json({ status: false, message: "Invalid courier service" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

// GHANA
exports.ghana_create_order = (req, res) => {
    orderList.findOne({
        store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id),
        "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id), status: 'active'
    }, function(err, response) {
        if(!err && response) {
            let orderDetails = response;
            let vIndex = orderDetails.vendor_list.findIndex(el => el.vendor_id.toString()==req.body.vendor_id);
            if(vIndex!=-1) {
                let vendorInfo = orderDetails.vendor_list[vIndex];
                let cartWeight = 0;
                let itemList = orderDetails.item_list.filter(obj => obj.vendor_id.toString()==req.body.vendor_id && obj.item_status!='c_confirmed');
                if(itemList.length) {
                    itemList.forEach(el => { cartWeight += el.weight });
                    // create parcel
                    let jsonData = {
                        METHOD: "ADDPARCEL",
                        APIKEY: "05c38a5c2cc3ecfa20f6bad5a81e42ee0c40070d",
                        USERNAME: "oneafrica",
                        PASSWORD: "6c76f81dcb11447cbb03575112b8dbd10a63177c",
                        CLIENTID: 3361,
                        PARCELWT: cartWeight.toString(),
                        TYPEOFDESTINATION: "local",
                        ITEMTYPE: "EMS",
                        CONSIGNEE: orderDetails.shipping_address.name,
                        CLIENTTRACKINGNO: new Date().valueOf(),
                        CONSIGNEEADDRESS: orderDetails.shipping_address.address,
                        CONSIGNEETEL: orderDetails.shipping_address.dial_code+orderDetails.shipping_address.mobile,
                        CONSIGNEEPOSTCODE: orderDetails.shipping_address.pincode,
                        CONSIGNEECITY: orderDetails.shipping_address.city,
                        PARCELDESTINATION: req.body.destination,
                        DESCRIPTION: req.body.description
                    };
                    if(req.body.description) { jsonData.DESCRIPTION = req.body.description; }
                    let options = {
                        method: 'POST', url: "https://eps.v2.ghanapost.com.gh/api/",
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                        body: jsonData, json: true
                    };
                    request(options, function(err, response, body) {
                        if(!err && response.statusCode == 200 && body.length) {
                            let orderInfo = body[0];
                            if(orderInfo.CLIENTTRACKINGNO && orderInfo.BATCHNO) {
                                // confirm parcel
                                let jsonData = {
                                    METHOD: "CONFIRMANDGETHAWB",
                                    APIKEY: "05c38a5c2cc3ecfa20f6bad5a81e42ee0c40070d",
                                    USERNAME: "oneafrica",
                                    PASSWORD: "6c76f81dcb11447cbb03575112b8dbd10a63177c",
                                    CLIENTID: 3361,
                                    CLIENTTRACKINGNO: orderInfo.CLIENTTRACKINGNO,
                                    BATCHNO: orderInfo.BATCHNO
                                };
                                let options = {
                                    method: 'POST', url: "https://eps.v2.ghanapost.com.gh/api/",
                                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                                    body: jsonData, json: true
                                };
                                request(options, function(err, response, body) {
                                    if(!err && response.statusCode == 200 && body) {
                                        // update order details
                                        vendorInfo.shipping_method.name = "EMS";
                                        vendorInfo.shipping_method.dp_charges = orderInfo.PRICE;
                                        vendorInfo.shipping_method.tracking_number = body.HAWB;
                                        vendorInfo.shipping_method.tracking_link = "https://oneafrica.online/tracking/"+body.HAWB;
                                        vendorInfo.cp_orders.push({ name: "EMS", order_id: body.HAWB })
                                        orderList.findOneAndUpdate({
                                        _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(vendorInfo.vendor_id) },
                                        { $set: { "vendor_list.$.cp_status": true, "vendor_list.$.shipping_method": vendorInfo.shipping_method, "vendor_list.$.cp_orders": vendorInfo.cp_orders } },
                                        function(err, response) {
                                            if(!err) { res.json({ status: true }); }
                                            else { res.json({ status: false, error: err, message: "failure" }); }
                                        });
                                    }
                                    else { res.json({ status: false, error: err, message: "Parcel confirm error", body: body, code: response.statusCode }); }
                                });
                            }
                            else { res.json({ status: false, message: orderInfo.message }); }
                        }
                        else { res.json({ status: false, error: err, message: "Add parcel error", body: body, code: response.statusCode }); }
                    });
                }
                else { res.json({ status: true }); }
            }
            else { res.json({ status: false, message: "Invalid vendor" }); }
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

// WALLET
exports.wallet_statement = (req, res) => {
    
    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            let balance = 0;
            if(response.dp_wallet_details && response.dp_wallet_details.balance) {
                balance = response.dp_wallet_details.balance;
            }
            dpWalletMgmt.find({ store_id: mongoose.Types.ObjectId(req.id), status: 'active', created_on: { $gte: new Date(fromDate), $lt: new Date(toDate) } }, function(err, response) {
                if(!err && response) { res.json({ status: true, list: response, balance: balance }); }
                else { res.json({ status: true, list: [], balance: balance }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });
}

exports.wallet_topup = (req, res) => {
    if(req.body.order_price > 0) {
        store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) {
                let storeDetails = response;
                admin.findOne({}, function(err, response) {
                    let paymentDetails = response.payment_types.filter(obj => obj.name==req.body.payment_details.name)[0];
                    req.body.currency_type = storeDetails.currency_types.filter(obj => obj.default_currency)[0];
                    req.body.store_id = req.id;
                    req.body.order_number = "WT-"+commonService.orderNumber();
                    req.body.order_type = "credit";
                    req.body.status = "inactive";
                    let finalAmount = req.body.order_price;
                    let transactionCharge = Math.ceil(finalAmount*(paymentDetails.transaction_fees/100));
                    finalAmount = finalAmount - transactionCharge;
                    if(finalAmount<0) finalAmount = 0;
                    req.body.final_price = finalAmount;
                    dpWalletMgmt.create(req.body, function(err, response) {
                        if(!err && response)
                        {
                            let orderDetails = response;
                            orderDetails.customer_email = storeDetails.email;
                            if(orderDetails.payment_details.name=="Razorpay")
                            {
                                // create payment
                                createPayment.createRazorpayForDpWallet(orderDetails, function(err, response) {
                                    if(!err && response) {
                                        res.json({ status: true, data: response });
                                    }
                                    else {
                                        res.json({ status: false, error: err, message: response });
                                    }
                                });
                            }
                            else { res.json({ status: false, message: "Invalid payment method" }); }
                        }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else { res.json({ status: false, error: err, message: "Invalid user" }); }
        });
    }
    else { res.json({ status: false, message: "Invalid order amount" }); }
}

function createDelhiveryOrder(dpConfig, orderDetails, vendorOrderDetails) {
    return new Promise((resolve, reject) => {
        dpConfig.base_url = "https://staging-express.delhivery.com";
        if(dpConfig.mode=='live') { dpConfig.base_url = "https://track.delhivery.com"; }
        let shippingAddress = orderDetails.shipping_address;
        let contactNo = shippingAddress.mobile;
        if(shippingAddress.dial_code) contactNo = shippingAddress.dial_code+' '+contactNo;
        let cpOrders = orderDetails.cp_orders;
        let itemList = orderDetails.item_list;
        let orderNum = orderDetails.order_number;
        let orderAmount = orderDetails.final_price;
        if(vendorOrderDetails) {
            cpOrders = vendorOrderDetails.cp_orders;
            orderNum = vendorOrderDetails.order_number;
            orderAmount = vendorOrderDetails.final_price;
            itemList = orderDetails.item_list.filter(obj => obj.vendor_id.toString()==vendorOrderDetails.vendor_id && obj.item_status!='c_confirmed');
        }
        let orderWeight = 0;
        itemList.forEach(item => { orderWeight += (item.weight * item.quantity); });
        orderWeight = parseFloat(orderWeight.toFixed(2))*1000; // convert kg to gms
        let orderedItems = itemList.map(function (obj) { return obj.name; }).join(', ');
        orderedItems = orderedItems.replace(/[^a-zA-Z0-9, ]/g, "");
        orderedItems = orderedItems.replace(/ +(?= )/g, "");
        let paymentMode = "COD";
        if(orderDetails.payment_success) { paymentMode = "Prepaid"; }
        let cpIndex = cpOrders.findIndex(obj => obj.name=='Delhivery');
        if(cpIndex!=-1) { orderNum = orderNum+'-'+new Date().valueOf(); }
        // verify pincode
        let pincodeVerifyUrl = dpConfig.base_url+'/c/api/pin-codes/json/?token='+dpConfig.token+'&filter_codes='+shippingAddress.pincode;
        request.get(pincodeVerifyUrl, function (err, response, body) {
            if(!err && response.statusCode == 200) {
                let deliveryDetails = JSON.parse(body);
                if(deliveryDetails.delivery_codes.length) {
                    let dOrderInfo = {
                        name: shippingAddress.name, phone: contactNo,
                        add: shippingAddress.address, pin: shippingAddress.pincode, country: shippingAddress.country,
                        order: orderNum, products_desc: orderedItems, weight: orderWeight,
                        payment_mode: paymentMode, total_amount: orderAmount
                    };
                    if(shippingAddress.city) { dOrderInfo.city = shippingAddress.city; }
                    if(shippingAddress.state) { dOrderInfo.state = shippingAddress.state; }
                    if(paymentMode=="COD") { dOrderInfo.cod_amount = orderAmount; }
                    if(dpConfig.metadata.seller_name) { dOrderInfo.seller_name = dpConfig.metadata.seller_name; }
                    let formData = { shipments: [dOrderInfo] };
                    if(vendorOrderDetails) {
                        formData.pickup_location = { name: dpConfig.metadata.pickup_id };
                    }
                    formData = "format=json&data="+JSON.stringify(formData).replace(/&/g, ",");
                    // create order
                    const options = {
                        url: dpConfig.base_url+'/api/cmu/create.json',
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain', 'Authorization': 'Token '+dpConfig.token },
                        body: formData
                    };
                    request(options, function(err, response, body) {
                        if(!err && response.statusCode == 200) {
                            let delhiveryData = JSON.parse(body);
                            if(delhiveryData.success) {
                                let trackingNum = delhiveryData.packages[0].waybill;
                                let trackingLink = "https://www.delhivery.com/track/package/"+trackingNum;
                                if(cpIndex!=-1) { cpOrders.splice(cpIndex, 1); }
                                cpOrders.push({ name: "Delhivery", order_number: orderNum, order_id: trackingNum });
                                let shippingData = {
                                    "shipping_method.name": "Delhivery", "shipping_method.tracking_number": trackingNum,
                                    "shipping_method.tracking_link": trackingLink, cp_status: true, cp_orders: cpOrders
                                };
                                if(vendorOrderDetails) {
                                    shippingData = {
                                        "vendor_list.$.shipping_method.name": "Delhivery", "vendor_list.$.shipping_method.tracking_number": trackingNum,
                                        "vendor_list.$.shipping_method.tracking_link": trackingLink, "vendor_list.$.cp_status": true, "vendor_list.$.cp_orders": cpOrders
                                    };
                                }
                                resolve(shippingData);
                            }
                            else { reject({ status: false, err: delhiveryData, message: "Delhivery order creation error" }); }
                        }
                        else { reject({ status: false, message: "Unable to create order." }); }
                    });
                }
                else { reject({ status: false, message: "Delivery service not available." }); }
            }
            else { reject({ status: false, message: "Delhivery api service error" }); }
        });
    });
}

function updateDelhiveryOrder(dpConfig, cpOrderDetails, orderDetails, vendorId) {
    return new Promise((resolve, reject) => {
        dpConfig.base_url = "https://staging-express.delhivery.com";
        if(dpConfig.mode=='live') { dpConfig.base_url = "https://track.delhivery.com"; }
        let shippingAddress = orderDetails.shipping_address;
        let contactNo = shippingAddress.mobile;
        if(shippingAddress.dial_code) contactNo = shippingAddress.dial_code+' '+contactNo;
        let itemList = orderDetails.item_list;
        if(vendorId) {
            itemList = orderDetails.item_list.filter(obj => obj.vendor_id.toString()==vendorId && obj.item_status!='c_confirmed');
        }
        let orderWeight = 0;
        itemList.forEach(item => { orderWeight += (item.weight * item.quantity); });
        orderWeight = parseFloat(orderWeight.toFixed(2))*1000; // convert kg to gms
        let orderedItems = itemList.map(function (obj) { return obj.name; }).join(', ');
        orderedItems = orderedItems.replace(/[^a-zA-Z0-9, ]/g, "");
        orderedItems = orderedItems.replace(/ +(?= )/g, "");
        let formData = {
            waybill: cpOrderDetails.order_id,
            name: shippingAddress.name, phone: contactNo, add: shippingAddress.address,
            product_details: orderedItems, gm: orderWeight
        };
        const options = {
            url: dpConfig.base_url+'/api/p/edit',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Token '+dpConfig.token },
            body: formData, json: true
        };
        request(options, function(err, response, body) {
            if(!err && response.statusCode == 200) {
                if(body.status===true) { resolve({ status: true }); }
                else { reject({ status: false, message: body }); }
            }
            else { reject({ status: false, error: err, message: "Unable to update." }); }
        });
    });
}

function cancelDelhiveryOrder(dpConfig, cpOrderDetails) {
    return new Promise((resolve, reject) => {
        dpConfig.base_url = "https://staging-express.delhivery.com";
        if(dpConfig.mode=='live') { dpConfig.base_url = "https://track.delhivery.com"; }
        let formData = { waybill: cpOrderDetails.order_id, cancellation: "true" };
        const options = {
            url: dpConfig.base_url+'/api/p/edit',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Token '+dpConfig.token },
            body: formData, json: true
        };
        request(options, function(err, response, body) {
            if(!err && response.statusCode == 200) {
                if(body.status) { resolve({ status: true }); }
                else { reject({ status: false, message: body }); }
            }
            else { reject({ status: false, error: err, message: "Unable to update." }); }
        });
    });
}

function delhiveryPickupRequest(dpConfig, formData) {
    return new Promise((resolve, reject) => {
        dpConfig.base_url = "https://staging-express.delhivery.com";
        if(dpConfig.mode=='live') { dpConfig.base_url = "https://track.delhivery.com"; }
        const options = {
            url: dpConfig.base_url+'/fm/request/new/',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Token '+dpConfig.token },
            body: {
                pickup_date: formData.pickup_date, pickup_time: formData.pickup_time,
                pickup_location: formData.pickup_id, expected_package_count: formData.package_count
            },
            json: true
        };
        request(options, function(err, response, body) {
            if(!err && body.pickup_id) {
                if(body.error) { reject({ status: false, message: body.error }); }
                else { resolve(body.pickup_id); }
            }
            else { reject({ status: false, message: body }); }
        });
    });
}