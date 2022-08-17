"use strict";
const mongoose = require('mongoose');
const request = require('request');
const dateFormat = require('dateformat');
const quotation = require("../../models/quotation.model");
const mailService = require("../../../services/mail.service");
const setupConfig = require('../../../config/setup.config');

exports.quote_request = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.params.quote_id) && mongoose.Types.ObjectId.isValid(req.params.store_id))
    {
        quotation.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.params.quote_id),
                    store_id: mongoose.Types.ObjectId(req.params.store_id), status: 'active'
                }
            },
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
                let quotDetails = response[0];
                let storeDetails = quotDetails.store_details[0];
                let redirectUrl = storeDetails.base_url+'/quote-status/'+quotDetails._id+'/'+req.params.type;
                // mail
                let mailConfig = setupConfig.mail_config;
                if(storeDetails.mail_config.transporter) { mailConfig = storeDetails.mail_config; }
                // send mail to store owner
                let currentDate = dateFormat(new Date(quotDetails.created_on), "mmmm d yyyy");
                if(req.params.type=='approve')
                {
                    let filePath = setupConfig.mail_base+storeDetails._id+'/quote_approve.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##quote_number##", quotDetails.quot_number);
                            bodyContent = bodyContent.replace("##quote_number##", quotDetails.quot_number);
                            bodyContent = bodyContent.replace("##quote_date##", currentDate);
                            bodyContent = bodyContent.replace("##customer_name##", quotDetails.customer_name);
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: storeDetails.email,
                                subject: "The Quote ID: "+quotDetails.quot_number+" - Approved",
                                body: bodyContent
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.sendTo = storeDetails.mail_config.cc_mail }
                            // send mail
                            mailService.sendMailFromStore(sendData, function(err, response) {
                                res.writeHead(301, { Location: redirectUrl });
                                res.end();
                            });
                        }
                        else {
                            res.writeHead(301, { Location: redirectUrl });
                            res.end();
                        }
                    });
                }
                else if(req.params.type=='revision')
                {
                    let filePath = setupConfig.mail_base+storeDetails._id+'/quote_revision.html';
                    request.get(filePath, function (err, response, body) {
                        if(!err && response.statusCode == 200) {
                            let bodyContent = body;
                            bodyContent = bodyContent.replace("##quote_number##", quotDetails.quot_number);
                            bodyContent = bodyContent.replace("##quote_number##", quotDetails.quot_number);
                            bodyContent = bodyContent.replace("##quote_date##", currentDate);
                            bodyContent = bodyContent.replace("##customer_name##", quotDetails.customer_name);
                            bodyContent = bodyContent.replace("##copy_year##", new Date().getFullYear());
                            let sendData = {
                                store_name: storeDetails.name,
                                config: mailConfig,
                                sendTo: storeDetails.email,
                                subject: "The Quote ID: "+quotDetails.quot_number+" - Revision Requested",
                                body: bodyContent
                            };
                            if(storeDetails.mail_config.cc_mail) { sendData.sendTo = storeDetails.mail_config.cc_mail }
                            // send mail
                            mailService.sendMailFromStore(sendData, function(err, response) {
                                res.writeHead(301, { Location: redirectUrl });
                                res.end();
                            });
                        }
                        else {
                            res.writeHead(301, { Location: redirectUrl });
                            res.end();
                        }
                    });
                }
                else {
                    res.writeHead(301, { Location: redirectUrl });
                    res.end();
                }
            }
            else {
                res.json({ status: false, message: "Invalid quotation" });
            }
        });
    }
    else {
        res.json({ status: false, message: "Invalid quotation" });
    }
}