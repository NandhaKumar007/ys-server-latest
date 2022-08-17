const mongoose = require('mongoose');

const discountListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    image: { type: String, required: true },
    heading: { type: String },
    sub_heading: { type: String },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    btn_status: { type: Boolean, default: false },
    btn_text: { type: String },
    created_on: { type: Date, default: Date.now }
});

const discountSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    page_config: {
        heading: { type: String },
        sub_heading: { type: String }
    },
    discount_list: [ discountListSchema ]
});

const collections = mongoose.model('discounts', discountSchema);

module.exports = collections;