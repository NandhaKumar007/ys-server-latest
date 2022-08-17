const mongoose = require('mongoose');

const subscribeSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String, required: true },
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('newsletter_subscribers', subscribeSchema);

module.exports = collections;