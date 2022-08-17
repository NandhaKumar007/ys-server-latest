const mongoose = require('mongoose');

const imageListSchema = new mongoose.Schema({
    desktop_resolution: { type: String },
    mobile_resolution: { type: String },
    desktop_img: { type: String },
    mobile_img: { type: String },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product'] },
    category_id: { type: String },
    product_id: { type: String }
}, { _id : false });

const bannerListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['limited', 'unlimited'] },
    active_status: { type: Boolean, default: true },
    responsive_status: { type: Boolean, default: false },
    link_status: { type: Boolean, default: false },
    desktop_resolution: { type: String },
    mobile_resolution: { type: String },
    image_list: [ imageListSchema ],
});

const bannerSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    banner_list: [ bannerListSchema ],
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('banners', bannerSchema);

module.exports = collections;