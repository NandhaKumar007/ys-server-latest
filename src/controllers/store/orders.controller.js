"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const vendor = require("../../models/vendor.model");
const customer = require("../../models/customer.model");
const guestUser = require("../../models/guest_user.model");
const orderList = require("../../models/order_list.model");
const donationList = require("../../models/donation_list.model");
const vendorSettlements = require("../../models/vendor_settlements.model");
const mailService = require("../../../services/mail.service");
const commonService = require("../../../services/common.service");
const stockService = require("../../../services/stock.service");
const erpService = require("../../../services/erp.service");
const storeService = require("../../../services/store.service");
const validationService = require("../../../services/validation.service");

exports.manual_order = (req, res) => {
    store.findOne({ _id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let storeDetails = response;
            req.body.store_id = storeDetails._id;
            customer.findOne({ _id: mongoose.Types.ObjectId(req.body.customer_id) }, function(err, response) {
                if(!err && response)
                {
                    let customerDetails = response;
                    let filteredAddr = customerDetails.address_list.filter(obj => obj.billing_address);
                    if(filteredAddr.length) { req.body.billing_address = filteredAddr[0]; }
                    req.body.customer_name = customerDetails.name;
                    req.body.status = "active";
                    req.body.order_by = "admin";
                    req.body.order_number = commonService.orderNumber();
                    if(customerDetails.unique_id) {
                        req.body.order_number = req.body.order_number+'-'+customerDetails.unique_id;
                    }
                    req.body.invoice_number = "";
                    if(storeDetails.invoice_status) {
                        req.body.invoice_number = commonService.invoiceNumber(storeDetails.invoice_config);
                    }
                    orderList.create(req.body, function(err, response) {
                        if(!err && response) {
                            let orderDetails = response;
                            // ERP
                            let erpDetails = storeDetails.erp_details;
                            if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                                orderDetails.customer_email = customerDetails.email;
                                let erpData = {
                                    erp_config: erpDetails.config,
                                    store_id: storeDetails._id, event_type: 'place_order',
                                    user_agent: req.get('User-Agent'), order_details: orderDetails
                                }
                                erpService.ambar(erpData);
                            }
                            // update next invoice no
                            if(req.body.invoice_number) {
                                store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
                            }
                            // decrease product stock
                            stockService.decProductStock(orderDetails.item_list);
                            // decrease coupon balance
                            if(orderDetails.coupon_list.length) { stockService.updateCouponBalance(orderDetails); }
                            // update offer redeem count
                            if(orderDetails.offer_details) { stockService.incOfferRedeemCount(orderDetails.offer_details); }
                            // send mail
                            if(orderDetails.order_status=="placed") {
                                mailService.sendOrderPlacedMail(null, orderDetails._id).then(result => {
                                    // order placed mail to vendor
                                    if(orderDetails.vendor_list.length) {
                                        mailService.sendOrderPlacedMailToVendor(orderDetails._id);
                                    }
                                    res.json({ status: true, data: orderDetails });
                                }).catch(function(error) {
                                    res.json({ status: false, message: error });
                                });
                            }
                            else if(orderDetails.order_status=="confirmed") {
                                mailService.sendOrderConfirmedMail(null, orderDetails._id).then(result => {
                                    res.json({ status: true, data: orderDetails });
                                }).catch(function(error) {
                                    res.json({ status: false, message: error });
                                });
                            }
                            else {
                                res.json({ status: true, data: orderDetails });
                            }  
                        }
                        else {
                            res.json({ status: false, error: err, message: "Unable to create order" });
                        }
                    });
                }
                else { res.json({ status: false, message: "Invalid user" }); }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });  
}

exports.list = (req, res) => {
    let queryParams = { store_id: mongoose.Types.ObjectId(req.id), status: 'active' };
    if(req.body.customer_id=='all') {
        queryParams[req.body.date_type] = { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
    }
    if(req.body.customer_id && req.body.customer_id!='all') {
        queryParams.customer_id = mongoose.Types.ObjectId(req.body.customer_id);
    }
    if(req.body.vendor_id && req.body.vendor_id!='all') {
        queryParams["vendor_list.vendor_id"] = mongoose.Types.ObjectId(req.body.vendor_id);
        // orderStatus -> placed, confirmed, dispatched, delivered, cancelled
        let orderStatus = req.body.type;
        if(orderStatus=="all") { orderStatus = { $in: [ 'placed', 'confirmed', 'dispatched' ] }; }
        queryParams['vendor_list.order_status'] = orderStatus;
    }
    else {
        // orderStatus -> placed, confirmed, dispatched, delivered, cancelled
        let orderStatus = [{ order_status: req.body.type }, { "vendor_list.order_status": req.body.type }];
        if(req.body.type=="all") {
            orderStatus = [
                { order_status: { $in: [ 'placed', 'confirmed', 'dispatched' ] } },
                { "vendor_list.order_status": { $in: [ 'placed', 'confirmed', 'dispatched' ] } }
            ];
        }
        queryParams['$or'] = orderStatus;
    }
    orderList.aggregate([
        { $match : queryParams },
        { $lookup:
            {
               from: 'customers',
               localField: 'customer_id',
               foreignField: '_id',
               as: 'customerDetails'
            }
        }
    ], function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.inactive_list = (req, res) => {
    let queryParams = {};
    if(req.body.type=='All') {
        queryParams = {
            store_id: mongoose.Types.ObjectId(req.id), status: 'inactive',
            created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
        };
    }
    else {
        queryParams = {
            store_id: mongoose.Types.ObjectId(req.id), status: 'inactive', "payment_details.name": req.body.type,
            created_on: { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) }
        };
    }
    orderList.aggregate([
        { $match : queryParams },
        { $lookup:
            {
               from: 'customers',
               localField: 'customer_id',
               foreignField: '_id',
               as: 'customerDetails'
            }
        }
    ], function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.details = (req, res) => {
    if(req.query.vendor_id) {
        vendor.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.vendor_id) }, function(err, response) {
            if(!err && response) {
                let vendorDetails = response;
                orderList.aggregate([ 
                    { $match :
                        { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.order_id) }
                    },
                    { $lookup:
                        {
                        from: 'customers',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'customerDetails'
                        }
                    }
                ], function(err, response) {
                    if(!err && response[0]) {
                        res.json({ status: true, vendor_info: vendorDetails, data: response[0] });
                    }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
            else { res.json({ status: false, error: err, message: "Invalid vendor" }); }
        });
    }
    else {
        orderList.aggregate([ 
            { $match :
                { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.order_id) }
            },
            { $lookup:
                {
                from: 'customers',
                localField: 'customer_id',
                foreignField: '_id',
                as: 'customerDetails'
                }
            }
        ], function(err, response) {
            if(!err && response[0]) {
                res.json({ status: true, data: response[0] });
            }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}

exports.place_inactive_order = (req, res) => {
    orderList.aggregate([ 
        { $match :
            { _id: mongoose.Types.ObjectId(req.body._id), store_id: mongoose.Types.ObjectId(req.id), status: "inactive" }
        },
        { $lookup:
            {
               from: 'stores',
               localField: 'store_id',
               foreignField: '_id',
               as: 'storeDetails'
            }
        }
    ], function(err, response) {
        if(!err && response) {
            let orderDetails = response[0];
            if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
            let storeDetails = orderDetails.storeDetails[0];
            // clear customer cart
            if(!orderDetails.buy_now) {
                customer.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails.customer_id) }, { $set: { cart_list: [] } }, function(err, response) { });
            }
            // clear guest user cart
            if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                guestUser.findOneAndUpdate({ email: orderDetails.guest_email }, { $set: { cart_list: [] } }, function(err, response) { });
            }
            // invoice number
            let invoiceNum = "";
            if(storeDetails.invoice_status && !orderDetails.vendor_list.length) {
                invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
            }
            validationService.setVendorOrdersInvoice(storeDetails, orderDetails).then((updatedVendorList) => {
                // update order status
                orderList.findByIdAndUpdate(orderDetails._id,
                { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": req.body.payment_id, status: "active" } }, function(err, response) {
                    if(!err && response)
                    {
                        // ERP
                        let erpDetails = storeDetails.erp_details;
                        if(erpDetails && erpDetails.name=='ambar' && erpDetails.status=='active') {
                            if(orderDetails.order_by=='user') {
                                customer.findOne({ _id: mongoose.Types.ObjectId(orderDetails.customer_id), status: 'active' }, function(err, response) {
                                    if(!err && response) {
                                        orderDetails.customer_email = response.email;
                                        let erpData = {
                                            erp_config: erpDetails.config,
                                            store_id: storeDetails._id, event_type: 'place_order',
                                            user_agent: req.get('User-Agent'), order_details: orderDetails
                                        }
                                        erpService.ambar(erpData);
                                    }
                                });
                            }
                            else if(orderDetails.order_by=='guest' && orderDetails.guest_email) {
                                orderDetails.customer_email = orderDetails.guest_email;
                                let erpData = {
                                    erp_config: erpDetails.config,
                                    store_id: storeDetails._id, event_type: 'place_order',
                                    user_agent: req.get('User-Agent'), order_details: orderDetails
                                }
                                erpService.ambar(erpData);
                            }
                        }
                        // update next invoice no
                        if(storeDetails.invoice_status) {
                            let incCount = 1;
                            if(orderDetails.vendor_list.length) { incCount = orderDetails.vendor_list.length; }
                            store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": incCount } }, function(err, response) { });
                        }
                        // decrease product stock
                        stockService.decProductStock(orderDetails.item_list);
                        // decrease coupon balance
                        if(orderDetails.coupon_list.length) { stockService.updateCouponBalance(orderDetails); }
                        // update offer redeem count
                        if(orderDetails.offer_details) { stockService.incOfferRedeemCount(orderDetails.offer_details); }
                        // order placed mail
                        mailService.sendOrderPlacedMail(null, orderDetails._id);
                        // order placed mail to vendor
                        if(orderDetails.vendor_list.length) {
                            mailService.sendOrderPlacedMailToVendor(orderDetails._id);
                        }
                        res.json({ status: true });
                    }
                    else {
                        res.json({ status: false, message: 'Order Update Failure' });
                    }
                });
            });
        }
        else {
            res.json({ status: false, message: 'Invalid Order' });
        }
    });
}

// update order details
exports.update_order = (req, res) => {
    req.body.modified_on = new Date();
    if(req.body.vendor_id) {
        let updateData = { "vendor_list.$": req.body };
        orderList.findOneAndUpdate({
            store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id),
            "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id) 
        }, { $set: updateData }, function(err, response) {
            if(!err) {
                res.json({ status: true });
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
    else {
        orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
        { $set: req.body }, function(err, response) {
            if(!err) {
                res.json({ status: true });
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
}

// update order status
exports.status_update = (req, res) => {
	orderList.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let orderDetails = response;
            if(req.body.vendor_id) {
                let vIndex = orderDetails.vendor_list.findIndex(obj => obj.vendor_id.toString()==req.body.vendor_id);
                if(vIndex!=-1) {
                    let vendorInfo = orderDetails.vendor_list[vIndex];
                    // order confirmed
                    if(req.body.order_status=='confirmed')
                    {
                        if(!vendorInfo.confirmed_on) {
                            orderList.findOneAndUpdate({
                                _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id) 
                            },
                            { $set: { "vendor_list.$.confirmed_on": new Date(), "vendor_list.$.order_status": "confirmed" } }, function(err, response) {
                                if(!err && response) {
                                    // send mail
                                    mailService.sendVendorOrderConfirmedMail(null, vendorInfo.vendor_id, orderDetails._id).then(result => {
                                        res.json({ status: true });
                                    }).catch(function(error) {
                                        res.json({ status: false, message: error });
                                    });
                                }
                                else { res.json({ status: false, error: err, message: "Invalid order" }); }
                            });
                        }
                        else { res.json({ status: true }); }
                    }
                    // order dispatched
                    else if(req.body.order_status=='dispatched')
                    {
                        if(!vendorInfo.dispatched_on) {
                            let setData = {
                                "vendor_list.$.dispatched_on": new Date(), "vendor_list.$.shipping_method": req.body.shipping_method,
                                "vendor_list.$.order_status": "dispatched"
                            };
                            if(!vendorInfo.confirmed_on) { setData["vendor_list.$.confirmed_on"] = new Date(); }
                            orderList.findOneAndUpdate({
                                _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id) 
                            }, { $set: setData }, function(err, response) {
                                if(!err && response) {
                                    // send mail
                                    mailService.sendVendorOrderDispatchedMail(null, vendorInfo.vendor_id, orderDetails._id).then(result => {
                                        res.json({ status: true });
                                    }).catch(function(error) {
                                        res.json({ status: false, message: error });
                                    });
                                }
                                else { res.json({ status: false, error: err, message: "Invalid order" }); }
                            });
                        }
                        else { res.json({ status: true }); }
                    }
                    // order delivered
                    else if(req.body.order_status=='delivered')
                    {
                        if(!vendorInfo.delivered_on) {
                            let setData = { "vendor_list.$.delivered_on": new Date(), "vendor_list.$.order_status": "delivered" };
                            if(!vendorInfo.confirmed_on) { setData["vendor_list.$.confirmed_on"] = new Date(); }
                            if(!vendorInfo.dispatched_on) { setData["vendor_list.$.dispatched_on"] = new Date(); }
                            orderList.findOneAndUpdate({
                                _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id) 
                            }, { $set: setData }, { new: true }, function(err, response) {
                                if(!err && response) {
                                    let orderCompleted = false;
                                    let dIndex = response.vendor_list.findIndex(obj => obj.order_status!='delivered' && obj.order_status!='cancelled');
                                    if(dIndex==-1) { orderCompleted = true; }
                                    // calculate commission
                                    storeService.calc_settlement_amount(response, req.body.vendor_id).then(() => {
                                        // send mail
                                        mailService.sendVendorOrderDeliveredMail(null, vendorInfo.vendor_id, orderDetails._id).then(result => {
                                            res.json({ status: true, order_completed: orderCompleted });
                                        }).catch(function(error) {
                                            res.json({ status: false, message: error });
                                        });
                                    }).catch((err) => { res.json(err); });
                                }
                                else { res.json({ status: false, error: err, message: "Invalid order" }); }
                            });
                        }
                        else { res.json({ status: true }); }
                    }
                    else { res.json({ status: false, message: "Invalid status" }); }
                }
                else { res.json({ status: false, message: "Invalid vendor" }); }
            }
            else {
                // order confirmed
                if(req.body.order_status=='confirmed')
                {
                    if(!orderDetails.confirmed_on) {
                        req.body.confirmed_on = new Date();
                        orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                        { $set: req.body }, function(err, response) {
                            if(!err) {
                                // send mail
                                mailService.sendOrderConfirmedMail(null, req.body._id).then(result => {
                                    let index = orderDetails.item_list.findIndex(object => object.customization_status);
                                    if(index!=-1) {
                                        // if customization exists
                                        mailService.sendCustomizationConfirmationMail(null, req.body._id).then(result => {
                                            res.json({ status: true });
                                        }).catch(function(error) {
                                            res.json({ status: false, message: error });
                                        });
                                    }
                                    else { res.json({ status: true }); }
                                }).catch(function(error) {
                                    res.json({ status: false, message: error });
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                        });
                    }
                    else { res.json({ status: true }); }
                }
                // order dispatched
                else if(req.body.order_status=='dispatched')
                {
                    if(!orderDetails.dispatched_on) {
                        if(!orderDetails.confirmed_on) { req.body.confirmed_on = new Date(); }
                        req.body.dispatched_on = new Date();
                        orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                        { $set: req.body }, function(err, response) {
                            if(!err) {
                                // send mail
                                mailService.sendOrderDispatchedMail(null, req.body._id, null).then(result => {
                                    res.json({ status: true });
                                }).catch(function(error) {
                                    res.json({ status: false, message: error });
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                        });
                    }
                    else { res.json({ status: true }); }
                }
                // order delivered
                else if(req.body.order_status=='delivered')
                {
                    if(!orderDetails.delivered_on) {
                        if(!orderDetails.confirmed_on) { req.body.confirmed_on = new Date(); }
                        if(!orderDetails.dispatched_on) { req.body.dispatched_on = new Date(); }
                        req.body.delivered_on = new Date();
                        req.body.payment_success = true;
                        orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
                        { $set: req.body }, function(err, response) {
                            if(!err) {
                                // send mail
                                mailService.sendOrderDeliveredMail(null, req.body._id).then(result => {
                                    res.json({ status: true, order_completed: true });
                                }).catch(function(error) {
                                    res.json({ status: false, message: error });
                                });
                            }
                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                        });
                    }
                    else { res.json({ status: true }); }
                }
                else { res.json({ status: false, message: "Invalid status" }); }
            }
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.cancel_order = (req, res) => {
    orderList.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "active" }, function(err, response) {
        if(!err && response) {
            let orderDetails = response;
            if(req.body.vendor_id) {
                // find vendor in order details
                let vIndex = orderDetails.vendor_list.findIndex(obj => obj.vendor_id==req.body.vendor_id);
                if(vIndex!=-1) {
                    let vendorInfo = orderDetails.vendor_list[vIndex];
                    // if vendor order not cancelled
                    if(vendorInfo.order_status!='cancelled')
                    {
                        // filter vendor items
                        let vendorItems = orderDetails.item_list.filter(obj => req.body.selected_items.indexOf(obj._id.toString())!=-1 && obj.vendor_id==req.body.vendor_id && obj.item_status!='c_confirmed');
                        if(vendorItems.length) {
                            let requestedItemIds = []; let cancelledItems = [];
                            vendorItems.forEach(obj => { requestedItemIds.push(obj._id.toString()); });
                            orderDetails.item_list.forEach(obj => {
                                if(requestedItemIds.indexOf(obj._id.toString()) != -1) {
                                    if(!obj.cancel_info) { obj.cancel_info = {}; }
                                    if(!obj.cancel_info.title) {
                                        obj.cancel_info.title = "Cancelled by store";
                                        if(req.body.cancel_reason) { obj.cancel_info.title = req.body.cancel_reason; }
                                    }
                                    if(req.body.type=='cancel') {
                                        obj.cancel_info.cancelled_on = new Date();
                                        obj.item_status = 'c_confirmed';
                                        cancelledItems.push(obj);
                                    }
                                    else {
                                        obj.cancel_info.declined_on = new Date();
                                        obj.item_status = 'c_declined';
                                    }
                                }
                            });
                            orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
                            { $set: { item_list: orderDetails.item_list } }, { new: true }, function(err, response) {
                                if(!err && response) {
                                    // revert product stock
                                    if(cancelledItems.length) { stockService.incProductStock(cancelledItems); }
                                    let orderDetails = response;
                                    let vendorItems = orderDetails.item_list.filter(obj => obj.vendor_id==req.body.vendor_id && obj.item_status!='c_confirmed');
                                    if(!vendorItems.length) {
                                        // update vendor order status
                                        orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id), "vendor_list.vendor_id": mongoose.Types.ObjectId(req.body.vendor_id) },
                                        { $set: { "vendor_list.$.cancelled_on": new Date(), "vendor_list.$.order_status": "cancelled" } }, { new: true }, function(err, response) {
                                            if(!err && response) {
                                                res.json({ status: true });
                                            }
                                            else { res.json({ status: false, error: err, message: "Invalid order" }); }
                                        });
                                    }
                                    else { res.json({ status: true }); }
                                }
                                else { res.json({ status: false, error: err, message: "Invalid order" }); }
                            });
                        }
                        else { res.json({ status: true }); }
                    }
                    else { res.json({ status: true }); }
                }
                else { res.json({ status: false, message: "Invalid vendor" }); }
            }
            else {
                if(orderDetails.order_status!='cancelled')
                {
                    // update order status
                    orderList.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderDetails._id) },
                    { $set: { order_status: 'cancelled', cancelled_on: new Date() } }, function(err, response) {
                        if(!err) {
                            // revert product stock
                            stockService.incProductStock(orderDetails.item_list);
                            // send mail to customer
                            mailService.sendOrderCancelledMail(null, orderDetails._id).then(result => {
                                res.json({ status: true });
                            }).catch(function(error) {
                                res.json({ status: false, message: error });
                            });
                        }
                        else { res.json({ status: false, error: err, message: "Invalid order" }); }
                    });
                }
                else { res.json({ status: true }); }
            }
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.resend_mail = (req, res) => {
    if(req.body.vendor_id)
    {
        if(req.body.type=='confirmed')
        {
            mailService.sendVendorOrderConfirmedMail(req.body.email, req.body.vendor_id, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='dispatched')
        {
            mailService.sendVendorOrderDispatchedMail(req.body.email, req.body.vendor_id, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='delivered')
        {
            mailService.sendVendorOrderDeliveredMail(req.body.email, req.body.vendor_id, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='cancelled')
        {
            mailService.sendVendorOrderCancelledMail(req.body.email, req.body.vendor_id, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else {
            res.json({ status: false, message: "Invalid mail type" });
        }
    }
    else {
        if(req.body.type=='placed')
        {
            mailService.sendOrderPlacedMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='confirmed')
        {
            mailService.sendOrderConfirmedMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='dispatched')
        {
            mailService.sendOrderDispatchedMail(req.body.email, req.body._id, null).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='delivered')
        {
            mailService.sendOrderDeliveredMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='review')
        {
            mailService.sendOrderReviewMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='cancelled')
        {
            mailService.sendOrderCancelledMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(req.body.type=='customization')
        {
            mailService.sendCustomizationConfirmationMail(req.body.email, req.body._id).then(result => {
                res.json({ status: true });
            }).catch(function(error) {
                res.json({ status: false, message: error });
            });
        }
        else if(mongoose.Types.ObjectId.isValid(req.body.type))
        {
            orderList.findOne({
                store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id),
                "item_groups._id": mongoose.Types.ObjectId(req.body.type)
            }, function(err, response) {
                if(!err && response) {
                    mailService.sendOrderDispatchedMail(req.body.email, req.body._id, req.body.type).then(result => {
                        res.json({ status: true });
                    }).catch(function(error) {
                        res.json({ status: false, message: error });
                    });
                }
                else { res.json({ status: false, error: err, message: "Invalid group" }); }
            });
        }
        else {
            res.json({ status: false, message: "Invalid mail type" });
        }
    }
}

// donations
exports.donation_list = (req, res) => {
    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
    donationList.aggregate([
        { $match : {
            store_id: mongoose.Types.ObjectId(req.id), status: 'active', created_on: { $gte: new Date(fromDate), $lt: new Date(toDate) }
        } },
        { $lookup:
            {
               from: 'customers',
               localField: 'customer_id',
               foreignField: '_id',
               as: 'customerDetails'
            }
        }
    ], function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

// guest orders
exports.guest_order_list = (req, res) => {
    // orderStatus -> placed, confirmed, dispatched, delivered, cancelled
    let orderStatus = req.body.type;
    if(orderStatus=="all") { orderStatus = { $in: [ 'placed', 'confirmed', 'dispatched' ] }; }
    let queryParams = {};
    let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
    let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
    if(req.body.guest_email=='all')
    {
        queryParams = {
            store_id: mongoose.Types.ObjectId(req.id), status: 'active', order_by: 'guest',
            order_status: orderStatus, [req.body.date_type]: { $gte: new Date(fromDate), $lt: new Date(toDate) }
        };
    }
    else {
        queryParams = {
            store_id: mongoose.Types.ObjectId(req.id), status: 'active', order_by: 'guest', guest_email: req.body.guest_email, 
            order_status: orderStatus, [req.body.date_type]: { $gte: new Date(fromDate), $lt: new Date(toDate) }
        };
    }
    orderList.aggregate([{ $match : queryParams }], function(err, response) {
        if(!err && response) { res.json({ status: true, list: response }); }
        else { res.json({ status: false, error: err, message: "Failure" }); }
    });
}

// item groups
exports.add_item_group = (req, res) => {
    orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id) },
    { $push: { item_groups: req.body } }, function(err, response) {
        if(!err) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.update_item_group = (req, res) => {
    if(req.body.dispatched_status) {
        req.body.dispatched_on = new Date();
    }
    orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id), "item_groups._id": mongoose.Types.ObjectId(req.body._id) },
    { $set: { "item_groups.$": req.body } }, { new: true }, function(err, response) {
        if(!err && response) {
            if(req.body.dispatched_status) {
                let groupItemsCount = 0; let pendingGrpDispatch = false;
                response.item_groups.forEach(obj => {
                    groupItemsCount += obj.items.length
                    if(!obj.dispatched_on) { pendingGrpDispatch = true; }
                });
                if(groupItemsCount===response.item_list.length && !pendingGrpDispatch) {
                    // dispatch completed
                    orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id) },
                    { $set: { order_status: 'dispatched', dispatched_on: new Date() } }, function(err, response) { });
                }
                mailService.sendOrderDispatchedMail(null, req.body.order_id, req.body._id).then(result => {
                    res.json({ status: true });
                }).catch(function(error) {
                    res.json({ status: false, message: error });
                });
            }
            else {
                res.json({ status: true });
            }
        }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

exports.remove_item_group = (req, res) => {
    orderList.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body.order_id) },
    { $pull: { item_groups: { _id: mongoose.Types.ObjectId(req.body._id) } } }, function(err, response) {
        if(!err) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}

// settlement orders
exports.settlement_orders = (req, res) => {
    if(req.body._id) {
        vendorSettlements.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.body._id) } },
            {
                $lookup: {
                    from: "order_list",
                    localField: "order_id",
                    foreignField: "_id",
                    as: "orderDetails"
                }
            }
        ], function(err, response) {
            if(!err && response[0]) {
                let vendorId = response[0].vendor_id.toString();
                let orderDetails = response[0].orderDetails[0];
                let vIndex = orderDetails.vendor_list.findIndex(obj => obj.vendor_id.toString()==vendorId);
                if(vIndex!=-1) {
                    response[0].item_list = orderDetails.item_list.filter(obj => obj.vendor_id.toString()==vendorId);
                    response[0].orderDetails = orderDetails.vendor_list[vIndex];
                    res.json({ status: true, data: response[0] });
                }
                else { res.json({ status: false, message: "Invalid vendor" }); }
            }
            else { res.json({ status: false, error: err, message: "Invalid order" }); }
        });
    }
    else {
        let queryParams = { store_id: mongoose.Types.ObjectId(req.id) };
        if(req.vendor_id) { queryParams.vendor_id = mongoose.Types.ObjectId(req.vendor_id); }
        else if(req.body.vendor_id != 'all') { queryParams.vendor_id = mongoose.Types.ObjectId(req.body.vendor_id); }
        // list_type -> all, paid, pending, failed, overdue
        queryParams.status = req.body.list_type;
        if(req.body.list_type=='all' || req.body.list_type=='paid') {
            queryParams.settlement_on = { $gte: new Date(req.body.from_date), $lt: new Date(req.body.to_date) };
            if(req.body.list_type=='all') { delete queryParams.status; }
        }
        else if(req.body.list_type=='overdue') {
            queryParams.status = { $ne: 'paid' };
            queryParams.settlement_on = { $lte: new Date() };
        }
        vendorSettlements.find(queryParams, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}

exports.update_settlement_order = (req, res) => {
    let updateData = {};
    if(req.body.status) { updateData.status = req.body.status; }
    if(req.body.settled_on) { updateData.settled_on = req.body.settled_on; }
    vendorSettlements.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) },
    { $set: updateData }, function(err, response) {
        if(!err) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Invalid order" }); }
    });
}