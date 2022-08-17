const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true } 
 }, { _id : false });

const itemListSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['Pcs', 'Mts', 'Kgs'], required: true },
    image: { type: String },
    variant_status: { type: Boolean },
    variant_types: [ variantSchema ],
    addon_status: { type: Boolean },
    addon_id: { type: String },
    customization_status: { type: Boolean },
    model_id: { type: String }
}, { _id : false });

/* CUSTOM MODEL */
const mmListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
    additional_qty: { type: Number, default: 0 }
}, { _id : false });

const mmSetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    list: [ mmListSchema ]
}, { _id : false });

const customValueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, default: 0 },
    additional_qty: { type: Number, default: 0 }
}, { _id : false });

const customListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: [ customValueSchema ]
}, { _id : false });

const notesListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true }
}, { _id : false });

const notesListReqSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true }
}, { _id : false });

const sizingValueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unique_name: { type: String, required: true },
    image: { type: String }
}, { _id : false });

const sizingListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: [ sizingValueSchema ]
}, { _id : false });

const modelListSchema = new mongoose.Schema({
    addon_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    mm_unit: { type: String },
    mm_sets: [ mmSetSchema ],
    custom_list: [ customListSchema ],
    notes_list: [ notesListReqSchema ],
    sizing_list: [ sizingListSchema ],
    created_on: { type: Date, default: Date.now }
});

/* VENDORS */
const vendorListSchema = new mongoose.Schema({
    vendor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_qty: { type: Number, default: 0 },
    order_weight: { type: Number, default: 0 },
    sub_total: { type: Number, default: 0 },
    shipping_method: {
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        dp_charges: { type: Number, default: 0 },
        shipping_price: { type: Number, required: true }
    }
}, { _id : false });

const sessionSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    session_id: { type: String, required: true },
    quick_order_id: { type: String },
    order_type: { type: String, enum: ['pickup', 'delivery'], default: 'delivery' },
    buy_now: { type: Boolean, default: false },
    currency_type: { type: String, required: true },
    model_list: [ modelListSchema ],
    item_list: [ itemListSchema ],
    vendor_list: [ vendorListSchema ],
    shipping_address: { type: String, required: true },
    shipping_method: {
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: { type: String },
        tracking_link: { type: String },
        tracking_number: { type: String },
        dp_charges: { type: Number, default: 0 },
        shipping_price: { type: Number, required: true },
        delivery_time: { type: String, required: true },
        delivery_method: { type: Boolean, default: false },
        delivery_date: { type: String },
        pickup_details: {
            branch_id: { type: mongoose.Schema.Types.ObjectId },
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    created_on: { type: Date, default: Date.now },
    updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('order_session', sessionSchema, 'order_session');

module.exports = collections;