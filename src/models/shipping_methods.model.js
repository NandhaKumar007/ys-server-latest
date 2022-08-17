const mongoose = require('mongoose');

const multiplierSchema = new mongoose.Schema({
    weight: { type: Number, required: true },
    multiplier: { type: Number, required: true }
}, { _id : false });

const domesZoneSchema = new mongoose.Schema({
    zone: { type: String, required: true },
    states: { type: Array },
    price_per_kg: { type: Number, required: true },
    delivery_time: { type: String, required: true },
    rate_multiplier: [ multiplierSchema ]
}, { _id : false });

const interZoneSchema = new mongoose.Schema({
    zone: { type: String, required: true },
    countries: { type: Array },
    price_per_kg: { type: Number, required: true },
    delivery_time: { type: String, required: true },
    rate_multiplier: [ multiplierSchema ]
}, { _id : false });

const shippingSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true },
    tracking_link: { type: String, required: true },
    shipping_type: { type: String, enum: ['Domestic', 'International'], required: true },
    shipping_price: { type: Number },
    delivery_time: { type: String },
    free_shipping: { type: Boolean, default: false },
    alert_status: { type: Boolean, default: false },
    minimum_price: { type: Number },
    domes_zone_status: { type: Boolean, default: false },
    domes_zones: [ domesZoneSchema ],
    domes_rate_multiplier: [ multiplierSchema ],
    inter_zone_status: { type: Boolean, default: false },
    inter_zones: [ interZoneSchema ],
    inter_rate_multiplier: [ multiplierSchema ],
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('shipping_methods', shippingSchema);

module.exports = collections;

// remove domes_rate_multiplier, inter_rate_multiplier