const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String },
    img_alt: { type: String },
    seo_status: { type: Boolean, default: false },
    seo_details: {
        page_url: { type: String },
        h1_tag: { type: String },
        page_title: { type: String },
        meta_desc: { type: String },
        meta_keywords: { type: Array, default: [] },
        modified: { type: Boolean, default: false }
    },
    created_on: { type: Date, default: Date.now },
    status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' }
});

const collections = mongoose.model('blogs', blogSchema);

module.exports = collections;