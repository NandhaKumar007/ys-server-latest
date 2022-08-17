const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    company_name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('vendor_enquiry', enquirySchema, 'vendor_enquiry');

module.exports = collections;