const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    store_name: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    form_type: { type: String },
    enquiry_type: { type: String },
    message: { type: String },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('ys_campaign_enquiry', enquirySchema, 'ys_campaign_enquiry');

module.exports = collections;