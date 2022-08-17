const mongoose = require('mongoose');

const pagesSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    page_url: { type: String, required: true },
    content: { type: String, required: true },
    seo_status: { type: Boolean, default: false },
    seo_details: {
        h1_tag: { type: String },
        page_title: { type: String },
        meta_desc: { type: String },
        meta_keywords: { type: Array, default: [] }
    },
    updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('extra_pages', pagesSchema);

module.exports = collections;