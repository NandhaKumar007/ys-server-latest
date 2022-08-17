const mongoose = require('mongoose');

const menuImgSchema = new mongoose.Schema({
    rank: { type: Number, required: true },
    image: { type: String, required: true },
    heading: { type: String },
    sub_heading: { type: String },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    btn_status: { type: Boolean, default: false },
    btn_text: { type: String }
 }, { _id : false });

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    sub_categories: [ subCategorySchema ]
});

const sectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    categories: [ categorySchema ]
});

const menuSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    sections: [ sectionSchema ],
    menu_images: [ menuImgSchema ]
});

const collections = mongoose.model('menus', menuSchema);

module.exports = collections;