"use strict";
const mongoose = require('mongoose');
const giftCard = require("../../models/gift_card.model");
const imgUploadService = require("../../../services/img_upload.service");

exports.list = (req, res) => {
    giftCard.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) { res.json({ status: true, list: response.card_list }); }
        else { res.json({ status: false, error: err, message: "failure" }); }
    });
}

exports.add = (req, res) => {
    if(!req.body.rank) { req.body.rank = 0; }
    giftCard.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let cardList = response.card_list;
            if(cardList.findIndex(obj => obj.name==req.body.name) == -1) {
                // inc rank
                cardList.forEach((object) => {
                    if(req.body.rank <= object.rank) {
                        object.rank = object.rank+1;
                    }
                });
                // add
                let rootPath = 'uploads/'+req.id+'/giftcards';
                imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                    req.body.image = img;
                    cardList.push(req.body);
                    giftCard.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { card_list: cardList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.card_list }); }
                        else { res.json({ status: false, error: err, message: "Unable to add" }); }
                    });
                });
            }
            else {
                res.json({ status: false, message: "Name already exists" });
            }
        }
        else {
            let rootPath = 'uploads/'+req.id+'/giftcards';
            imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                req.body.image = img;
                giftCard.create({ store_id: req.id, card_list: [req.body] }, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response.card_list }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
    });
}

exports.update = (req, res) => {
    if(!req.body.prev_rank) { req.body.prev_rank = 0; }
    giftCard.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let cardList = response.card_list;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                cardList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                cardList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = cardList.findIndex(object => object._id.toString() == req.body._id);
            if(index != -1) {
                if(req.body.img_change) {
                    // upload new img
                    let rootPath = 'uploads/'+req.id+'/giftcards';
                    imgUploadService.singleFileUpload(req.body.image, rootPath, true, null).then((img) => {
                        req.body.image = img;
                        cardList[index] = req.body;
                        giftCard.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                        { $set: { card_list: cardList } }, { new: true }, function(err, response) {
                            if(!err && response) { res.json({ status: true, list: response.card_list }); }
                            else { res.json({ status: false, error: err, message: "Unable to update" }); }
                        });
                    });
                }
                else {
                    cardList[index] = req.body;
                    giftCard.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                    { $set: { card_list: cardList } }, { new: true }, function(err, response) {
                        if(!err && response) { res.json({ status: true, list: response.card_list }); }
                        else { res.json({ status: false, error: err, message: "Unable to update" }); }
                    });
                }
            }
            else {
                res.json({ status: false, message: "Invalid giftcard" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}

exports.hard_remove = (req, res) => {
    giftCard.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response)
        {
            let cardList = response.card_list;
            // dec rank
            cardList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = cardList.findIndex(object => object._id.toString() == req.body._id);
            if(index != -1) {
                cardList.splice(index, 1);
                // update
                giftCard.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { card_list: cardList } }, { new: true }, function(err, response) {
                    if(!err && response) { res.json({ status: true, list: response.card_list }); }
                    else { res.json({ status: false, error: err, message: "Unable to update" }); }
                });
            }
            else {
                res.json({ status: false, message: "Invalid giftcard" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid login" });
        }
    });
}