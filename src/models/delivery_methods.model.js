const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    from_time: { type: String, required: true },
    to_time: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, default: 'active' }
}, { _id : false });

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'active' },
    delay_type: { type: String, default: 'hour', enum: ['hour', 'day'] },
    delay_duration: { type: Number, default: 0 },
    order_time: { type: String },
    slots: [ slotSchema ]
}, { _id : false });

const listSchema = new mongoose.Schema({
    name: { type: String, required: true },
    following_days: { type: Number, required: true },
    status: { type: String, default: 'active' },
    groups: [ groupSchema ]
}, { _id : false });

const daysSchema = new mongoose.Schema({
    code: { type: Number, required: true },
    day: { type: String, required: true },
    active: { type: Boolean, default: false }
}, { _id : false });

const deliverySchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    available_days: [ daysSchema ],
    list: [ listSchema ],
    status: { type: String, default: 'active' },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('delivery_methods', deliverySchema);

module.exports = collections;