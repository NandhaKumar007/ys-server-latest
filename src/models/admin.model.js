const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");

// PAYMENT TYPES
const paymentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  btn_name: { type: String, required: true },
  rank: { type: Number, default: 1 },
  config: { type: Object },
  app_config: { type: Object },
  transaction_fees: { type: Number, default: 0 },
  admin_panel_callback: {
    return_url: { type: String },
    cancel_url: { type: String }
  },
  status: { type: String, default: 'active' }
});

// Categories
const proGroupSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  next_image_set: { type: Array, required: true }
}, { _id : false });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  display: { type: String, required: true },
  code: { type: String, required: true },
  next_template: { type: Number, required: true },
  next_content: { type: Number, required: true },
  next_group_id: { type: Number, required: true },
  product_groups: [ proGroupSchema ],
  status: { type: String, default: 'active' }
}, { _id : false });

/* ADMIN */
const adminSchema = new mongoose.Schema({
    email: { type: String },
    password: { type: String },
    session_key: { type: String, required: true },
    status: { type: String, default: 'active' },
    payment_types: [ paymentSchema ],
    total_templates: { type: Number, required: true },
    total_contents: { type: Number, required: true },
    categories: [ categorySchema ],
    invoice_config: {
      prefix: { type: String },
      suffix: { type: String },
      min_digit: { type: Number },
      next_invoice_no: { type: Number }
    },
    auto_deploy: { type: Boolean },
    jenkin_token: { type: String },
    next_port: { type: Number }
});

/* Cheking Password */
adminSchema.methods.comparePassword = function(pwd, next) {
  bcrypt.compare(pwd, this.password, function(err, isMatch) {
    return next(err, isMatch);
  });
};

module.exports = mongoose.model('admin', adminSchema, 'admin');