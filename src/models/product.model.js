const mongoose = require('mongoose');

const adddonListSchema = new mongoose.Schema({
    addon_id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { _id : false });

const productImgSchema = new mongoose.Schema({
    title: { type: String },
    image: { type: String },
    tag: { type: String },
    img_alt: { type: String },
    hide_on_variants: { type: Boolean }
}, { _id : false });

const footNoteSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true }
}, { _id : false });

const hrsSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true }
}, { _id : false });

const availabilitySchema = new mongoose.Schema({
    code: { type: Number, required: true },
    day: { type: String, required: true },
    opening_hrs: [ hrsSchema ],
    active: { type: Boolean, default: false }
}, { _id : false });

const productSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    category_id: { type: Array },
    product_type: { type: String },
    rera_id: { type: String },
    sku: { type: String, required: true },
    hsn_code: { type: String },
    brand: { type: String },
    name: { type: String, required: true },
    weight: { type: Number, default: 1 },
    featured: { type: Boolean, default: false },
    allow_cod: { type: Boolean, default: true },
    selling_price: { type: Number, required: true },
    rank: { type: Number, required: true },
    stock: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['Pcs', 'Mts', 'Kgs'] },
    description: { type: String, default: "" },
    search_terms: { type: String },
    disc_status: { type: Boolean, default: false },
    disc_percentage: { type: Number },
    discounted_price: { type: Number, required: true },
    variant_status: { type: Boolean, default: false },
    variant_types: { type: Array, default: [] },
    variant_list: { type: Array },
    image_tag_status: { type: Boolean },
    image_list: [productImgSchema],
    footnote_list: [footNoteSchema],
    aistyle_list: { type: Array },
    badge_list: { type: Array },
    video_details: {
        src: { type: String },
        image: { type: String }
    },
    brochure: { type: String },
    addon_status: { type: Boolean, default: false },
    addon_must: { type: Boolean },
    addon_list: [ adddonListSchema ],
    tag_status: { type: Boolean, default: false },
    tag_list: { type: Array },
    faq_status: { type: Boolean },
    faq_list: { type: Array },
    amenity_list: { type: Array },
    vendor_id: { type: mongoose.Schema.Types.ObjectId },
    taxrate_id: { type: mongoose.Schema.Types.ObjectId },
    chart_status: { type: Boolean },
    chart_id: { type: mongoose.Schema.Types.ObjectId },
    available_days: [ availabilitySchema ],
    taxonomy_id: { type: mongoose.Schema.Types.ObjectId },
    external_link: { type: String },
    location_url: { type: String },
    seo_status: { type: Boolean, default: false },
    seo_details: {
        page_url: { type: String },
        h1_tag: { type: String },
        page_title: { type: String },
        meta_desc: { type: String },
        meta_keywords: { type: Array, default: [] },
        modified: { type: Boolean, default: false }
    },
    ordered_qty: { type: Number, default: 0 },
    archive_status: { type: Boolean, default: false },
    archive_id: { type: mongoose.Schema.Types.ObjectId },
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now },
    modified_on: { type: Date, default: Date.now },
    handover_on: { type: Date },
    hold_till: { type: Date },
    hold_qty: { type: Number }
});

const collections = mongoose.model('products', productSchema);

module.exports = collections;