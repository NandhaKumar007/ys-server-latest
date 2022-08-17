const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    heading: { type: String, required: true },
    sub_heading: { type: String, required: true },
    address: { type: String, required: true },
    map_url: { type: String },
    updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('contact_page', contactSchema, 'contact_page');

module.exports = collections;