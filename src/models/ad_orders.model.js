const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    segment_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_number: { type: String, required: true },
    image: { type: String },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    price: { type: Number, required: true },
    notes: { type: String },
    status: { type: String, default: 'active', enum: ['active', 'progress', 'completed', 'cancelled'] },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('ad_orders', adSchema);

module.exports = collections;