const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('archives', archiveSchema);

module.exports = collections;