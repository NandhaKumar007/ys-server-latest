const mongoose = require('mongoose');
const storeProperties = require('../../models/store_properties.model');

exports.list = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { img_tag_list: 1, auto_tags: 1 }, function (err, response) {
        if (!err && response) {
            res.json({ status: true, list: response.img_tag_list, auto_tags: response.auto_tags });
        } else {
            res.json({ status: false, erroe: err, message: "failure" });
        }
    });
}

exports.add = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { img_tag_list: 1 }, function (err, response) {
        if (!err && response) {
            let imageTags = response.img_tag_list;
            let index = imageTags.findIndex(object => object.name == req.body.name);
            if (index == -1) {
                // inc rank
                imageTags.forEach((object) => {
                    if (req.body.rank <= object.rank) {
                        object.rank = object.rank + 1;
                    }
                });
                // add
                imageTags.push(req.body);
                storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) }, { $set: { img_tag_list: imageTags } },
                { new: true }, function (err, response) {
                    if (!err && response) {
                        res.json({ status: true, list: response.img_tag_list, auto_tags: response.auto_tags });
                    }
                    else { res.json({ status: false, erroe: err, message: 'Unable to add' }); }
                });
            }
            else { res.json({ status: false, error: err, message: 'Name already exists' }); }
        }
        else { res.json({ status: false, error: err, message: 'Invalid login' }); }
    });
}

exports.update = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { img_tag_list: 1 }, function (err, response) {
        if (!err && response) {
            let imageTags = response.img_tag_list;
            if(req.body.prev_rank < req.body.rank) {
                //  dec rank
                imageTags.forEach((obj) => {
                    if (req.body.prev_rank < obj.rank && req.body.rank >= obj.rank) {
                        obj.rank = obj.rank - 1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank) {
                // inc rank
                imageTags.forEach((obj) => {
                    if (req.body.prev_rank > obj.rank && req.body.rank <= obj.rank) {
                        obj.rank = obj.rank + 1;
                    }
                });
            }
            let index = imageTags.findIndex(obj => obj._id == req.body._id);
            if(index != -1) {
                imageTags[index] = req.body;
                storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { img_tag_list: imageTags } }, { new: true }, function (err, response) {
                    if (!err && response) {
                        res.json({ status: true, list: response.img_tag_list, auto_tags: response.auto_tags });
                    }
                    else { res.json({ status: false, error: err, message: "Unable to Update" }); }
                });
            }
            else { res.json({ status: false, error: err, message: 'Failure' }); }
        }
        else { res.json({ status: false, error: err, message: 'Invalid login' }); }
    });
}

exports.hard_remove = (req, res) => {
    storeProperties.findOne({ store_id: mongoose.Types.ObjectId(req.id) }, { img_tag_list: 1 }, function (err, response) {
        if (!err && response) {
            let imageTags = response.img_tag_list;
            // dec rank
            imageTags.forEach((obj) => {
                if (req.body.rank < obj.rank) {
                    obj.rank = obj.rank - 1;
                }
            });
            let index = imageTags.findIndex(obj => obj._id == req.body._id);
            if(index != -1) {
                imageTags.splice(index, 1);
                // update 
                storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
                { $set: { img_tag_list: imageTags } }, { new: true }, function (err, response) {
                    if (!err && response) {
                        res.json({ status: true, list: response.img_tag_list, auto_tags: response.auto_tags });
                    }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else { res.json({ status: false, error: "Invalid Image Tag", message: "Failure" }); }
        }
        else { res.json({ status: false, error: err, message: 'Invalid login' }); }
    });
}

exports.update_auto_tags = (req, res) => {
    storeProperties.findOneAndUpdate({ store_id: mongoose.Types.ObjectId(req.id) },
    { $set: { auto_tags: req.body.auto_tags } }, { new: true }, function (err, response) {
        if (!err && response) {
            res.json({ status: true, list: response.img_tag_list, auto_tags: response.auto_tags });
        }
        else { res.json({ status: false, error: err, message: "Unable to Update" }); }
    });
}