const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true } 
 }, { _id : false });

const itemListSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['Pcs', 'Mts', 'Kgs'], required: true },
    image: { type: String },
    variant_status: { type: Boolean },
    variant_types: [ variantSchema ],
    addon_status: { type: Boolean },
    addon_id: { type: String }
}, { _id : false });

const orderSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    item_list: [ itemListSchema ],
    cart_total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    usage_count: { type: Number, default: 0 },
    disc_status: { type: Boolean },
    disc_config: {
        type: { type: String, enum: ['percentage', 'amount'] },
        value: { type: Number },
    },
    expiry_status: { type: Boolean },
    expiry_on: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('quick_orders', orderSchema);

module.exports = collections;