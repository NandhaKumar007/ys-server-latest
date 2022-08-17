const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_number: { type: String, required: true },
    invoice_number: { type: String },
    order_total: { type: Number },
    items_cmsn: { type: Number },
    pg_in_pct: { type: Number },
    pg_charges: { type: Number },
    tax_in_pct: { type: Number },
    cmsn_tax: { type: Number },
    settlement_amt: { type: Number }, // (order_total - (items_cmsn + pg_charges + cmsn_tax))
    settlement_on: { type: Date },
    settled_on: { type: Date },
    status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
    created_on: { type: Date, default: Date.now }
});

const promotions = mongoose.model('vendor_settlements', settlementSchema);

module.exports = promotions;