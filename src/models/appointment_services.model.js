const mongoose = require('mongoose');

const hrsSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true }
}, { _id : false });

const daysSchema = new mongoose.Schema({
    code: { type: Number, required: true },
    day: { type: String, required: true },
    opening_hrs: [ hrsSchema ],
    active: { type: Boolean, default: false }
}, { _id : false });

const listSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    image: { type: String, required: true },
    service_duration: { type: Number, required: true },
    no_of_concurrent_services: { type: Number, default: 1 },
    upcoming_days: { type: Number, default: 0 },
    available_days: [ daysSchema ],
    rank: { type: Number, required: true },
    created_on: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    rank: { type: Number, default: 0 },
    page_url: { type: String, required: true },
    list: [ listSchema ]
});

const collections = mongoose.model('appointment_services', serviceSchema);

module.exports = collections;