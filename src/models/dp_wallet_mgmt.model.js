const mongoose = require('mongoose');

const locListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: String, default: 1 },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    map_url: { type: String, required: true }
});

const walletSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId }, // for debit
    order_number: { type: String, required: true },
    order_type: { type: String, enum: ['credit', 'debit'], required: true },
    order_info: { type: String, required: true },
    order_price: { type: Number, default: 0 },
    additional_charges: { type: Number, default: 0 },
    sgst: {
        percentage: { type: Number },
        amount: { type: Number }
    },
    cgst: {
        percentage: { type: Number },
        amount: { type: Number }
    },
    igst: {
        percentage: { type: Number },
        amount: { type: Number }
    },
    final_price: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    currency_type: {
        country_code: { type: String, default: 'INR' },
        html_code: { type: String, default: '&#x20B9;' }
    },
    payment_success: { type: Boolean, default: false },
    payment_details: {
        name: { type: String },
        order_id: { type: String }, // for razorpay
        payment_id: { type: String },
        status: { type: String }
    },
    status: { type: String, default: 'inactive' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('dp_wallet_mgmt', walletSchema, 'dp_wallet_mgmt');

module.exports = collections;