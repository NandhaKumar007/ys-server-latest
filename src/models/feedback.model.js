const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    quality: { type: Number, required: true },
    pricing: { type: Number, required: true },
    shipping: { type: Number, required: true },
    comment: { type: String },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('feedback', feedbackSchema, 'feedback');

module.exports = collections;