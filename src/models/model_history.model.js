const mongoose = require('mongoose');

const mmListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
    additional_qty: { type: Number, default: 0 }
}, { _id : false });

const mmSetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    list: [ mmListSchema ]
}, { _id : false });

const customValueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, default: 0 },
    additional_qty: { type: Number, default: 0 }
}, { _id : false });

const customListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: [ customValueSchema ]
}, { _id : false });

const notesListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true },
    required: { type: Boolean, default: false }
}, { _id : false });

const sizingValueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unique_name: { type: String, required: true },
    image: { type: String }
}, { _id : false });

const sizingListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: [ sizingValueSchema ]
}, { _id : false });

const modelSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    model_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	addon_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    mm_unit: { type: String },
    mm_sets: [ mmSetSchema ],
    custom_list: [ customListSchema ],
    notes_list: [ notesListSchema ],
    sizing_list: [ sizingListSchema ],
    created_on: { type: Date, default: Date.now },
    updated_by: { type: mongoose.Schema.Types.ObjectId, required: true }
});

const collections = mongoose.model('model_history', modelSchema);

module.exports = collections;