"use strict";
const ysOrders = require("../../models/ys_orders.model");

exports.payment_list = (req, res) => {
    let fromDate = new Date(req.body.from_date);
    let toDate = new Date(req.body.to_date);
    let queryParams = { status: req.body.list_type, created_on: { $gte: new Date(fromDate), $lt: new Date(toDate) } };
    if(req.body.type!='all') { queryParams.payment_type = req.body.type; }
    ysOrders.aggregate([
        { $match : queryParams },
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
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}