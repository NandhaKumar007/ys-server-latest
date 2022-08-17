const mongoose = require('mongoose');

const imgListSchema = new mongoose.Schema({
    image: { type: String }
}, { _id : false });

const offerListSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    name: { type: String, required: true },
    page_url: { type: String, required: true },
    description: { type: String },
    purchase_amount: { type: Number, default: 0 },
    redeem_amount: { type: Number, default: 0 },
    valid_in_days: { type: Number, default: 0 },
    image_list: [imgListSchema],
    created_on: { type: Date, default: Date.now }
});

const dinamicOfferSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    offer_list: [ offerListSchema ]
});

const collections = mongoose.model('dinamic_offers', dinamicOfferSchema);

module.exports = collections;