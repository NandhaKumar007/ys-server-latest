"use strict";
const mongoose = require('mongoose');
const fs = require("fs");
const menus = require("../../models/menu.model");
const imgUploadService = require("../../../services/img_upload.service");

/** MENU **/
exports.menu_list = (req, res) => {
    menus.find({ store_id: mongoose.Types.ObjectId(req.id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.menu_details = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, data: response });
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add_menu = (req, res) => {
	req.body.store_id = req.id;
	menus.findOne({ store_id: mongoose.Types.ObjectId(req.id), name: req.body.name }, function(err, response) {
        if(!err && !response)
        {
            // inc rank
            menus.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gte: req.body.rank } },
            { $inc: { "rank": 1 } }, function(err, response) {
                // add
                menus.create(req.body, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Unable to add" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Name already exists" });
        }
    });
}

exports.update_menu = (req, res) => {
	menus.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                menus.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.prev_rank, $lte : req.body.rank } },
                { $inc: { "rank": -1 } }, function(err, response) {
                    // update
                    menus.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                menus.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $lt: req.body.prev_rank, $gte : req.body.rank } },
                { $inc: { "rank": 1 } }, function(err, response) {
                    // update
                    menus.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                        if(!err && response) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "Failure" }); }
                    });
                });
            }
            else {
                // update
                menus.findByIdAndUpdate(req.body._id, { $set: req.body }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.remove_menu = (req, res) => {
	menus.findOne({ _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            // dec rank
            menus.updateMany({ store_id: mongoose.Types.ObjectId(req.id), rank: { $gt: req.body.rank } },
            { $inc: { "rank": -1 } }, function(err, response) {
                // remove
                menus.findOneAndRemove({ _id: req.body._id }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "Failure" }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.update_menu_images = (req, res) => {
    menus.findOne({ store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response)
        {
            let rootPath = 'uploads/'+req.id+'/menu';
            let existingImgList = response.menu_images;
            let newImgList = req.body.menu_images.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
            MultiFileUpload(existingImgList, newImgList, rootPath).then((imgList) => {
                menus.findOneAndUpdate({
                    store_id: mongoose.Types.ObjectId(req.id), _id: mongoose.Types.ObjectId(req.body._id)
                },
                { $set: { "menu_images": imgList } }, function(err, response) {
                    if(!err) { res.json({ status: true }); }
                    else { res.json({ status: false }); }
                });
            });
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Menu" });
        }
    });
}

/** SECTION **/
exports.section_list = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.query.menu_id) }, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response.sections });
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.section_details = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body._id) }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body._id);
            if(section.length) {
                res.json({ status: true, data: section[0] });
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Failure" });
        }
    });
}

