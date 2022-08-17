const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_number: { type: String, required: true },
    contact_no: { type: String, required: true },
    service_name: { type: String, required: true },
    service_price: { type: Number, default: 0 },
    currency_type: {
        country_code: { type: String, default: 'INR' },
        html_code: { type: String, default: '&#x20B9;' },
        country_inr_value: { type: Number, default: 1 }
    },
    booking_date: { type: Date, required: true },
    status: { type: String, enum: ['confirmed', 'inactive'], default: 'confirmed' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('appointments', appointmentSchema);

module.exports = collections;