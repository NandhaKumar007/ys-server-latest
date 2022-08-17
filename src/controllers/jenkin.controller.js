const mongoose = require('mongoose');
const router = require('express').Router();
const store = require("../models/store.model");
const admin = require("../models/admin.model");

router.post("/job/:type", function(req, res) {
    if(req.params.type=='build') {
        admin.findOne({ jenkin_token: req.body.token }, function(err, response) {
            if(!err && response) {
                if(req.query.store_id && mongoose.Types.ObjectId.isValid(req.query.store_id)) {
                    store.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.query.store_id) },
                    { $set: { "build_details.build_number": req.body.build_number, "build_details.build_status": req.body.build_status } }, function(err, response) {
                        if(!err && response) { res.status(200).json({ status: true }); }
                        else { res.status(403).json({ message: "invalid store_id or unable to update" }); }
                    });
                }
                else { res.status(400).json({ message: "store_id does not exists" }); }
            }
            else { res.status(401).json({ message: "invalid user" }); }
        });
    }
    else if(req.params.type=='ssl') {
        admin.findOne({ jenkin_token: req.body.token }, function(err, response) {
            if(!err && response) {
                if(req.query.website) {
                    store.findOneAndUpdate({ website: req.query.website },
                    { $set: { "build_details.ssl_status": req.body.ssl_status } }, function(err, response) {
                        if(!err && response) { res.status(200).json({ status: true }); }
                        else { res.status(403).json({ message: "invalid website or unable to update" }); }
                    });
                }
                else { res.status(400).json({ message: "website does not exists" }); }
            }
            else { res.status(401).json({ message: "invalid user" }); }
        });
    }
    else { res.status(404).json({ message: "invalid type" }); }
});

module.exports = router;