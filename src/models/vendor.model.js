const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");

const pickupLocSchema = new mongoose.Schema({
	name: { type: String, required: true },
	location_id: { type: String, required: true }
}, { _id : false });

const vendorSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	payout_contact_id: { type: String },
	contact_person: { type: String, required: true },
	mobile: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String },
	wallet_balance: { type: Number, default: 0 },
	page_url: { type: String, required: true },
	image: { type: String },
	company_details: {
		name: { type: String, required: true },
		brand: { type: String, required: true },
		pan_no: { type: String },
		gst_no: { type: String },
		tin_no: { type: String },
		instagram: { type: String },
		website: { type: String },
		shipping_type: { type: String, default: 'free', enum: ['free', 'paid', 'free_above'] },
		made_in_home_country: { type: String, default: 'yes', enum: ['yes', 'no'] }
	},
	registered_address: {
		country: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String },
		pincode: { type: String },
		state: { type: String }
	},
	pickup_address: {
		country: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String },
		pincode: { type: String },
		state: { type: String }
	},
	bank_details: {
		payout_account_id: { type: String },
		name: { type: String, default: "" },
		branch: { type: String },
		beneficiary: { type: String },
		ifsc_code: { type: String },
		acc_no: { type: String }
	},
	pickup_locations: [ pickupLocSchema ],
	permission_list: { type: Array, default: [] },
	temp_token: { type: String },
  forgot_request_on: { type: Date },
	session_key: { type: String, required: true },
	status: { type: String, default: 'inactive', enum: ['active', 'inactive', 'declined', 'deleted'] },
  created_on: { type: Date, default: Date.now }
});

/* Cheking Password */
vendorSchema.methods.comparePassword = function(pwd, next) {
  bcrypt.compare(pwd, this.password, function(err, isMatch) {
    return next(err, isMatch);
  });
};

const collections = mongoose.model('vendors', vendorSchema);

module.exports = collections;