"use strict";
const jwt = require('jsonwebtoken');
const admin = require("../../models/admin.model");
const jwtConfig = require('../../../config/jwtsecret');

exports.login = (req, res) => {
    admin.findOne({ email: req.body.email }, function(err, response) {
        if(!err && response) {
            response.comparePassword(req.body.password, async function(err, isMatch) {
                if(!err && isMatch) {
                    let paymentTypes = [];
                    response.payment_types.filter(obj => obj.status=='active').forEach(element => {
                        paymentTypes.push({ name: element.name });
                    });
                    const payload = { id: response._id, session_key: response.session_key };
                    const token = jwt.sign(payload, jwtConfig.jwtSecretKey);
                    res.json({ status: true, token: token, payment_types: paymentTypes });
                }
                else {
                    res.json({ status: false, error: err, message: "Password Does not match" });
                }
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid User" });
        }
    });
}