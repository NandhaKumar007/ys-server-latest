const mongoose = require('mongoose');

const seoDetailsSchema = {
    page_url: { type: String },
    h1_tag: { type: String },
    page_title: { type: String },
    meta_desc: { type: String, default: "" },
    meta_keywords: { type: Array, default: [] },
    modified: { type: Boolean, default: false }
};

const contentSchema = {
    title: { type: String },
    description: { type: String }
};

const socialMediaSchema = new mongoose.Schema({
    type: { type: String, required: true },
    url: { type: String, required: true }
}, { _id : false });

const menuImgSchema = new mongoose.Schema({
    rank: { type: Number, required: true },
    image: { type: String, required: true },
    heading: { type: String },
    sub_heading: { type: String },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    btn_status: { type: Boolean, default: false },
    btn_text: { type: String },
    created_on: { type: Date, default: Date.now }
 }, { _id : false });

const childSubCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    image: { type: String },
    seo_status: { type: Boolean, default: false },
    seo_details: seoDetailsSchema,
    content_status: { type: Boolean, default: false },
    content_details: contentSchema,
    created_on: { type: Date, default: Date.now }
});

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    image: { type: String },
    seo_status: { type: Boolean, default: false },
    seo_details: seoDetailsSchema,
    content_status: { type: Boolean, default: false },
    content_details: contentSchema,
    created_on: { type: Date, default: Date.now },
    child_sub_categories: [ childSubCategorySchema ]
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    image: { type: String },
    seo_status: { type: Boolean, default: false },
    seo_details: seoDetailsSchema,
    content_status: { type: Boolean, default: false },
    content_details: contentSchema,
    created_on: { type: Date, default: Date.now },
    sub_categories: [ subCategorySchema ]
});

const sectionSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    rank: { type: Number, default: 0 },
    product_count: { type: Number, default: 0 },
    image: { type: String },
    seo_status: { type: Boolean, default: false },
    seo_details: seoDetailsSchema,
    content_status: { type: Boolean, default: false },
    content_details: contentSchema,
    social_media_links: [ socialMediaSchema ],
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now },
    categories: [ categorySchema ],
    menu_images: [ menuImgSchema ]
});

const collections = mongoose.model('sections', sectionSchema);

module.exports = collections;

// remove -> rank, categories, menu_images