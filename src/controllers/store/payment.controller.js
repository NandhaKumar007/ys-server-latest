"use strict";
const mongoose = require('mongoose');
const customer = require("../../models/customer.model");
const guestUser = require("../../models/guest_user.model");
const orderList = require('../../models/order_list.model');
const couponCodes = require("../../models/coupon_codes.model");
const donationList = require("../../models/donation_list.model");
const store = require("../../models/store.model");
const paymentStatusService = require("../../../services/payment_status.service");
const mailService = require("../../../services/mail.service");
const stockService = require("../../../services/stock.service");
const commonService = require("../../../services/common.service");
const erpService = require("../../../services/erp.service");
const validationService = require("../../../services/validation.service");

exports.ccavenue_payment_status = (req, res) => {
    if(req.body.type=='product') {
		orderList.aggregate([
			{ $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive" } },
			{
				$lookup: {
					from: "stores",
					localField: "store_id",
					foreignField: "_id",
					as: "store_details"
				}
			}
		], function(err, response) {
			if(!err && response[0]) {
				let orderDetails = response[0];
                if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
				let storeDetails = orderDetails.store_details[0];
				let ccAvenueDetails = storeDetails.payment_types.filter(obj => obj.name=='CCAvenue');
				if(ccAvenueDetails.length)
				{
					paymentStatusService.ccavenuePaymentStatus(orderDetails, ccAvenueDetails[0].additional_params, 'product').then((paymentData) => {
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
                            { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentData.reference_no, status: "active" } }, function(err, response) {
                                if(!err && response)
                                {
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
                                    res.json({ status: true, message: "status updated successfully" });
                                }
                                else {
                                    res.json({ status: false, message: "status update failure" });
                                }
                            });
                        });
					}).catch((paymentData) => {
                        res.json({ status: false, data: paymentData });
                    });
				}
				else {
					res.json({ status: false, message: "Invalid payment method" });
				}
			}
			else {
				res.json({ status: false, error: err, message: "Failure" });
			}
		});
    }
    else if(req.body.type=='giftcard') {
        couponCodes.aggregate([
			{ $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive" } },
			{
				$lookup: {
					from: "stores",
					localField: "store_id",
					foreignField: "_id",
					as: "store_details"
				}
			}
		], function(err, response) {
			if(!err && response[0]) {
				let orderDetails = response[0];
				let storeDetails = orderDetails.store_details[0];
				let ccAvenueDetails = storeDetails.payment_types.filter(obj => obj.name=='CCAvenue');
				if(ccAvenueDetails.length)
				{
					paymentStatusService.ccavenuePaymentStatus(orderDetails, ccAvenueDetails[0].additional_params, 'giftcard').then((paymentData) => {
						// invoice number
						let invoiceNum = "";
						if(storeDetails.invoice_status) {
							invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
						}
                        // update coupon status
                        couponCodes.findByIdAndUpdate(orderDetails._id,
                        { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentData.reference_no, status: "active" } }, function(err, response) {
                            if(!err && response)
                            {
								// update next invoice no
								if(invoiceNum) {
									store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
								}
								// send mail
                                mailService.sendGiftCardPurchaseMail(orderDetails._id);
                                res.json({ status: true, message: "status updated successfully" });
                            }
                            else {
                                res.json({ status: false, message: "status update failure" });
                            }
                        });
					}).catch((paymentData) => {
                        res.json({ status: false, data: paymentData });
                    });
				}
				else {
					res.json({ status: false, message: "Invalid payment method" });
				}
			}
			else {
				res.json({ status: false, error: err, message: "Failure" });
			}
        });
    }
    else if(req.body.type=='donation') {
        donationList.aggregate([
			{ $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive" } },
			{
				$lookup: {
					from: "stores",
					localField: "store_id",
					foreignField: "_id",
					as: "store_details"
				}
			}
		], function(err, response) {
			if(!err && response[0]) {
				let orderDetails = response[0];
				let storeDetails = orderDetails.store_details[0];
				let ccAvenueDetails = storeDetails.payment_types.filter(obj => obj.name=='CCAvenue');
				if(ccAvenueDetails.length)
				{
					paymentStatusService.ccavenuePaymentStatus(orderDetails, ccAvenueDetails[0].additional_params, 'donation').then((paymentData) => {
                        // update donation status
                        donationList.findByIdAndUpdate(orderDetails._id,
                        { $set: { payment_success: true, "payment_details.payment_id": paymentData.reference_no, status: "active" } }, function(err, response) {
                            if(!err && response)
                            {
                                // send mail
                                mailService.sendDonationMail(null, orderDetails._id);
                                res.json({ status: true, message: "status updated successfully" });
                            }
                            else {
                                // update order status failure
                                res.json({ status: false, error: err, message: 'Order Update Failure' });
                            }
                        });
					}).catch((paymentData) => {
                        res.json({ status: false, data: paymentData });
                    });
				}
				else {
					res.json({ status: false, message: "Invalid payment method" });
				}
			}
			else {
				res.json({ status: false, error: err, message: "Failure" });
			}
        });
    }
	else {
		res.json({ status: false, message: "Invalid order type" });
	}
}

