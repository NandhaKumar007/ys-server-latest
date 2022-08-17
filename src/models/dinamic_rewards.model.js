const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_by: { type: String, enum: ['user', 'admin'], default: 'user' },
    order_number: { type: String, required: true },
    user_details: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        dial_code: { type: String, required: true },
        mobile: { type: String, required: true },
        address: { type: String, required: true }
    },
    offer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    purchase_amount: { type: Number, default: 0 },
    redeem_amount: { type: Number, default: 0 },
    valid_in_days: { type: Number, default: 0 },
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

const collections = mongoose.model('dinamic_rewards', rewardSchema);

module.exports = collections;