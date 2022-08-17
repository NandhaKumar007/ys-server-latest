"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const appointments = require("../../models/appointments.model");

exports.list = (req, res) => {
    if(req.body._id) {
        appointments.aggregate([
            { $match : { store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) } },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
            }
        ], function(err, response) {
            if(!err && response) { res.json({ status: true, data: response[0] }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
    else {
        let fromDate = new Date(req.body.from_date).setHours(0,0,0,0);
        let toDate = new Date(req.body.to_date).setHours(23,59,59,999);
        appointments.aggregate([
            { $match : { store_id: mongoose.Types.ObjectId(req.id), status: { $ne: 'inactive' }, booking_date: { $gte: new Date(fromDate), $lt: new Date(toDate) } } },
            { $lookup:
                {
                   from: 'customers',
                   localField: 'customer_id',
                   foreignField: '_id',
                   as: 'customerDetails'
                }
            }
        ], function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}