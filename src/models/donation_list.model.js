const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_number: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
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
    created_on: { type: Date, default: Date.now }
});

module.exports = mongoose.model('donation_list', donationSchema, 'donation_list');