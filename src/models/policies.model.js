const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, required: true, enum: ['privacy', 'shipping', 'cancellation', 'terms_conditions'] },
    title: { type: String, required: true },
    content: { type: String, required: true },
    updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('policies', policySchema);

module.exports = collections;