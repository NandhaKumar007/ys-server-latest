"use strict";
const mongoose = require('mongoose');
const request = require('request');
const dateFormat = require('dateformat');
const customer = require("../../models/customer.model");
const appointments = require("../../models/appointments.model");
const appointmentServices = require("../../models/appointment_services.model");
const mailTemp = require('../../../config/mail-templates');
const setupConfig = require("../../../config/setup.config");
const mailService = require("../../../services/mail.service");
const commonService = require("../../../services/common.service");

exports.create = (req, res) => {
    customer.aggregate([
        { $match:
            { _id: mongoose.Types.ObjectId(req.id), status: "active" }
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
        if(!err && response[0])
        {
            req.body.customer_id = req.id;
            let customerDetails = response[0];
            let storeDetails = customerDetails.storeDetails[0];
            appointmentServices.findOne({ store_id: mongoose.Types.ObjectId(req.body.store_id), "list._id": mongoose.Types.ObjectId(req.body.service_id) }, function(err, response) {
                if(!err && response) {
                    let serviceDetails = response.list.filter(object => object._id.toString() == req.body.service_id);
                    if(serviceDetails.length) {
                        serviceDetails = serviceDetails[0];
                        let bookingCount = 0;
                        appointments.aggregate([{ $match: {
                            store_id: mongoose.Types.ObjectId(req.body.store_id), service_id: mongoose.Types.ObjectId(req.body.service_id),
                            booking_date: { $eq: new Date(req.body.booking_date) }, status: { $ne: 'inactive' }
                        } },
                        { $count: "booking_count" }], function(err, response) {
                            if(!err && response[0]) { bookingCount = response[0].booking_count; }
                            if(serviceDetails.no_of_concurrent_services > bookingCount) {
                                req.body.service_name = serviceDetails.name;
                                req.body.service_price = serviceDetails.price;
                                req.body.order_number = commonService.orderNumber();
                                if(customerDetails.unique_id) {
                                    req.body.order_number = req.body.order_number+'-'+customerDetails.unique_id;
                                }
                                appointments.create(req.body, function(err, response) {
                                    if(!err && response) {
                                        let appointmentDetails = response;
                                        // mail
                                        let mailConfig = setupConfig.mail_config;
                                        if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                                        let copyYear = new Date().getFullYear();
                                        let bookingDate = new Date(req.body.booking_date).toLocaleString('en-US', { timeZone: 'Asia/Calcutta' });
                                        mailTemp.appointment_confirmed(storeDetails).then((body) => {
                                            let bodyContent = body;
                                            let filePath = setupConfig.mail_base+storeDetails._id+'/appointment_confirmed.html';
                                            request.get(filePath, function (err, response, body) {
                                                if(!err && response.statusCode == 200) { bodyContent = body; }
                                                bodyContent = bodyContent.replace("##customer_name##", customerDetails.name);
                                                bodyContent = bodyContent.replace("##booking_date##", dateFormat(bookingDate, "mmmm d yyyy"));
                                                bodyContent = bodyContent.replace("##booking_time##", dateFormat(bookingDate, "h:MM TT"));
                                                bodyContent = bodyContent.replace("##service_name##", serviceDetails.name);
                                                bodyContent = bodyContent.replace("##copy_year##", copyYear);
                                                let sendData = {
                                                    store_name: storeDetails.name,
                                                    config: mailConfig,
                                                    sendTo: customerDetails.email,
                                                    subject: "Your appointment has been confirmed",
                                                    body: bodyContent,
                                                    cc_mail: storeDetails.email
                                                };
                                                if(storeDetails.mail_config.cc_mail) { sendData.cc_mail = storeDetails.mail_config.cc_mail }
                                                mailService.sendMailFromStore(sendData, function(err, response) {
                                                    res.json({ status: true, data: appointmentDetails });
                                                });
                                            });
                                        });
                                    }
                                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                                });
                            }
                            else { res.json({ status: false, message: "Selected slot was not available" }); }
                        });
                    }
                    else { res.json({ status: false, message: "Invalid service" }); }
                }
                else { res.json({ status: false, error: err, message: "Invalid service" }); }
            });
        }
        else { res.json({ status: false, error: err, message: "Invalid user" }); }
    });    
}

exports.list = (req, res) => {
    if(req.query.id) {
        appointments.findOne({ customer_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        appointments.find({ customer_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}