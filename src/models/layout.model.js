const mongoose = require('mongoose');

const pointsListSchema = new mongoose.Schema({
    x_pos: { type: Number },
    y_pos: { type: Number },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
}, { _id : false });

const imageListSchema = new mongoose.Schema({
    rank: { type: Number, default: 1 },
    desktop_img: { type: String, required: true },
    mobile_img: { type: String },
    img_alt: { type: String },
    link_status: { type: Boolean, default: false },
    link_type: { type: String, enum: ['category', 'product', 'internal', 'external'] },
    category_id: { type: String },
    product_id: { type: String },
    link: { type: String },
    content_status: { type: Boolean, default: false },
    content_details: {
        heading: { type: String },
        sub_heading: { type: String },
        description: { type: String },
        text_color: { type: String, enum: ['light', 'dark'], default: 'light' }
    },
    btn_status: { type: Boolean, default: false },
    btn_text: { type: String },
    position: { type: String, enum: ['t_l', 't_c', 't_r', 'm_l', 'm_c', 'm_r', 'b_l', 'b_c', 'b_r', 'left', 'right'] },
    points_list: [ pointsListSchema ]
}, { _id : false });

const multitabListSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['featured', 'new_arrivals', 'discounted', 'category'] },
    name: { type: String, required: true },
    category_id: { type: String }
}, { _id : false });

const changingTextSchema = new mongoose.Schema({
    value: { type: String }
}, { _id : false });

const layoutSchema = new mongoose.Schema({
	store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
        type: String, required: true,
        enum: [
            'primary_slider', 'slider', 'section', 'featured_section', 'featured_product', 'secondary', 'testimonial', 'shop_the_look',
            'highlighted_section', 'multiple_highlighted_section', 'multiple_featured_product', 'shopping_assistant', 'blogs', 'flexible',
            'video_section', 'highlights', 'instagram'
        ]
    },
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    heading: { type: String },
    sub_heading: { type: String },
    content: { type: String },
    section_grid_type: { type: String },
    image_list: [ imageListSchema ],
    featured_category_id: { type: String },  // for featured products
    multitab_list: [ multitabListSchema ],
    shopping_assistant_config: {
        image: { type: String },
        prompt: { type: String },
        img_alt: { type: String },
        changing_text: [ changingTextSchema ],
        sub_text: { type: String },
        btn_text: { type: String }
    },
    insta_config: {
        token: { type: String },
        allow_desc: { type: Boolean }
    },
    video_details: {
        thumbnail: { type: String },
        src: { type: String }
    },
    blogs_type: { type: String, enum: ['grid', 'slider'] },
    active_status: { type: Boolean, default: false },
    created_on: { type: Date, default: Date.now },
    updated_on: { type: Date, default: Date.now },
    ad_status: { type: String, enum: ['active', 'inactive'] },
    ad_config: {
        name: { type: String },
        image: { type: String },
        description: { type: String },
        input_remarks: { type: String },
        allocated_slots: { type: Number },
        normal_price: { type: Number },
        peak_price: { type: Number },
        schedule_status: { type: Boolean },
        schedule_from: { type: Date },
        schedule_to: { type: Date }
    }
});

const collections = mongoose.model('layouts', layoutSchema);

module.exports = collections;