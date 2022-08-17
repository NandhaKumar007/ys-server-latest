const mongoose = require('mongoose');

const optionListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String }
}, { _id : false });

const collectionSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	name: { type: String, required: true },
    rank: { type: Number, required: true },
    option_list: [optionListSchema]
});

const collections = mongoose.model('collections', collectionSchema);

module.exports = collections;