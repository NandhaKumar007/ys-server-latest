const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
    name: { type: String },
    html_code: { type: String },
    store_base: { type: Boolean, default: false },
	rates: {
        INR: { type: Number, required: true },
		EUR: { type: Number, required: true },
		GBP: { type: Number, required: true },
        USD: { type: Number, required: true },
        JPY: { type: Number, required: true },
        HKD: { type: Number, required: true },
        AUD: { type: Number, required: true },
		SGD: { type: Number, required: true },
		CHF: { type: Number, required: true },
        AED: { type: Number, required: true },
        MYR: { type: Number, required: true },
        GHS: { type: Number, required: true }
    },
	updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('currency_list', currencySchema, 'currency_list');

module.exports = collections;