const mongoose = require('mongoose');

// ZONES
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

// AI STYLING
const optionListSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    sub_heading: { type: String },
    link_to: { type: String },
    image: { type: String, required: true }
});

const stylingListSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    sub_heading: { type: String },
    type: { type: String, enum: ['either_or', 'multiple'], required: true },
    option_list: [optionListSchema]
});

// COURIER PARTNERS
const courierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    token: { type: String, required: true },
    mode: { type: String, enum: ['test', 'live'], required: true },
    metadata: { type: Object },
    status: { type: String, default: 'active' }
});

// SUB USERS
const subUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    session_key: { type: String, required: true },
    status: { type: String, default: 'active' },
    permission_list: { type: Array, default: [] },
    permissions: { type: Object }
});

// SCHEMA
const featuresSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    sub_users: [ subUserSchema ],
    courier_partners: [ courierSchema ],
    ai_styles: [ stylingListSchema ],
    default_domes_zones: [ domesZoneSchema ],
    default_inter_zones: [ interZoneSchema ],
    ad_config: {
        normal_days: { type: Array },
        peak_days: { type: Array },
        start_time: { type: String },
        end_time: { type: String },
    }
});

const collections = mongoose.model('store_features', featuresSchema);

module.exports = collections;