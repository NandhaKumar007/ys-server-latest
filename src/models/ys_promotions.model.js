const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    name: { type:String, required: true },
    image: { type: String, required: true },
    rank: { type: Number, default: 0 },
    active_status: { type:Boolean },
    link_status: { type: Boolean },
    link_type: { type: String, enum: ['category', 'service', 'package'] },
    link_id: { type: String },
    rd_status: { type: Boolean },
    rd_type: { type: String, enum: ['internal', 'external'] },
    rd_to: { type: String },
    created_on: { type: Date, default: Date.now }
});

const promotions = mongoose.model('ys_promotions', promotionSchema);

module.exports = promotions;