const mongoose = require('mongoose');

// TRIAL FEATURES
const trailSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    uninstalled: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    create_on: { type: Date, default: Date.now }
}, { _id : false });

const priceRangeSchema = new mongoose.Schema({
    percentage: { type: Number, required: true },
    price: { type: Number, required: true }
}, { _id : false });

const deploySchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    category: { type: String, required: true },
    template_set_id: { type: Number, required: true },
    content_set_id: { type: Number, required: true },
    category_set_id: { type: Number, required: true },
    category_images: { type: Array, default: [1,2,3] },
    deploy_stages: {
        logo: { type: Boolean, default: false },
        products: { type: Boolean, default: false },
        shipping: { type: Boolean, default: false },
        payments: { type: Boolean, default: false },
        package: { type: Boolean, default: false }
    },
    trial_features: [ trailSchema ],
    theme_colors: {
        primary: { type: String },
        secondary: { type: String },
        vendor_bg: { type: String }
    },
    auto_sku: { type: Boolean, default: true },
    sku_config: {
        prefix: { type: String, default: "" },
        min_digit: { type: Number, default: 5 }
    },
    vendor_inv_status: { type: Boolean },
    vendor_inv_config: {
        prefix: { type: String },
        suffix: { type: String },
        min_digit: { type: Number },
        next_invoice_no: { type: Number }
    },
    cmsn_type: { type: String, enum: ['flat', 'order_range', 'product_range'] },
    cmsn_in_pct: { type: Number },
    cmsn_config: {
        pgw_charges: { type: Number },
        tax_on_cmsn: { type: Boolean },
        tax_name: { type: String },
        tax_in_pct: { type: Number },
        settlem_type: { type: String, enum: ['dispatched_on', 'delivered_on'] },
        settlem_in_days: { type: Number }
    },
    price_range: [ priceRangeSchema ]
});

const collections = mongoose.model('deploy_details', deploySchema);

module.exports = collections;