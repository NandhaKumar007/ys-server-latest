const mongoose = require('mongoose');

const subscribeSchema = new mongoose.Schema({
    email: { type: String, required: true },
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('ys_subscribers', subscribeSchema);

module.exports = collections;