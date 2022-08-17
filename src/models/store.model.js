const mongoose = require('mongoose');
const bcrypt = require("bcrypt-nodejs");
const saltRounds = 10;

// CURRENCY TYPES
const currencySchema = new mongoose.Schema({
    country_code: { type: String, required: true },
    html_code: { type: String, required: true },
    additional_charges: { type: Number, default: 0 },
    charge_unit: { type: String, enum: ['percentage', 'amount'], default: "percentage" },
    default_currency: { type: Boolean, default: false }
});

// PAYMENT TYPES
const paymentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    btn_name: { type: String, required: true },
    cod_config: {
        cod_charges: { type: Number },
        max_amount: { type: Number },
        sms_status: { type: Boolean }
    },
    sms_config: { type: Object },
    rank: { type: Number, default: 1 },
    config: { type: Object },
    app_config: { type: Object },
    additional_params: { type: Object },
    supported_currrencies: { type: Array, default: [] },
    mode: { type: String, enum: ['production', 'sandbox'] },
    status: { type: String, default: 'active' }
});

const storeSchema = new mongoose.Schema({
    dealer_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    password: { type: String, required: true },
    gst_no: { type: String },
    base_url: { type: String, required: true },
    sub_domain: { type: String, required: true },
    country: { type: String, default: 'India' },
    abandoned_status: { type: Boolean, default: false },
    default_sitemap: { type: Array, default: [] },
    device_token: { type: Object },
    app_token: { type: String },
    temp_token: { type: String },
    temp_category: { type: String },
    forgot_request_on: { type: Date },
    company_details: {
        name: { type: String, required: true },
        contact_person: { type: String, required: true },
        dial_code: { type: String, required: true },
        mobile: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String },
        state: { type: String },
        pincode: { type: String }
    },
    seo_details: {
        tile_color: { type: String, default: "#000000" },
        h1_tag: { type: String },
        page_title: { type: String },
        meta_desc: { type: String },
        meta_keywords: { type: Array, default: [] }
    },
    package_details: {
        credit: { type: Number, default: 0 },
        package_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        month: { type: Number, default: 1 },
        paid_features: { type: Array, default: [] },
        trial_expiry: { type: Date },
        billing_status: { type: Boolean, default: false },
        disc_status: { type: Boolean },
        disc_amount: { type: Number },
        transaction_range: {
            from: { type: Date },
            to: { type: Date }
        },
        expiry_date: { type: Date }
    },
    currency_types: [ currencySchema ],
    payment_types: [ paymentSchema ],
    mail_config: {
        host_type: { type: String },
        transporter: { type: Object },
        send_from: { type: String },
        contact_no: { type: String },
        enquiry_email: { type: String },
        vendor_contact_no: { type: String },
        vendor_enquiry_email: { type: String },
        cc_mail: { type: String },
        billing_mail: { type: String },
        template_config: {
            font_family: { type: String, default: "Solway,serif" },
            font_url: { type: String, default: "https://fonts.googleapis.com/css?family=Solway:400,700&display=swap" },
            theme_color: { type: String, default: "#ec848b" },
            txt_color: { type: String, enum: ['#000', '#fff'], default: "#fff" }
        },
        band_config: {
            bg_color: { type: String, default: "#e9e9e9" },
            txt_color: { type: String, enum: ['#000', '#fff'], default: '#000' }
        }
    },
    sms_config: { type: Object },
    additional_features: {
        band_status: { type: Boolean, default: true },
        cropper_resolution: { type: String, default: "900x1060" },
        menu_image: { type: Boolean },
        measurements_condition: { type: Boolean },
        custom_model: { type: Boolean, default: false },
        gc_validity_in_month: { type: Number, default: 6 },
        giftcard_type: { type: String, enum: ['onetime', 'wallet'], default: "onetime" },
        adv_product_options: { type: Boolean },
        disp_all_products: { type: Boolean, default: true },
        shipping_price_config: {
            price: { type: Number },
            free_above: { type: Number }
        }
    },
    invoice_status: { type: Boolean, default: false },
    invoice_config: {
        prefix: { type: String, default: "" },
        suffix: { type: String, default: "" },
        min_digit: { type: Number, default: 0 },
        next_invoice_no: { type: Number, default: 0 }
    },
    build_details: {
        port_number: { type: Number },
        build_number: { type: String },
        build_status: { type: String, default: "pending" },
        ssl_status: { type: String, default: "pending" }
    },
    erp_details: {
        name: { type: String },
        config: { type: Object },
        status: { type: String }
    },
    packaging_charges: {
        type: { type: String, enum: ['percentage', 'amount'] },
        value: { type: Number },
        min_package_amt: { type: Number }
    },
    dp_wallet_status: { type: Boolean },
    dp_wallet_details: {
        balance: { type: Number },
        charge_type: { type: String, enum: ['percentage', 'amount'] },
        charge_value: { type: Number }
    },
    sitemap_updated_on: { type: Date, default: Date.now },
    type: { type: String, default: 'order_based', enum: ['order_based', 'quot_based', 'service_based', 'multi_vendor', 'restaurant_based'] },
    account_type: { type: String, default: 'client', enum: ['client', 'demo'] },
    session_key: { type: String, required: true },
    secret: { type: String },
    status: { type: String, default: 'inactive', enum: ['active', 'inactive'] },
    created_on: { type: Date, default: Date.now },
    activated_on: { type: Date },
    version: { type: Number, default: 2 },
    last_login: { type: Date },
    signup_from: { type: String, default: 'web', enum: ['web', 'app'] },
    payout_gateway: {
        name: { type: String },
        config: { type: Object },
        mode: { type: String, enum: ['production', 'sandbox'] },
        status: { type: String, enum: ['active', 'inactive'] }
    },
    application_setting: {
        google_id: { type: String },
        gtag_id: { type: String },
        facebook_id: { type: String },
        facebook_pixel_id: { type: String },
        instagram_id: { type: String },
        announcement_bar: { type: String },
        announcement_timer: { type: Boolean },
        timer_date: { type: Date },
        max_shipping_weight: { type: Number },
        min_checkout_value: { type: Number },
        cod_charges: { type: Number },
        gift_wrapping_charges: { type: Number },
        search_keywords: { type: Array },
        enquiry_email: { type: String },
        cancel_order_email: { type: String },
        whatsapp_status: { type: Boolean },
        whatsapp_config: {
            mobile: { type: String },
            message: { type: String }
        },
        invoice_status: { type: Boolean },
        invoice_config: {
            prefix: { type: String },
            suffix: { type: String },
            min_digit: { type: Number },
            next_invoice_no: { type: Number }
        },
        section_grid_img_count: { type: Number }
    },
    application_access: {
        hide_currency: { type: Boolean },
        newsletter: { type: Boolean },
        newsletter_config: {
            heading: { type: String },
            sub_heading: { type: String },
            btn_text: { type: String },
            open_onload: { type: Boolean }
        },
        instagram: { type: Boolean },
        feedback: { type: Boolean },
        guest_checkout: { type: Boolean },
        product_addon: { type: Boolean },
        ship_only_in_domestic: { type: Boolean },
        disp_stock_left: { type: Boolean },
        min_stock: { type: Number },
        order_checkout: {
            offer_except_disc_products: { type: Boolean },
            cod: { type: Boolean },
            disable_cod_custom_items: { type: Boolean },
            cod_guest_checkout: { type: Boolean },
            cod_apply_coupon: { type: Boolean },
            apply_coupon: { type: Boolean },
            apply_gift_card: { type: Boolean },
            gift_order: { type: Boolean },
            order_note: { type: Boolean },
            sample_request: { type: Boolean }
        },
        newsletter_content: { type: String },
        gift_cards: { type: Boolean },
        blogs: { type: Boolean },
        discounts_page: { type: Boolean },
        ai_styles: { type: Boolean }
    },
    seo_status: { type: Boolean },
    gc_validity_in_month: { type: Number },
    max_shipping_weight: { type: Number },
    tax: { type: Number }
});

/* Encrypting Password */
storeSchema.pre('save', function(next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    // generate a salt
    bcrypt.genSalt(saltRounds, function(err, salt) {
        if (err) return next(err);
        // hash the password using our new salt
        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            return next();
        });
    });
});

/* Cheking Password */
storeSchema.methods.comparePassword = function(pwd, next) {
  bcrypt.compare(pwd, this.password, function(err, isMatch) {
    return next(err, isMatch);
  });
};

const collections = mongoose.model('stores', storeSchema);

module.exports = collections;

// remove seo_status, tax, max_shipping_weight, gc_validity_in_month in future
// quot_with_order_based