const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	content: { type: String },
    updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('sitemap', paymentSchema, 'sitemap');

module.exports = collections;