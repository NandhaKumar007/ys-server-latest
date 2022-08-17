const mongoose = require('mongoose');

const liveSchema = new mongoose.Schema({
	base: { type: String, required: true },
	html_code: { type: String, required: true },
	rates: { type: Object },
	updated_on: { type: Date }
});

const collections = mongoose.model('live_currencies', liveSchema);

module.exports = collections;