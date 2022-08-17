const mongoose = require('mongoose');

const cardListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, default: 0 },
    description: { type: String },
    image: { type: String, required: true },
    page_url: { type: String, default: '' },
    price_type: { type: String, enum: ['fixed', 'flexible'], default: 'fixed' },
    price: { type: Number, default: 0 },
    min_price: { type: Number, default: 0 },
    max_price: { type: Number, default: 0 },
    created_on: { type: Date, default: Date.now }
});

const giftCardSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    card_list: [ cardListSchema ]
});

const collections = mongoose.model('gift_cards', giftCardSchema);

module.exports = collections;