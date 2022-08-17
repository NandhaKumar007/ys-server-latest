const mongoose = require('mongoose');

const vendorWalletSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId }, // for debit
    order_number: { type: String, required: true },
    order_type: { type: String, enum: ['credit', 'debit'], required: true },
    order_info: { type: String, required: true },
    order_price: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    vendor_wallet_status: { type: Boolean },
    vendor_wallet_details: {
        balance: { type: Number },
        charge_type: { type: String, enum: ['percentage', 'amount'] },
        charge_value: { type: Number }
    },
    currency_type: {
        country_code: { type: String},
        html_code: { type: String }
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

const collections = mongoose.model('vendor_wallet_mgmt', vendorWalletSchema, 'vendor_wallet_mgmt');

module.exports = collections;