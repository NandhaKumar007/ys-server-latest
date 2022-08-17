const mongoose = require('mongoose');

const restoredSectionSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ['section', 'category', 'sub_category', 'child_sub_category'], required: true },
    section_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId },
    sub_category_id: { type: mongoose.Schema.Types.ObjectId },
    child_sub_category_id: { type: mongoose.Schema.Types.ObjectId },
    details: { type: Object },
    created_on: { type: Date, default: Date.now }
});

const collections = mongoose.model('restored_sections', restoredSectionSchema);

module.exports = collections;