const mongoose = require('mongoose');

 const categorySchema = new mongoose.Schema({
    category_id: { type: String, required: true },
    name: { type: String, required: true }
 }, { _id : false });

const productSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "uploads/yourstore/placeholder.jpg" }
 }, { _id : false });

const offerCodesSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    code_type: { type: String, enum: ['discount', 'auto_discount'], default: 'discount' },
    discount_type: { type: String, enum: ['percentage', 'amount', 'buy_x_get_y'], required: true },
    discount_value: { type: Number, default: 0 },
    restrict_discount: { type: Boolean },
    discount_upto: { type: Number },
    apply_to: { type: String, enum: ['order', 'shipping', 'category', 'product'], default: 'order' },
    shipping_type: { type: String, enum: ['all', 'domestic', 'international'] },
    category_list: [ categorySchema ],
    product_list: [ productSchema ],
    min_order_amt: { type: Number, default: 0 },
    min_order_qty: { type: Number, default: 0 },
    onetime_usage: { type: Boolean },
    restrict_usage: { type: Boolean },
    usage_limit: { type: Number },
    redeemed_count: { type: Number, default: 0 },
    valid_from: { type: Date, required: true },
    valid_to: { type: Date },
    buy_properties: {
        type: { type: String, enum: ['quantity', 'amount'] },
        value: { type: Number, default: 0 },
        apply_to: { type: String, enum: ['category', 'product', 'all_product'] },
        category_list: [ categorySchema ],
        product_list: [ productSchema ]
    },
    get_properties: {
        quantity: { type: Number, default: 0 },
        apply_to: { type: String, enum: ['category', 'product', 'all_product'] },
        category_list: [ categorySchema ],
        product_list: [ productSchema ],
        discount_type: { type: String, enum: ['quantity', 'percentage'] },
        discount_value: { type: Number, default: 0 }
    },
    buy_x_get_y_usage_limit: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    enable_status: { type: Boolean, required: true },
    created_on: { type: Date, default: Date.now },
    updated_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('offer_codes', offerCodesSchema);

module.exports = collections;