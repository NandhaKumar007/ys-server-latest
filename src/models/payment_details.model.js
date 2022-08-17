const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    payment_method: { type: String, required: true },
    payment_status: { type: String },
	payment_details: { type: Object },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('payment_details', paymentSchema, 'payment_details');

module.exports = collections;