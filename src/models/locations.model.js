const mongoose = require('mongoose');

const locListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: String, default: 1 },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    map_url: { type: String, required: true }
});

const locationSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    page_config: {
        heading: { type: String },
        sub_heading: { type: String }
    },
    location_list: [locListSchema]
});

const collections = mongoose.model('locations', locationSchema);

module.exports = collections;