exports.add_section = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id) }, function(err, response) {
        if(!err && response)
        {
            let sectionList = response.sections;
            if(sectionList.findIndex(obj => obj.name==req.body.name) == -1) {
                // inc rank
                sectionList.forEach((object) => {
                    if(req.body.rank <= object.rank) {
                        object.rank = object.rank+1;
                    }
                });
                // add
                sectionList.push(req.body);
                menus.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.menu_id) },
                { $set: { sections: sectionList } }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, message: "Name already exists" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.update_section = (req, res) => {
	menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id) }, function(err, response) {
        if(!err && response)
        {
            let sectionList = response.sections;
            if(req.body.prev_rank < req.body.rank)
            {
                // dec rank
                sectionList.forEach((object) => {
                    if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                        object.rank = object.rank-1;
                    }
                });
            }
            else if(req.body.prev_rank > req.body.rank)
            {
                // inc rank
                sectionList.forEach((object) => {
                    if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                        object.rank = object.rank+1;
                    }
                });
            }
            let index = sectionList.findIndex(object => object._id.toString() == req.body._id);
            if(index != -1) {
                // update
                sectionList[index] = req.body;
                menus.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.menu_id) },
                { $set: { sections: sectionList } }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }  
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.remove_section = (req, res) => {
	menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id) }, function(err, response) {
        if(!err && response)
        {
            let sectionList = response.sections;
            // dec rank
            sectionList.forEach((object) => {
                if(req.body.rank<object.rank) {
                    object.rank = object.rank-1;
                }
            });
            let index = sectionList.findIndex(object => object._id.toString() == req.body._id);
            if(index != -1) {
                sectionList.splice(index, 1);
                // update
                menus.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(req.body.menu_id) },
                { $set: { sections: sectionList } }, function(err, response) {
                    if(!err && response) { res.json({ status: true }); }
                    else { res.json({ status: false, error: err, message: "failure" }); }
                });
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

/** CATEGORIES **/
exports.category_list = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.query.menu_id), "sections._id": mongoose.Types.ObjectId(req.query.section_id) }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.query.section_id);
            if(section.length) {
                res.json({ status: true, list: section[0].categories });
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.category_details = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length) {
                let category = section[0].categories.filter(object => object._id.toString()==req.body._id);
                if(category.length) {
                    res.json({ status: true, data: category[0] });
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.add_category = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length)
            {
                let categoryList = section[0].categories;
                if(categoryList.findIndex(obj => obj.name==req.body.name) == -1) {
                    // inc rank
                    categoryList.forEach((object) => {
                        if(req.body.rank <= object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                    // add
                    categoryList.push(req.body);
                    menus.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) },
                    { $set: { "sections.$.categories": categoryList } },
                    function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else {
                    res.json({ status: false, message: "Name already exists" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.update_category = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length)
            {
                let categoryList = section[0].categories;
                if(req.body.prev_rank < req.body.rank)
                {
                    // dec rank
                    categoryList.forEach((object) => {
                        if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                            object.rank = object.rank-1;
                        }
                    });
                }
                else if(req.body.prev_rank > req.body.rank)
                {
                    // inc rank
                    categoryList.forEach((object) => {
                        if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                            object.rank = object.rank+1;
                        }
                    });
                }
                let index = categoryList.findIndex(object => object._id.toString() == req.body._id);
                if(index != -1) {
                    categoryList[index] = req.body;
                    // update
                    menus.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) },
                    { $set: { "sections.$.categories": categoryList } },
                    function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.remove_category = (req, res) => {
    menus.findOne({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length)
            {
                let categoryList = section[0].categories;
                // dec rank
                categoryList.forEach((object) => {
                    if(req.body.rank<object.rank) {
                        object.rank = object.rank-1;
                    }
                });
                let index = categoryList.findIndex(object => object._id.toString() == req.body._id);
                if(index != -1) {
                    categoryList.splice(index, 1);
                    // update
                    menus.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id) },
                    { $set: { "sections.$.categories": categoryList } },
                    function(err, response) {
                        if(!err) { res.json({ status: true }); }
                        else { res.json({ status: false, error: err, message: "failure" }); }
                    });
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

/** SUB-CATEGORIES **/
exports.sub_category_list = (req, res) => {
    menus.findOne({
        _id: mongoose.Types.ObjectId(req.query.menu_id), "sections._id": mongoose.Types.ObjectId(req.query.section_id),
        "sections.categories._id": mongoose.Types.ObjectId(req.query.cat_id)
    }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.query.section_id);
            if(section.length) {
                let category = section[0].categories.filter(object => object._id.toString()==req.query.cat_id);
                if(category.length) {
                    res.json({ status: true, list: category[0].sub_categories });
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.sub_category_details = (req, res) => {
    menus.findOne({
        _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id),
        "sections.categories._id": mongoose.Types.ObjectId(req.body.cat_id)
    }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length) {
                let category = section[0].categories.filter(object => object._id.toString()==req.body.cat_id);
                if(category.length) {
                    let subCategory = category[0].sub_categories.filter(object => object._id.toString()==req.body._id);
                    if(subCategory.length) {
                        res.json({ status: true, data: subCategory[0] });
                    }
                    else {
                        res.json({ status: false, message: "Invalid sub-category" });
                    }
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "failure" });
        }
    });
}

exports.add_sub_category = (req, res) => {
    menus.findOne({
        _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id),
        "sections.categories._id": mongoose.Types.ObjectId(req.body.cat_id)
    }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length) {
                let category = section[0].categories.filter(object => object._id.toString()==req.body.cat_id);
                if(category.length) {
                    let subCategory = category[0].sub_categories;
                    if(subCategory.findIndex(obj => obj.name==req.body.name) == -1) {
                        // inc rank
                        subCategory.forEach((object) => {
                            if(req.body.rank <= object.rank) {
                                object.rank = object.rank+1;
                            }
                        });
                        // add
                        subCategory.push(req.body);
                        menus.findOneAndUpdate(
                            { '_id': mongoose.Types.ObjectId(req.body.menu_id) },
                            { '$set': { 'sections.$[].categories.$[item].sub_categories': subCategory } },
                            { arrayFilters: [{ 'item._id': mongoose.Types.ObjectId(req.body.cat_id) }] },
                        function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                    else {
                        res.json({ status: false, message: "Name already exists" });
                    }
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.update_sub_category = (req, res) => {
    menus.findOne({
        _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id),
        "sections.categories._id": mongoose.Types.ObjectId(req.body.cat_id)
    }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length) {
                let category = section[0].categories.filter(object => object._id.toString()==req.body.cat_id);
                if(category.length) {
                    let subCategory = category[0].sub_categories;
                    if(req.body.prev_rank < req.body.rank)
                    {
                        // dec rank
                        subCategory.forEach((object) => {
                            if(req.body.prev_rank<object.rank && req.body.rank>=object.rank) {
                                object.rank = object.rank-1;
                            }
                        });
                    }
                    else if(req.body.prev_rank > req.body.rank)
                    {
                        // inc rank
                        subCategory.forEach((object) => {
                            if(req.body.prev_rank>object.rank && req.body.rank<=object.rank) {
                                object.rank = object.rank+1;
                            }
                        });
                    }
                    let index = subCategory.findIndex(object => object._id.toString() == req.body._id);
                    if(index != -1) {
                        subCategory[index] = req.body;
                        // update
                        menus.findOneAndUpdate(
                            { '_id': mongoose.Types.ObjectId(req.body.menu_id) },
                            { '$set': { 'sections.$[].categories.$[item].sub_categories': subCategory } },
                            { arrayFilters: [{ 'item._id': mongoose.Types.ObjectId(req.body.cat_id) }] },
                        function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                    else {
                        res.json({ status: false, message: "Invalid sub-category" });
                    }
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

exports.remove_sub_category = (req, res) => {
    menus.findOne({
        _id: mongoose.Types.ObjectId(req.body.menu_id), "sections._id": mongoose.Types.ObjectId(req.body.section_id),
        "sections.categories._id": mongoose.Types.ObjectId(req.body.cat_id)
    }, function(err, response) {
        if(!err && response) {
            let section = response.sections.filter(object => object._id.toString()==req.body.section_id);
            if(section.length) {
                let category = section[0].categories.filter(object => object._id.toString()==req.body.cat_id);
                if(category.length) {
                    let subCategory = category[0].sub_categories;
                    // dec rank
                    subCategory.forEach((object) => {
                        if(req.body.rank<object.rank) {
                            object.rank = object.rank-1;
                        }
                    });
                    let index = subCategory.findIndex(object => object._id.toString() == req.body._id);
                    if(index != -1) {
                        subCategory.splice(index, 1);
                        // update
                        menus.findOneAndUpdate(
                            { '_id': mongoose.Types.ObjectId(req.body.menu_id) },
                            { '$set': { 'sections.$[].categories.$[item].sub_categories': subCategory } },
                            { arrayFilters: [{ 'item._id': mongoose.Types.ObjectId(req.body.cat_id) }] },
                        function(err, response) {
                            if(!err) { res.json({ status: true }); }
                            else { res.json({ status: false, error: err, message: "failure" }); }
                        });
                    }
                    else {
                        res.json({ status: false, message: "Invalid sub-category" });
                    }
                }
                else {
                    res.json({ status: false, message: "Invalid category" });
                }
            }
            else {
                res.json({ status: false, message: "Invalid section" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid menu" });
        }
    });
}

async function MultiFileUpload(existImgList, imgList, rootPath) {
    let recreateImgList = [];
    for(let i=0; i<imgList.length; i++)
    {
        imgList[i].rank = i+1;
        if(imgList[i].img_change) {
            imgList[i].image = await imgUploadService.singleFileUpload(imgList[i].image, rootPath, true, null);
            if(existImgList[i] && existImgList[i].image) {
                fs.unlink(existImgList[i].image, function (err) { });
                let smallImg = existImgList[i].image.split(".");
                if(smallImg.length>1) { fs.unlink(smallImg[0]+"_s."+smallImg[1], function (err) { }); }
            }
        }
        recreateImgList.push(imgList[i]);
    }
    return recreateImgList;
}