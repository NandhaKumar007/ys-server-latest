const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = 10;

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
    value: { type: String, required: true },
    required: { type: Boolean, default: false }
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

/* CART DETAILS */
const variantSchema = new mongoose.Schema({
   name: { type: String, required: true },
   value: { type: String, required: true } 
}, { _id : false });

const cartlistSchema = new mongoose.Schema({
    category_id: { type: Array },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    hsn_code: { type: String },
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    additional_qty: { type: Number, default: 0 },
    unit: { type: String, enum: ['Pcs', 'Mts', 'Kgs'], required: true },
    stock: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    disc_status: { type: Boolean, default: false },
    disc_percentage: { type: String },
    discounted_price: { type: Number, required: true },
    addon_price: { type: Number, default: 0 },
    final_price: { type: Number, required: true },
    addon_status: { type: Boolean, default: false },
    selected_addon: {
        _id: { type: String },
        name: { type: String },
        price: { type: Number }
    },
    customization_status: { type: Boolean, default: false },
    customized_model: {
        addon_id: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String },
        price: { type: Number, default: 0 },
        mm_unit: { type: String },
        mm_sets: [ mmSetSchema ],
        custom_list: [ customListSchema ],
        notes_list: [ notesListSchema ],
        sizing_list: [ sizingListSchema ]
    },
    slot_details: {
        date: { type: Date },
        slot: { type: String }
    },
    variant_status: { type: Boolean, default: false },
    variant_types: [ variantSchema ],
    image: { type: String },
    allow_cod: { type: Boolean, default: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId },
    taxrate_id: { type: mongoose.Schema.Types.ObjectId },
    seo_status: { type: Boolean, default: false },
    seo_details: {
        page_url: { type: String }
    }
}, { _id : false });

/* ADDRESS */
const addressSchema = new mongoose.Schema({
    type: { type: String, enum: ['home', 'office', 'other', 'headquarters', 'branch'], required: true },
    other_place: { type: String },
    billing_address: { type: Boolean, default: false },
    shipping_address: { type: Boolean, default: false },
    name: { type: String, required: true },
    dial_code: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    door_no: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    lat: { type: Number },
    lng: { type: Number }
});

/* GUEST */
const guestSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String, required: true },
    address_list: [ addressSchema ],
    cart_list: [ cartlistSchema ],
    cart_recovery: { type: Boolean, default: false },
    cart_updated_on: { type: Date, default: Date.now },
    session_key: { type: String, required: true },
    cod_otp: { type: String },
    cod_otp_request_on: { type: Date },
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now },
    login_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('guest_users', guestSchema);

module.exports = collections;