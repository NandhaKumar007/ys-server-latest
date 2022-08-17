const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    package_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    currency_types: { type: Object, required: true }
}, { _id : false });

const imageSchema = new mongoose.Schema({
    image: { type: String }
}, { _id : false });

const featureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    keyword: { type: String, default: '' },
    rank: { type: Number, default: 0 },
    description: { type: String },
    image_list: [ imageSchema ],
    linked_packages: [ packageSchema ],
    disc_status: { type: Boolean },
    disc_from: { type: Date },
    disc_to: { type: Date },
    disc_currency_types: { type: Object },
	status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('ys_features', featureSchema);

module.exports = collections;