exports.razorpay_payment_status = (req, res) => {
    if(req.body.type=='product') {
		orderList.aggregate([
			{ $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive" } },
			{
				$lookup: {
					from: "stores",
					localField: "store_id",
					foreignField: "_id",
					as: "store_details"
				}
			}
		], function(err, response) {
			if(!err && response[0]) {
				let orderDetails = response[0];
                if(!orderDetails.vendor_list) { orderDetails.vendor_list = []; }
				let storeDetails = orderDetails.store_details[0];
				let razorpayDetails = storeDetails.payment_types.filter(obj => obj.name=='Razorpay');
				if(razorpayDetails.length)
				{
					paymentStatusService.razorpayPaymentStatus(orderDetails, razorpayDetails[0].config, 'product').then((paymentData) => {
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
                            { $set: { invoice_number: invoiceNum, vendor_list: updatedVendorList, payment_success: true, "payment_details.payment_id": paymentData.id, status: "active" } }, function(err, response) {
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
                                    res.json({ status: true, message: "status updated successfully" });
                                }
                                else {
                                    res.json({ status: false, message: "status update failure" });
                                }
                            });
                        });
					}).catch((paymentData) => {
                        res.json({ status: false, data: paymentData });
                    });
				}
				else {
					res.json({ status: false, message: "Invalid payment method" });
				}
			}
			else {
				res.json({ status: false, error: err, message: "Failure" });
			}
		});
    }
    else if(req.body.type=='giftcard') {
        couponCodes.aggregate([
			{ $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive" } },
			{
				$lookup: {
					from: "stores",
					localField: "store_id",
					foreignField: "_id",
					as: "store_details"
				}
			}
		], function(err, response) {
			if(!err && response[0]) {
				let orderDetails = response[0];
				let storeDetails = orderDetails.store_details[0];
				let razorpayDetails = storeDetails.payment_types.filter(obj => obj.name=='Razorpay');
				if(razorpayDetails.length)
				{
					paymentStatusService.razorpayPaymentStatus(orderDetails, razorpayDetails[0].config, 'giftcard').then((paymentData) => {
						// invoice number
						let invoiceNum = "";
						if(storeDetails.invoice_status) {
							invoiceNum = commonService.invoiceNumber(storeDetails.invoice_config);
						}
                        // update coupon status
                        couponCodes.findByIdAndUpdate(orderDetails._id,
                        { $set: { invoice_number: invoiceNum, payment_success: true, "payment_details.payment_id": paymentData.id, status: "active" } }, function(err, response) {
                            if(!err && response)
                            {
								// update next invoice no
								if(invoiceNum) {
									store.findByIdAndUpdate(storeDetails._id, { $inc: { "invoice_config.next_invoice_no": 1 } }, function(err, response) { });
								}
								// send mail
                                mailService.sendGiftCardPurchaseMail(orderDetails._id);
                                res.json({ status: true, message: "status updated successfully" });
                            }
                            else {
                                res.json({ status: false, message: "status update failure" });
                            }
                        });
					}).catch((paymentData) => {
                        res.json({ status: false, data: paymentData });
                    });
				}
				else {
					res.json({ status: false, message: "Invalid payment method" });
				}
			}
			else {
				res.json({ status: false, error: err, message: "Failure" });
			}
        });
    }
    else if(req.body.type=='donation') {
        donationList.aggregate([
			{ $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id), status: "inactive" } },
			{
				$lookup: {
					from: "stores",
					localField: "store_id",
					foreignField: "_id",
					as: "store_details"
				}
			}
		], function(err, response) {
			if(!err && response[0]) {
				let orderDetails = response[0];
				let storeDetails = orderDetails.store_details[0];
				let razorpayDetails = storeDetails.payment_types.filter(obj => obj.name=='Razorpay');
				if(razorpayDetails.length)
				{
					paymentStatusService.razorpayPaymentStatus(orderDetails, razorpayDetails[0].config, 'donation').then((paymentData) => {
                        // update donation status
                        donationList.findByIdAndUpdate(orderDetails._id,
                        { $set: { payment_success: true, "payment_details.payment_id": paymentData.id, status: "active" } }, function(err, response) {
                            if(!err && response)
                            {
                                // send mail
                                mailService.sendDonationMail(null, orderDetails._id);
                                res.json({ status: true, message: "status updated successfully" });
                            }
                            else {
                                // update order status failure
                                res.json({ status: false, error: err, message: 'Order Update Failure' });
                            }
                        });
					}).catch((paymentData) => {
                        res.json({ status: false, data: paymentData });
                    });
				}
				else {
					res.json({ status: false, message: "Invalid payment method" });
				}
			}
			else {
				res.json({ status: false, error: err, message: "Failure" });
			}
        });
    }
	else {
		res.json({ status: false, message: "Invalid order type" });
	}
}