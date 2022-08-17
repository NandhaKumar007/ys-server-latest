"use strict";
const mongoose = require('mongoose');
const customers = require("../../models/customer.model");
const modelHistory = require("../../models/model_history.model");
const guestUser = require("../../models/guest_user.model");
const commonService = require("../../../services/common.service");

exports.list = (req, res) => {
    let parentQueryParams = { store_id: mongoose.Types.ObjectId(req.id), status: 'active' };
    if(req.query.search) {
        req.query.search = '\"'+req.query.search.trim()+'\"';
        parentQueryParams.$text = { $search: req.query.search };
    }
    customers.countDocuments(parentQueryParams, function(err, count) {
        if(!err && count) {
            let queryParams = [{ $match: parentQueryParams }, { $sort : { _id : -1 } }];
            if(req.query.limit) {
                queryParams.push(
                    { $skip: parseInt(req.query.skip) },
                    { $limit : parseInt(req.query.limit) }
                );
            }
            customers.aggregate(queryParams, function(err, response) {
                if(!err && response[0]) { res.json({ status: true, count: count, list: response }); }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else { res.json({ status: true, count: 0, list: [] }); }
    });
}

exports.details = (req, res) => {
	customers.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.customer_id), status: 'active' }, function(err, response) {
        if(!err && response) { res.json({ status: true, data: response }); }
        else { res.json({ status: false, error: err, message: "Invalid customer" }); }
    });
}

exports.email_validate = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    customers.findOne({ store_id: mongoose.Types.ObjectId(req.id), email: req.query.email, status: "active" }, function(err, response) {
        if(!err && !response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Email already exists" }); }
    });
}

exports.add = (req, res) => {
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
    }
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    if(req.body.mobile) { req.body.mobile = req.body.mobile.trim(); }
    customers.findOne({ store_id: mongoose.Types.ObjectId(req.id), $or: [ { email: req.body.email }, { mobile: req.body.mobile } ], status: "active" }, function(err, response) {
        if(!err && response) {
            let customerData = response;
            if(customerData.email==req.body.email && customerData.mobile==req.body.mobile) {
                res.json({ status: false, message: "Email and Mobile already exists" });
            }
            else if(customerData.email==req.body.email) {
                res.json({ status: false, message: "Email already exists" });
            }
            else if(customerData.mobile==req.body.mobile) {
                res.json({ status: false, message: "Mobile already exists" });
            }
            else {
                res.json({ status: false, message: "Failure" });
            }
        }
        else {
            // get customers count
            customers.find({ store_id: mongoose.Types.ObjectId(req.id) }).countDocuments({}, function(err, totalCustomers) {
                req.body.unique_id = String(totalCustomers+1).padStart(6, '0');
                req.body.store_id = req.id;
                req.body.session_key = new Date().valueOf();
                if(req.body.address_list && req.body.address_list.length) {
                    req.body.address_list[0].name = commonService.stringCapitalize(req.body.address_list[0].name);
                }
                customers.create(req.body, function(err, response) {
                    if(!err && response) {
                        res.json({ status: true, data: response });  
                    }
                    else {
                        res.json({ status: false, error: err, message: "Unable to register" });
                    }
                });
            });
        }
    });
}

exports.update = (req, res) => {
    if(req.body.name) { req.body.name = commonService.stringCapitalize(req.body.name); }
    if(req.body.mobile) { req.body.mobile = req.body.mobile.trim(); }
    if(req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
        let queryParams = {
            store_id: mongoose.Types.ObjectId(req.id), email: req.body.email, status: 'active',
            _id: { $ne: mongoose.Types.ObjectId(req.body._id) }
        };
        if(req.body.mobile) {
            queryParams = {
                store_id: mongoose.Types.ObjectId(req.id), $or: [ { email: req.body.email }, { mobile: req.body.mobile } ],
                status: 'active', _id: { $ne: mongoose.Types.ObjectId(req.body._id) }
            };
        }
        customers.findOne(queryParams, function(err, response) {
            if(!err && response) {
                let customerData = response;
                if(customerData.email==req.body.email && customerData.mobile==req.body.mobile) {
                    res.json({ status: false, message: "Email and Mobile already exists" });
                }
                else if(customerData.email==req.body.email) {
                    res.json({ status: false, message: "Email already exists" });
                }
                else if(customerData.mobile==req.body.mobile) {
                    res.json({ status: false, message: "Mobile already exists" });
                }
                else {
                    res.json({ status: false, message: "Failure" });
                }
            }
            else {
                customers.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        });
    }
    else {
        customers.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
            if(!err && response) { res.json({ status: true }); }
            else { res.json({ status: false, error: err, message: "Failure" }); }
        });
    }
}

