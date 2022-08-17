const mongoose = require('mongoose');

const imgSchema = new mongoose.Schema({
    image: { type: String }
}, { _id : false });

const socialMediaSchema = new mongoose.Schema({
    type: { type: String, required: true },
    url: { type: String, required: true }
}, { _id : false });

const listSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId },
    item_index: { type: Number, default: 0 },
    customer_name: { type: String, required: true },
    rating: { type: Number, default: 1 },
    title: { type: String },
    description: { type: String },
    image_list: [ imgSchema ],
    social_media_links: [ socialMediaSchema ],
    status: { type: String, default: 'inactive', enum: ['active', 'inactive'] },
    created_on: { type: Date, default: Date.now }
 });

const reviewSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    reviews: [ listSchema ]
});

const collections = mongoose.model('product_reviews', reviewSchema);

module.exports = collections;