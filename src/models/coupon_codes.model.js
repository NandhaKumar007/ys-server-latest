const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    order_id: { type: String, required: true },
    order_number: { type: String, required: true },
    redeemed_amount: { type: Number, required: true },
    created_on: { type: Date, default: Date.now }
 }, { _id : false });

const giftCardCodesSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_by: { type: String, enum: ['user', 'admin'], default: 'user' },
    coupon_type: { type: String, enum: ['onetime', 'wallet'], default: 'onetime' },
    invoice_number: { type: String },
    order_number: { type: String, required: true },
    card_name: { type: String },
    image: { type: String },
    code: { type: String, required: true },
    price: { type: Number, required: true },
    redeemed_amount: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    from_name: { type: String, required: true },
    to_name: { type: String, required: true },
    to_email: { type: String, required: true },
    message: { type: String, required: true },
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
    status: { type: String, enum: ['active', 'inactive', 'deactivated'], default: 'inactive' },
    order_note: { type: String },
    order_list: [ orderSchema ],
    payment_success: { type: Boolean, default: false },
    payment_details: {
        name: { type: String },
        order_id: { type: String }, // for razorpay
        payment_id: { type: String },
        status: { type: String }
    },
    currency_type: {
        country_code: { type: String, default: 'INR' },
        html_code: { type: String, default: '&#x20B9;' },
        country_inr_value: { type: Number, default: 1 }
    },
    created_on: { type: Date, default: Date.now },
    expiry_on: { type: Date, required: true },
    hold_till: { type: Date, default: Date.now }
});

const collections = mongoose.model('coupon_codes', giftCardCodesSchema);

module.exports = collections;