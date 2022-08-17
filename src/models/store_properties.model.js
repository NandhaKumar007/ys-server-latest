const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true }
}, { _id : false });

const currencySchema = new mongoose.Schema({
    currency_code: { type: String, required: true },
    country_list: [ countrySchema ]
});

const socialMediaSchema = new mongoose.Schema({
    type: { type: String, required: true },
    url: { type: String, required: true }
}, { _id : false });

const otherLinkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link_type: { type: String, enum: ['internal', 'external'], required: true },
    link: { type: String, required: true }
}, { _id : false });

const branchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    contact_person: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    landmark: { type: String },
    location_url: { type: String, required: true },
    pickup_location: { type: Boolean, default: false },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    created_on: { type: Date, default: Date.now }
});

// OPENING HRS
const hrsSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true }
}, { _id : false });

const daysSchema = new mongoose.Schema({
    code: { type: Number, required: true },
    day: { type: String, required: true },
    opening_hrs: [ hrsSchema ],
    active: { type: Boolean, default: false }
}, { _id : false });

// IMG TAGS
const imgTagSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, default: 0 },
    status: { type: String, default: 'active' }
});

const autoImgTagSchema = new mongoose.Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'active' }
}, { _id : false });

// SCHEMA
const propertySchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    application_setting: {
        google_id: { type: String },
        facebook_id: { type: String },

        customize_name: {
            Pcs: { type: String, default: "CUSTOMIZE YOUR GARMENT" },
            Mts: { type: String, default: "STITCH GARMENT" },
            Kgs: { type: String, default: "CUSTOMIZE YOUR PRODUCT" }
        },
        
        min_qty: {
            Pcs: { type: Number, default: 1 },
            Mts: { type: Number, default: 1 },
            Kgs: { type: Number, default: 1 }
        },
        step_qty: {
            Pcs: { type: Number, default: 1 },
            Mts: { type: Number, default: 1 },
            Kgs: { type: Number, default: 1 }
        },

        max_shipping_weight: { type: Number, default: 0 },
        min_checkout_value: { type: Number, default: 0 },
        gift_wrapping_charges: { type: Number, default: 0 },
        enquiry_email: { type: String },
        vendor_enquiry_email: { type: String },
        cancel_order_email: { type: String },

        sp_slot_duration: { type: Number, default: 60 },
        sp_delay_type: { type: String, enum: ['hour', 'day'], default: 'day' },
        sp_delay_duration: { type: Number, default: 1 },

        announcebar_status: { type: Boolean },
        announcebar_config: {
            content: { type: String },
            timer: { type: Boolean },
            timer_date: { type: Date },
            link_status: { type: Boolean },
            link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
            category_id: { type: String },
            product_id: { type: String },
            link: { type: String }
        },

        newsletter_status: { type: Boolean },
        newsletter_config: {
            heading: { type: String },
            sub_heading: { type: String },
            image: { type: String },
            btn_text: { type: String },
            open_onload: { type: Boolean },
            subscription_status: { type: Boolean },
            link_type: { type: String, enum: ['internal', 'external'] },
            link: { type: String }
        },

        chat_status: { type: Boolean },
        chat_config: {
            type: { type: String, enum: ['third_party', 'whatsapp'] },
            only_on_home: { type: Boolean },
            url: { type: String },
            mobile: { type: String },
            message: { type: String }
        },

        search_keywords: { type: Array, default: [] },
        hide_currency: { type: Boolean },
        feedback: { type: Boolean, default: true },
        guest_checkout: { type: Boolean, default: true },
        product_addon: { type: Boolean, default: true },
        ship_only_in_domestic: { type: Boolean },
        disable_delivery: { type: Boolean },
        disable_delivery_time_slots: { type: Boolean },
        disp_stock_left: { type: Boolean },
        min_stock: { type: Number, default: 0 },
        tag_position: { type: String, enum: ['t_l', 't_r', 'b_l', 'b_r'], default: "t_l" }
    },
    checkout_setting: {
        offer_except_disc_products: { type: Boolean },
        disable_cod_custom_items: { type: Boolean },
        cod_guest_checkout: { type: Boolean, default: true },
        cod_apply_coupon: { type: Boolean },
        cod_store_pickup: { type: Boolean },
        apply_coupon: { type: Boolean, default: true },
        apply_gift_card: { type: Boolean, default: true },
        gift_order: { type: Boolean, default: true },
        order_note: { type: Boolean, default: true },
        sample_request: { type: Boolean, default: true }
    },
    footer_config: {
        address_config: {
            title: { type: String, default: "ADDRESS" },
            content: { type: String }
        },
        contact_config: {
            title: { type: String, default: "CONTACT" },
            content: { type: String }
        },
        social_media_title: { type: String },
        social_media_links: [ socialMediaSchema ],
        payment_methods: { type: Array },
        other_links: [ otherLinkSchema ]
    },
    giftcard_config: {
        price_list: { type: Array },
        price_range_status: { type: Boolean },
        price_range: {
            from: { type: Number },
            to: { type: Number }
        }
    },
    blog_seo: {
        status: { type: Boolean },
        h1_tag: { type: String },
        page_title: { type: String },
        meta_desc: { type: String },
        meta_keywords: { type: Array }
    },
    currency_list: [ currencySchema ],
    branches: [ branchSchema ],
    opening_days: [ daysSchema ],
    pincodes: { type: Array, default: [] },
    img_tag_list: [ imgTagSchema ],
    auto_tags: [ autoImgTagSchema ],
    pickup_locations: { type: Array },
    store: {
        social_login: { type: Boolean },
        menus: { type: Boolean },
        collections: { type: Boolean },
        similar_products: { type: Boolean },
        discounts_page: { type: Boolean },
        advanced_seo: { type: Boolean },
        currency_variation: { type: Boolean },
        ip_based: { type: Boolean },
        archive: { type: Boolean },
        newsletter: { type: Boolean },
        gift_cards: { type: Boolean },
        blogs: { type: Boolean },
        testimonials: { type: Boolean },
        cart_recovery: { type: Boolean },
        tags: { type: Boolean },
        addons: { type: Boolean },
        measurements: { type: Boolean },
        measurements_condition: { type: Boolean },
        foot_note: { type: Boolean },
        faq: { type: Boolean },
        tax_rates: { type: Boolean },
        size_chart: { type: Boolean },
        manual_order: { type: Boolean },
        manual_giftcard: { type: Boolean },
        giftcard_type: { type: String, enum: ['onetime', 'wallet'] },
        gc_validity_in_month: { type: Number },
        order_note: { type: Boolean },
        gift_order: { type: Boolean },
        sub_users: { type: Boolean },
        max_sub_users: { type: Number },
        vendors: { type: Boolean },
        courier_partners: { type: Boolean },
        ai_styles: { type: Boolean },
        sizing_assistant: { type: Boolean },
        inactive_orders: { type: Boolean },
        donation: { type: Boolean },
        data_export: { type: Boolean },
        product_search: { type: Boolean },
        feedback: { type: Boolean },
        pincode_service: { type: Boolean },
        offer_only_in_order: { type: Boolean },
        seo: { type: Boolean },
        offers: { type: Boolean },
        cash_on_delivery: { type: Boolean },
        home_page: { type: String, enum: ['banner_based', 'layout_based'] }
    },
    sections: {
        default_menu_name: { type: String },
        multi_megamenu: { type: Boolean },
        section_limit: { type: Number },
        category_limit: { type: Number },
        sub_category_limit: { type: Number },
        child_sub_category_limit: { type: Number },
        page_content: { type: Boolean }
    },
    products: {
        limit: { type: Number },
        img_count: { type: Number },
        resolution: { type: String },
        img_tag: { type: Boolean },
        video: { type: Boolean },
        variants: { type: Boolean },
        hsn_code: { type: Boolean },
        brands: { type: Boolean }
    },
    addons: {
        image: { type: Boolean },
        customization: { type: Boolean },
        custom_model: { type: Boolean }
    },
    shipping: {
        type: { type: String, enum: ['general', 'time-based'] },
        domestic_zone: { type: Boolean },
        international_zone: { type: Boolean }
    }
});

const collections = mongoose.model('store_permissions', propertySchema);

module.exports = collections;