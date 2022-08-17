const mongoose = require('mongoose');

// ADDONS
const customOptionListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    link_to: { type: String, default: 'all' },
    price: { type: Number, default: 0 },
    additional_qty: { type: Number, default: 0 }
}, { _id : false });

const customListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['either_or', 'multiple', 'mandatory', 'limited'], required: true },
    limit: { type: Number, default: 0 },
    option_list: [customOptionListSchema]
}, { _id : false });

const addonListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    min_stock: { type: Number, default: 0 },
    rank: { type: Number, required: true },
    image: { type: String },
    custom_list: [customListSchema],
    mm_list: [new mongoose.Schema({
        mmset_id: { type: mongoose.Schema.Types.ObjectId, required: true }
    }, { _id : false })],
    notes_title: { type: String },
    notes_list: [new mongoose.Schema({
        name: { type: String, required: true },
        required: { type: Boolean, default: false }
    }, { _id : false })],
    status: { type: String, default: 'active' }
});

// MEASUREMENT
const unitSchema = new mongoose.Schema({
    name: { type: String, enum: ['inches', 'cms'], required: true },
    max_value: { type: Number, default: 0 }
}, { _id : false });

const conditionSchema = new mongoose.Schema({
    list: [
        new mongoose.Schema({
            unit: { type: String, required: true },
            mm_from: { type: Number, default: 0 },
            mm_to: { type: Number, default: 0 },
            additional_qty: { type: Number, default: 0 }
        }, { _id : false })
    ]
}, { _id : false });

const measurementListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    conditions: [conditionSchema]
}, { _id : false });

const measurementSetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    image: { type: String },
    units: [unitSchema],
    list: [measurementListSchema],
    status: { type: String, default: 'active' }
});

// FOOT NOTE
const NoteOptionListSchema = new mongoose.Schema({
    description: { type: String, required: true }
}, { _id : false });

const footListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    option_list: [NoteOptionListSchema]
});

// FAQ
const answerListSchema = new mongoose.Schema({
    answer: { type: String, required: true }
});

const faqListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    answer_list: [answerListSchema],
    status: { type: String, default: 'active' }
});

// SIZE CHART
const sizeChartSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unit: { type: String },
    description: { type: String },
    chart_list: { type: Array },
    status: { type: String, default: 'active' }
});

// SCHEMA
const featuresSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    addon_list: [addonListSchema],
    measurement_set: [measurementSetSchema],
    footnote_list: [footListSchema],
    faq_list: [faqListSchema],
    size_chart: [sizeChartSchema]
});

const collections = mongoose.model('vendor_features', featuresSchema);

module.exports = collections;