exports.abandoned_carts = (req, res) => {
	// get prev 1 hr time
    let newDate = new Date().setHours( new Date().getHours() - 1 );
    let parentQueryParams = {
        store_id: mongoose.Types.ObjectId(req.id), status: 'active', 'cart_list.0': { $exists: true },
        cart_updated_on: { $lte: new Date(newDate) }
    };
    if(req.query.search) {
        req.query.search = '\"'+req.query.search.trim()+'\"';
        parentQueryParams.$text = { $search: req.query.search };
    }
    customers.countDocuments(parentQueryParams, function(err, count) {
        if(!err && count) {
            let queryParams = [{ $match: parentQueryParams }, { $sort : { cart_updated_on : -1 } }];
            if(req.query.limit) {
                queryParams.push(
                    { $skip: parseInt(req.query.skip) },
                    { $limit : parseInt(req.query.limit) }
                );
            }
            customers.aggregate(queryParams, function(err, response) {
                if(!err && response[0]) { res.json({ status: true, count: count, list: response }); }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else { res.json({ status: true, count: 0, list: [] }); }
    });
}

// custom model
exports.add_model_history = (req, res) => {
    req.body.updated_by = req.id;
    if(req.login_type=='subuser') { req.body.updated_by = req.subuser_id; }
    modelHistory.create(req.body, function(err, response) {
        if(!err && response) { res.json({ status: true }); }
        else { res.json({ status: false, error: err, message: "Unable to add" }); }
    });
}

exports.model_history_list = (req, res) => {
    if(mongoose.Types.ObjectId.isValid(req.query.customer_id) && mongoose.Types.ObjectId.isValid(req.query.model_id)) {
        modelHistory.find({
            store_id: mongoose.Types.ObjectId(req.id), customer_id: mongoose.Types.ObjectId(req.query.customer_id),
            model_id: mongoose.Types.ObjectId(req.query.model_id)
        }, function(err, response) {
            if(!err && response) { res.json({ status: true, list: response }); }
            else { res.json({ status: false, error: err, message: "failure" }); }
        });
    }
    else {
        res.json({ status: false, message: "Invalid params" });
    }
}

// guest users
exports.guest_user = (req, res) => {
    if(req.query.id) {
        guestUser.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.query.id), status: 'active' }, function(err, response) {
            if(!err && response) { res.json({ status: true, data: response }); }
            else { res.json({ status: false, error: err, message: "Invalid guest user" }); }
        });
    }
    else {
        let parentQueryParams = { store_id: mongoose.Types.ObjectId(req.id), status: 'active' };
        if(req.query.search) {
            req.query.search = '\"'+req.query.search.trim()+'\"';
            parentQueryParams.$text = { $search: req.query.search };
        }
        guestUser.countDocuments(parentQueryParams, function(err, count) {
            if(!err && count) {
                let queryParams = [{ $match: parentQueryParams }, { $sort : { login_on : -1 } }];
                if(req.query.limit) {
                    queryParams.push(
                        { $skip: parseInt(req.query.skip) },
                        { $limit : parseInt(req.query.limit) }
                    );
                }
                guestUser.aggregate(queryParams, function(err, response) {
                    if(!err && response[0]) { res.json({ status: true, count: count, list: response }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else { res.json({ status: true, count: 0, list: [] }); }
        });
    } 
}

exports.abandoned_guest_user = (req, res) => {
	// get prev 1 hr time
    let newDate = new Date().setHours( new Date().getHours() - 1 );
    let parentQueryParams = {
        store_id: mongoose.Types.ObjectId(req.id), status: 'active', 'cart_list.0': { $exists: true },
        cart_updated_on: { $lte: new Date(newDate) }
    };
    if(req.query.search) {
        req.query.search = '\"'+req.query.search.trim()+'\"';
        parentQueryParams.$text = { $search: req.query.search };
    }
    guestUser.countDocuments(parentQueryParams, function(err, count) {
        if(!err && count) {
            let queryParams = [{ $match: parentQueryParams }, { $sort : { cart_updated_on : -1 } }];
            if(req.query.limit) {
                queryParams.push(
                    { $skip: parseInt(req.query.skip) },
                    { $limit : parseInt(req.query.limit) }
                );
            }
            guestUser.aggregate(queryParams, function(err, response) {
                if(!err && response[0]) { res.json({ status: true, count: count, list: response }); }
                else { res.json({ status: false, error: err, message: "failure" }); }
            });
        }
        else { res.json({ status: true, count: 0, list: [] }); }
    });
}