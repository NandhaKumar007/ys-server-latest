const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
	category: { type: String, required: true, enum: ['genie', 'pro', 'none'] },
	service: { type: String, required: true, enum: ['order_based', 'quot_based', 'service_based', 'multi_vendor', 'restaurant_based'] },
	name: { type: String, required: true },
	disp_name: { type: String, required: true },
	rank: { type: Number, default: 0 },
	description: { type: String },
	currency_types: { type: Object },
	trial_status: { type: Boolean },
	trial_upto_in_days: { type: Number, default: 0 },
	trial_features: { type: Array, default: [] },
	features_info: { type: Array, default: [] },
	status: { type: String, default: 'active' },
  created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('ys_packages', packageSchema);

module.exports = collections;