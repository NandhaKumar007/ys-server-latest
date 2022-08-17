const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
   name: { type: String, required: true },
   value: { type: String, required: true } 
}, { _id : false });

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

const sizingValueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unique_name: { type: String, required: true },
    image: { type: String }
}, { _id : false });

const sizingListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: [ sizingValueSchema ]
}, { _id : false });

const itemListSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    hsn_code: { type: String },
    name: { type: String, required: true },
    weight: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    unit: { type: String, enum: ['Pcs', 'Mts', 'Kgs'], required: true },
    disc_status: { type: Boolean, default: false },
    disc_percentage: { type: String },
    selling_price: { type: Number, required: true },
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
        model_id: { type: mongoose.Schema.Types.ObjectId },
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
    vendor_id: { type: mongoose.Schema.Types.ObjectId },
    taxrate_id: { type: mongoose.Schema.Types.ObjectId },
    review_details: {
        rating: { type: Number },
        title: { type: String },
        description: { type: String }
    },
    cancel_info: {
        title: { type: String },
        description: { type: String },
        request_on: { type: Date },
        cancelled_on: { type: Date },
        declined_on: { type: Date }
    },
    item_status: { type: String, enum: ['c_requested', 'c_confirmed', 'c_declined'] }
});

const couponListSchema = new mongoose.Schema({
   coupon_id: { type: mongoose.Schema.Types.ObjectId, required: true },
   code: { type: String, required: true },
   price: { type: Number, required: true } 
}, { _id : false });

// COURIER PARTNER ORDERS
const cpOrderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    order_number: { type: String },
    order_id: { type: String, required: true },
    cp_status: { type: String, default: 'created' },
    status: { type: String, default: 'active' }
}, { _id : false });

const vendorListSchema = new mongoose.Schema({
    vendor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_number: { type: String, required: true },
    invoice_number: { type: String },
    discount_amount: { type: Number, default: 0 },
    sub_total: { type: Number, required: true },
    shipping_cost: { type: Number, required: true },
    gift_wrapper: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },  // sub_total + shipping_cost + gift_wrapper
    final_price: { type: Number, required: true },  // grand_total - discount_amount
    shipping_method: {
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: { type: String },
        tracking_link: { type: String },
        tracking_number: { type: String },
        dp_charges: { type: Number, default: 0 },
        shipping_price: { type: Number, required: true },
        delivery_time: { type: String, required: true }
    },
    cp_status: { type: Boolean },
    pickup_id: { type: String },
    cp_orders: [ cpOrderSchema ],
    order_status: { type: String, enum: ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'], default: 'placed' },
    modified_on: { type: Date, default: Date.now },
    confirmed_on: { type: Date },
    dispatched_on: { type: Date },
    delivered_on: { type: Date },
    cancelled_on: { type: Date }
}, { _id : false });

const itemGroupsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    items: { type: Array, default: [] },
    carrier_name: { type: String },
    tracking_link: { type: String },
    tracking_number: { type: String },
    price: { type: Number, default: 0 },
    dispatched_on: { type: Date }
});

const orderSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    quot_id: { type: mongoose.Schema.Types.ObjectId },
    quick_order_id: { type: mongoose.Schema.Types.ObjectId },
    customer_name: { type: String },
    guest_email: { type: String },
    order_by: { type: String, enum: ['user', 'admin', 'guest'], default: 'user' },
    order_type: { type: String, enum: ['pickup', 'delivery', 'trial'], default: 'delivery' },
    invoice_number: { type: String },
    session_id: { type: String },
	order_number: { type: String, required: true },
    buy_now: { type: Boolean, default: false },
    item_list: [ itemListSchema ],
    coupon_list: [ couponListSchema ],
    vendor_list: [ vendorListSchema ],
    offer_applied: { type: Boolean, default: false },
    offer_details: {
        id: { type: mongoose.Schema.Types.ObjectId },
        code: { type: String },
        price: { type: Number }
    },
    manual_discount: {
        percentage: { type: Number },
        amount: { type: Number }
    },
    discount_amount: { type: Number, default: 0 },
    sub_total: { type: Number, required: true },
    shipping_cost: { type: Number, required: true },
    cod_charges: { type: Number, default: 0 },
    packaging_charges: { type: Number, default: 0 },
    gift_wrapper: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },  // sub_total + shipping_cost + cod_charges + packing_charges + gift_wrapper
    final_price: { type: Number, required: true },  // grand_total - discount_amount
    payment_details: {
        name: { type: String },
        order_id: { type: String }, // for razorpay
        payment_id: { type: String },
        status: { type: String }
    },
    shipping_address: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        dial_code: { type: String },
        mobile: { type: String, required: true },
        door_no: { type: String },
        landmark: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        lat: { type: Number },
        lng: { type: Number },
        location_url: { type: String }
    },
    billing_address: {
        name: { type: String },
        address: { type: String },
        country: { type: String },
        dial_code: { type: String },
        mobile: { type: String },
        landmark: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String }
    },
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
    cp_status: { type: Boolean },
    pickup_id: { type: String },
    cp_orders: [ cpOrderSchema ],
    currency_type: {
        country_code: { type: String, default: 'INR' },
        html_code: { type: String, default: '&#x20B9;' },
        country_inr_value: { type: Number, default: 1 }
    },
    item_groups: [ itemGroupsSchema ],
    order_note: { type: String },
    gift_status: { type: Boolean },
    need_sample: { type: Boolean },
    payment_success: { type: Boolean, default: false },
    order_status: { type: String, enum: ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'], default: 'placed' },
    status: { type: String, default: 'inactive' },
    created_on: { type: Date, default: Date.now },
    modified_on: { type: Date, default: Date.now },
    confirmed_on: { type: Date },
    dispatched_on: { type: Date },
    delivered_on: { type: Date },
    cancelled_on: { type: Date }
});

const collections = mongoose.model('order_list', orderSchema, 'order_list');

module.exports = collections;