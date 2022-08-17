const mongoose = require('mongoose');

/* STATE LIST */
const stateSchema = new mongoose.Schema({
   name: { type: String, required: true }
}, { _id : false });

/* ADDRESS FIELDS */
const addressSchema = new mongoose.Schema({
	keyword: { type: String, required: true },
	label: { type: String, required: true }
 }, { _id : false });

const countrySchema = new mongoose.Schema({
	name: { type: String, required: true },
	dial_code: { type: String, required: true },
	code: { type: String, required: true },
	states: [ stateSchema ],
	address_fields: [ addressSchema ],
	mobileno_length: { type: Number, required: true }
});

const collections = mongoose.model('country_list', countrySchema, 'country_list');

module.exports = collections;