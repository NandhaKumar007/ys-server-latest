const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
   name: { type: String, required: true },
   value: { type: String, required: true } 
}, { _id : false });

const itemListSchema = new mongoose.Schema({
    category_id: { type: Array },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    hsn_code: { type: String },
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, enum: ['Pcs', 'Mts', 'Kgs'], required: true },
    disc_status: { type: Boolean, default: false },
    disc_percentage: { type: String },
    selling_price: { type: Number, required: true },
    discounted_price: { type: Number, required: true },
    addon_price: { type: Number, default: 0 },
    final_price: { type: Number, required: true },
    revised_addon_price: { type: Number, default: 0 },
    revised_final_price: { type: Number, required: true },
    addon_status: { type: Boolean, default: false },
    selected_addon: {
        _id: { type: String },
        name: { type: String },
        price: { type: Number }
    },
    variant_status: { type: Boolean, default: false },
    variant_types: [ variantSchema ],
    image: { type: String },
    taxrate_id: { type: mongoose.Schema.Types.ObjectId }
}, { _id : false });

const revisedItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    revised_addon_price: { type: Number, default: 0 },
    revised_final_price: { type: Number, required: true }
}, { _id : false });

const revisedSchema = new mongoose.Schema({
    item_list: [ revisedItemSchema ],
    created_on: { type: Date, default: Date.now }
}, { _id : false });

const quotationSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_name: { type: String, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId },
    quot_by: { type: String, enum: ['user', 'admin'], default: 'user' },
    quot_number: { type: String, required: true },
    company_address: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        dial_code: { type: String },
        mobile: { type: String, required: true },
        landmark: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String }
    },
    item_list: [ itemListSchema ],
    sub_total: { type: Number, required: true },
    shipping_cost: { type: Number, default: 0 },
    final_price: { type: Number, required: true },
    currency_type: {
        country_code: { type: String, default: 'INR' },
        html_code: { type: String, default: '&#x20B9;' },
        country_inr_value: { type: Number, default: 1 }
    },
    note: { type: String },
    revised_price: [ revisedSchema ],
    quot_status: { type: String, enum: ['placed', 'processing', 'confirmed', 'cancelled'], default: 'placed' },
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now },
    modified_on: { type: Date, default: Date.now },
    confirmed_on: { type: Date },
    cancelled_on: { type: Date }
});

const collections = mongoose.model('quotations', quotationSchema);

module.exports = collections;