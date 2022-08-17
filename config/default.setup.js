let menu_list = [
    {
        "name" : "Shop",
        "rank" : 1,
        "link_status" : false,
        "sections" : [ 
            {
                "name": "All Products",
                "rank": 1,
                "link_status": true,
                "link_type": "internal",
                "link": "/all-products"
            },
            {
                "name": "New Arrivals",
                "rank": 2,
                "link_status": true,
                "link_type": "internal",
                "link": "/new-arrivals"
            }
        ]
    },
    {
        "name": "On Sale",
        "rank": 3,
        "link_status": true,
        "link_type": "internal",
        "link": "/on-sale"
    }
];

let product_list = [
    {
        "seo_details": {
            "page_url": "your-products-name-001",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": true,
        "seo_status": true,
        "rank": 1,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product6-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product6-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "001",
        "selling_price": 3000,
        "discounted_price": 2700,
        "stock": 12,
        "disc_percentage": 10,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-002",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": true,
        "seo_status": true,
        "rank": 2,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product2-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product2-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "002",
        "selling_price": 4000,
        "discounted_price": 3400,
        "stock": 24,
        "disc_percentage": 15,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-003",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 5,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": true,
        "seo_status": true,
        "rank": 3,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product3-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product3-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "003",
        "selling_price": 2000,
        "discounted_price": 1900,
        "stock": 11,
        "disc_percentage": 5,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-004",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 2,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": true,
        "seo_status": true,
        "rank": 4,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product4-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product4-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "004",
        "selling_price": 1000,
        "discounted_price": 750,
        "stock": 2,
        "disc_percentage": 25,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-005",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": true,
        "seo_status": true,
        "rank": 5,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product5-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product5-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "005",
        "selling_price": 6000,
        "discounted_price": 5400,
        "stock": 11,
        "disc_percentage": 10,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-006",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": true,
        "seo_status": true,
        "rank": 6,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product7-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product7-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "006",
        "selling_price": 5000,
        "discounted_price": 3750,
        "stock": 1,
        "disc_percentage": 25,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-007",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": false,
        "seo_status": true,
        "rank": 7,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product8-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product8-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "007",
        "selling_price": 5000,
        "discounted_price": 5000,
        "stock": 200,
        "disc_percentage": null,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-008",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": false,
        "seo_status": true,
        "rank": 8,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product9-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product9-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "008",
        "selling_price": 7000,
        "discounted_price": 7000,
        "stock": 11,
        "disc_percentage": null,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-009",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": false,
        "seo_status": true,
        "rank": 9,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product10-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product10-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "009",
        "selling_price": 5000,
        "discounted_price": 5000,
        "stock": 1,
        "disc_percentage": null,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-010",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": false,
        "seo_status": true,
        "rank": 10,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product11-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product11-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "010",
        "selling_price": 5000,
        "discounted_price": 5000,
        "stock": 1900,
        "disc_percentage": null,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-011",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": true,
        "allow_cod": true,
        "description": "your product's description.",
        "disc_status": false,
        "seo_status": true,
        "rank": 11,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product1-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product1-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "011",
        "selling_price": 4000,
        "discounted_price": 4000,
        "stock": 300,
        "disc_percentage": null,
        "video_details": {}
    },
    {
        "seo_details": {
            "page_url": "your-products-name-012",
            "h1_tag": "Your product's name",
            "page_title": "Your product's name",
            "meta_desc": "Your product's description."
        },
        "category_id": [],
        "weight": 1,
        "featured": false,
        "allow_cod": true,
        "description": "Your product's description.",
        "disc_status": false,
        "seo_status": true,
        "rank": 12,
        "image_list": [
            {
                "image": "uploads/yourstore/store-products/product12-a.jpg"
            },
            {
                "image": "uploads/yourstore/store-products/product12-b.jpg"
            }
        ],
        "unit": "Pcs",
        "name": "Your product's name",
        "sku": "012",
        "selling_price": 1200,
        "discounted_price": 1200,
        "stock": 11,
        "disc_percentage": null,
        "video_details": {}
    }
];

let layout_list = [
    {
        "active_status": true,
        "rank": 1,
        "type": "primary_slider",
        "name": "Primary Slider",
        "unique_name": "primary_slider",
        "image_list": [
            {
                "content_details": { "text_color": "dark" },
                "rank": 1,
                "link_status" : true,
                "content_status" : true,
                "btn_status" : true,
                "link_type" : "internal",
                "btn_text" : "Shop Now",
                "link" : "/all-products"
            },
            {
                "content_details": { "text_color": "dark" },
                "rank": 2,
                "link_status" : true,
                "content_status" : true,
                "btn_status" : true,
                "link_type" : "internal",
                "btn_text" : "Shop Now",
                "link" : "/on-sale"
            }
        ]
    },
    {
        "active_status": true,
        "rank": 2,
        "type": "highlighted_section",
        "name": "Highlight Brand",
        "unique_name": "brand_highlighted_section",
        "image_list": [{ "position": "left" }]
    },
    {
        "active_status": true,
        "rank": 3,
        "type": "section",
        "section_grid_type": "grid_3",
        "name": "Categories Tile",
        "unique_name": "category_grid",
        "image_list": [
            {
                "content_details": {
                    "text_color": "dark",
                    "heading": "All Products"
                },
                "position" : "m_c",
                "rank": 1,
                "link_status": true,
                "content_status": true,
                "link_type" : "internal",
                "link" : "/all-products"
            },
            {
                "content_details": {
                    "text_color": "dark",
                    "heading": "New Arrivals"
                },
                "position" : "m_c",
                "rank": 2,
                "link_status": true,
                "content_status": true,
                "link_type" : "internal",
                "link" : "/new-arrivals"
            },
            {
                "content_details": {
                    "text_color": "dark",
                    "heading": "On Sale"
                },
                "position" : "m_c",
                "rank": 3,
                "link_status": true,
                "content_status": true,
                "link_type" : "internal",
                "link" : "/on-sale"
            }
        ]
    },
    {
        "active_status": true,
        "rank": 5,
        "type": "highlighted_section",
        "name": "Highlight Advantage",
        "unique_name": "advantage_highlighted_section",
        "image_list": [{ "position": "right" }]
    },
    {
        "active_status": true,
        "rank": 4,
        "type": "featured_product",
        "name": "All Products",
        "unique_name": "featured_product",
        "featured_category_id" : "all_products",
        "image_list": []
    },
    {
        "active_status": true,
        "rank": 6,
        "type": "section",
        "section_grid_type": "grid_3",
        "name": "The Best",
        "unique_name": "section_grid",
        "image_list": [
            {
                "content_details": { "text_color": "dark" },
                "position" : "m_c",
                "rank": 1,
                "content_status": true
            },
            {
                "content_details": { "text_color": "dark" },
                "position" : "m_c",
                "rank": 2,
                "content_status": true
            },
            {
                "content_details": { "text_color": "dark" },
                "position" : "m_c",
                "rank": 3,
                "content_status": true
            }
        ]
    }
];

let footer_config = {
    address_config: { title: "ADDRESS" },
    contact_config: { title:"CONTACT" },
    social_media_title: "SOCIAL MEDIA",
    social_media_links: [],
    payment_methods: ["amex", "maestro", "mastercard", "paypal", "paytm", "upi", "visa"],
    other_links: [
        { name: "Terms and Conditions", link_type: "internal", link: "/terms-and-conditions" },
        { name: "Privacy Policy", link_type: "internal", link: "/privacy-policy" },
        { name: "Shipping Policy", link_type: "internal", link: "/shipping-policy" },
        { name: "Cancellation Policy", link_type: "internal", link: "/cancellation-policy" },
        { name: "About Us", link_type: "internal", link: "/pages/about-us" },
        { name: "Contact Us", link_type: "internal", link: "/contact-us" }
    ]
};

let package_details = {
    // Genie
    "5f4cd131573e9a1e680239f1": {
        name: "Free",
        app_list: [
            "50 Products",
            "Dashboard",
            "Order Status Triggers",
            "Invoice Generator",
            "Basic SEO Editor",
            "Standard Sales Report",
            "Standard Email Template",
            "Payment Gateway Integration",
            "COD",
            "Tax Module",
            "SSL",
            "Standard Email Support"
        ]
    },
    "620650bfc3357e26783c47ad": {
        name: "Essential",
        app_list: []
    },
    "620650fbc3357e26783c47ae": {
        name: "Professional",
        app_list: []
    },
    // None
    "5f4cd1a3573e9a1e680239f9": {
        name: "Lite",
        app_list: [
            "Unlimited Products",
            "Advanced Discount Codes",
            "Dashboard",
            "Order Status Triggers",
            "Invoice Generator",
            "Advanced SEO Editor",
            "Multi Format Sales Report",
            "Standard Email Template",
            "Payment Gateway Integration",
            "COD",
            "Tax Module",
            "SSL",
            "Unlimited Product Variants",
            "Unlimited Menus",
            "Flat Rate Shipping Integration",
            "Social Media Login",
            "Google - Facebook Ad Tracking",
            "Custom Product Footnotes",
            "Custom Size Chart",
            "Messenger Integration",
            "Bulk Upload",
            "Product Search",
            "App Store Access",
            "Priority Email Support"
        ]
    },
    // B2C
    "5f4cd235573e9a1e680239fd": {
        name: "Starter",
        app_list: [
            "Unlimited Products",
            "Advanced Discount Codes",
            "Dashboard",
            "Order Status Triggers",
            "Invoice Generator",
            "Advanced SEO Editor",
            "Multi Format Sales Report",
            "Standard Email Template",
            "Payment Gateway Integration",
            "COD",
            "Tax Module",
            "SSL",
            "Unlimited Product Variants",
            "Unlimited Menus",
            "Flat Rate Shipping Integration",
            "Social Media Login",
            "Google - Facebook Ad Tracking",
            "Custom Product Footnotes",
            "Custom Size Chart",
            "Messenger Integration",
            "Bulk Upload",
            "Product Search",
            "App Store Access",
            "Abandoned Cart Recovery",
            "Testimonial Uploader",
            "Browser Push Notifications",
            "Blog Module",
            "Customer Feedback Module",
            "Newsletter Subscription",
            "Product Filters and Tags",
            "Priority Email Support"
        ]
    },
    "5f4cd434573e9a1e68023a03": {
        name: "Growth",
        app_list: [
            "Unlimited Products",
            "Advanced Discount Codes",
            "Dashboard",
            "Order Status Triggers",
            "Invoice Generator",
            "Advanced SEO Editor",
            "Multi Format Sales Report",
            "Standard Email Template",
            "Payment Gateway Integration",
            "COD",
            "Tax Module",
            "SSL",
            "Unlimited Product Variants",
            "Unlimited Menus",
            "Flat Rate Shipping Integration",
            "Social Media Login",
            "Google - Facebook Ad Tracking",
            "Custom Product Footnotes",
            "Custom Size Chart",
            "Messenger Integration",
            "Bulk Upload",
            "Product Search",
            "App Store Access",
            "Abandoned Cart Recovery",
            "Testimonial Uploader",
            "Browser Push Notifications",
            "Blog Module",
            "Customer Feedback Module",
            "Newsletter Subscription",
            "Product Filters and Tags",
            "Product FAQ",
            "Gift Cards",
            "Mark Product as Gift",
            "Order Instructions/Comments",
            "Manual Order Creation",
            "Priority Email Support"
        ]
    },
    "5f4cd4c5573e9a1e68023a04": {
        name: "Premium",
        app_list: [
            "Unlimited Products",
            "Advanced Discount Codes",
            "Dashboard",
            "Order Status Triggers",
            "Invoice Generator",
            "Advanced SEO Editor",
            "Multi Format Sales Report",
            "Standard Email Template",
            "Payment Gateway Integration",
            "COD",
            "Tax Module",
            "SSL",
            "Unlimited Product Variants",
            "Unlimited Menus",
            "Flat Rate Shipping Integration",
            "Social Media Login",
            "Google - Facebook Ad Tracking",
            "Custom Product Footnotes",
            "Custom Size Chart",
            "Messenger Integration",
            "Bulk Upload",
            "Product Search",
            "App Store Access",
            "Abandoned Cart Recovery",
            "Testimonial Uploader",
            "Browser Push Notifications",
            "Blog Module",
            "Customer Feedback Module",
            "Newsletter Subscription",
            "Product Filters and Tags",
            "Product FAQ",
            "Gift Cards",
            "Mark Product as Gift",
            "Order Instructions/Comments",
            "Manual Order Creation",
            "Calculated Shipping Rates",
            "Product Customization Module",
            "Product Measurement Module",
            "Currency Convertor",
            "Priority Chat Support",
            "Call Support"
        ]
    },
    // B2B
    "626a6616bb6d8c0afb0f4fc6": {
        name: "Growth",
        app_list: []
    },
    "626a6ac4bb6d8c0afb0f9c92": {
        name: "Premium",
        app_list: []
    },
    // Service
    "626a6ee0bb6d8c0afb0fdb92": {
        name: "Starter",
        app_list: []
    },
    "626a6f7abb6d8c0afb0fe5fd": {
        name: "Growth",
        app_list: []
    },
    // vendor
    "626ab91fbb6d8c0afb162396": {
        name: "Premium",
        app_list: []
    },
    "626ab945bb6d8c0afb162933": {
        name: "Premium Plus",
        app_list: []
    }
};

let policies = [
    {
        type: "terms_conditions",
        title: "TERMS AND CONDITIONS",
        content: "<p>Welcome to ##store_name##. As you continue to browse and use this website you are agreeing to comply with and be bound by the following terms and conditions, which together with our privacy policy, govern ##store_name##’s relationship with you and the website. The term '##store_name##' or 'us' or 'we' refers to the owner of the website ##domain_name##, the term 'you' refers to the user or viewer of our website. The use of this website is subject to the following terms:</p><p><br></p><ul><li>The content of this website is for your general information and use only. It is subject to change without any prior notice.</li><li>Neither we nor any third party provides any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability to the fullest extent permitted by law.</li><li>Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through this website meet your specific requirements.</li><li>This website contains material that is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li><li>Unauthorized use of this website may give rise to a claim for damages and/or be a criminal offence. From time to time this website may also include links to other websites. These links are provided for your convenience to provide further information. They do not signify that we endorse the website(s). We have no responsibility for the content of the linked website(s).</li><li>You may not create a link to this website from another website or document without ##store_name##'s prior written consent.</li><li>Your use of this website and any dispute arising out of such use of the website is subject to the laws of India or other regulatory authorities.</li></ul><p><br></p><p><strong>CANCELLATION POLICY</strong></p><p>##store_name## believes in helping its customers as far as possible and has, therefore, a liberal Cancellation Policy. Under this policy:</p><p><br></p><ul><li>Cancellations will be considered only if the request is made within 12 hours of placing an order.</li><li>Refunds will be done within 7-10 working days in the case of online payments done through the Credit/Debit/Net banking facility.</li></ul><p><br></p><p><strong>RETURN/EXCHANGE POLICY</strong></p><ul><li>All products are pre-checked for quality and defects before they are shipped. In spite of our best efforts, if you find the product delivered is damaged, kindly email the customer care for the Return procedure within 24 hours of delivery. The decision to accept returns rests solely with the ##store_name##’s Team.</li><li>The products are examined in detail for defects before shipping. Once the products are shipped no returns will be accepted unless there are any defects.</li><li>If the product is disliked by the customer it is not eligible for exchange.</li><li>The photos of all products are taken under neutral lighting conditions, and we make the best possible effort to reproduce the exact colour. The colours may look different due to your monitor or device settings.</li><li>Please ensure that products are returned in original condition and packaging in order to get your full credit. Kindly note that this is a non-negotiable policy.</li><li>Once the ##store_name## team decides to accept the request, It shall take a week’s time to refund or exchange.</li><li>Lastly, the exchange facility shall only be provided once and for all. Repetitive exchange requests shall not be entertained.</li></ul><p><br></p><p><strong>PAYMENT POLICY</strong></p><p>Our Payment Methods include Razorpay. The payment gateway offers complete security in your payment transactions. Customers can pay through any of the cards that are accepted by the above gateways. Any partial or full refunds in case of unavailability of the product will be credited back to the respective accounts through which we have received payments.</p><p><br></p><p>The price of the product mentioned on the website is final and we do not offer discounts of any nature.</p><p><br></p><p>##store_name## is not responsible if any form of fraud occurs while you are making payments as all transactions are done on the respective payment gateway partner’s website. However, we do promise to help in whatever way possible in case you are facing difficulty while making payments.</p><p><br></p><p><strong>PRICING INFORMATION</strong></p><p>While ##store_name## strives to provide accurate product and pricing information, typographical errors may occur. In case if the product is listed with an incorrect price or information, ##store_name## shall have the right, at its sole discretion, to refuse or cancel any orders placed for that product, unless the product has already been dispatched, In such case, ##store_name## may either contact you for instructions or cancel your order and notify you of such cancellation. Unless the product ordered by you has been dispatched, your offer will not be deemed accepted and ##store_name## will have the right to modify the price of the product and contact you for further instructions using the e-mail address provided by you during the time of registration, or cancel the order and notify you of such cancellation. In the event that accepts your order, the same shall be debited to your credit card account and duly notified to you by email that the payment has been processed. The payment may be processed prior to ##store_name## dispatch of the product that you have ordered. If you have to cancel the order after we have processed the payment, the said amount will be reversed back to your credit card account.</p><p><br></p><p>We strive to provide you with the best prices. However, sometimes a price online may not match the price of a store. In our effort to be the lowest price provider in your particular geographic region, store pricing may sometimes differ from online prices. Prices and availability are subject to change without notice.</p><p><br></p><p><strong>ELECTRONIC COMMUNICATIONS</strong></p><p>When you subscribe or register with us, you automatically give us the consent to communicate with you. You agree that all agreements, notices, disclosures and other communications that we provide to you electronically satisfy any legal requirement that such communications be in writing. Also, we will be sending you an email to inform you about new collections and any other information that we feel might be relevant to convey to our customers.</p><p><br></p><p><strong>LEGAL JURISDICTION</strong></p><p>This User Agreement shall be construed in accordance with the applicable laws of India. Any disputes arising out of any transactions made on the ##store_name## website will be settled in the courts of ##city##.</p>"
    },
    {
        type: "privacy",
        title: "PRIVACY POLICY",
        content: "<p>We are fully committed to protecting your privacy.</p><p>We collect information about you for 2 reasons: firstly, to process your order and second, to provide you with the best possible service.</p><p>The type of information we may collect from you includes:</p><p><strong>Your Name</strong></p><p><strong>Address</strong></p><p><strong>Phone Number</strong></p><p><strong>Email Address</strong></p><p>The information you provide us will be secure and will not be shared with any third party without your explicit consent.</p><p>We may use technology to track the patterns of behaviour of visitors to our site. This can include using a 'cookie' that would be stored on your browser. You can usually modify your browser to prevent this from happening. The information collected in this way can be used to identify you unless you modify your browser settings.</p><p>Should you have any questions on the above said please reach out to us and we will be happy to assist you.</p>"
    },
    {
        type: "shipping",
        title: "SHIPPING POLICY",
        content: "<p><strong>Where Do We Deliver?</strong></p><p>We deliver to cities and towns all over India where trusted courier services. We request you to provide your full address at the time of order with the Pin Code and Phone number in order to make the delivery process smooth &amp; efficient.</p><p><br></p><p><strong>Shipping In India</strong></p><p>Please ensure you provide us with the complete details of the person being shipped to. If you require products to be delivered on any particular date, please write to us. We will try our best to deliver on the requested date.</p><p><br></p><p><strong>Transit Time</strong></p><p>We ship all orders through the fastest possible &amp; reputed courier services that deliver within 4-7 working days(post dispatch) or more depending on the location. These dates are not binding on us as a third party provides the service.</p><p>For shipping overseas, the delivery time may vary from 4-7 working days(post dispatch) depending on the destination. We cannot be held responsible for any unforeseen delays from the end of the carrier.</p><p><br></p><p><strong>Transit &amp; Charges</strong></p><p>We will provide you with the tracking number as soon as the goods are dispatched. The Entire order will be shipped once all the products are available. Any inward taxes or duties as applicable in line with the laws of the respective country or state will have to be borne by the customer.</p><p><br></p><p><strong>Return Of Shipments</strong></p><p>The right to accept returns is solely the decision of&nbsp;##store_name##. In case returns are made by customers where there has been no fault on part of&nbsp;##store_name##, the entire shipping cost must be borne with customers. Products thus returned must be unused and should be in original condition and packaging. Also, courier services of international standards must be used and the liability rests entirely on the sender in the event of the loss of product while shipping the product back.</p><p><br></p><p><strong>Conditions:</strong></p><p>In case of extraordinary circumstances,&nbsp;##store_name## cannot guarantee delivery of orders in the promised period. Management reserves the right to take a call on the necessary action.</p>"
    },
    {
        type: "cancellation",
        title: "CANCELLATION POLICY",
        content: "<p>##store_name## believes in helping its customers as far as possible and has, therefore, a liberal Cancellation Policy. Under this policy:</p><ul><li>Cancellations will be considered only if the request is made within 12 hours of placing an order.</li><li>Refunds will be done within 7-10 working days in the case of online payments done through the Credit/Debit/Net banking facility.</li></ul><p><br></p><p><strong>RETURN/EXCHANGE POLICY</strong></p><ul><li>All products are pre-checked for quality and defects before they are shipped. In spite of our best efforts, if you find the product delivered is damaged kindly email the customer care for the Return procedure within 24 hours of delivery. The decision to accept returns rests solely with the ##store_name## Team.</li><li>Once the products are shipped no returns will be accepted unless the above-mentioned details stand true.</li><li>If the product is disliked by the customer it is not eligible for exchange.</li><li>The photos of all products are taken under neutral lighting conditions, and we make the best possible effort to reproduce the exact product colour. Sometimes the colours may look different due to the temperature of your monitor and/or device settings.</li><li>Please ensure that products are returned in original condition and packaging in order to get your full credit. Kindly note that this is a non-negotiable policy.</li><li>Once the ##store_name## team decides to accept the request, It shall take a week’s time to refund or exchange.</li><li>Lastly, the exchange facility shall only be provided once and for all. Repetitive exchange requests shall not be entertained</li></ul>"
    }
];

let daywiseDiscounts = [
    { days: 1, discount: 5 }, { days: 2, discount: 4 }, { days: 3, discount: 3 }, { days: 4, discount: 3 },
    { days: 5, discount: 2 }, { days: 6, discount: 2 }, { days: 7, discount: 1 }
];

module.exports = {
    menu: menu_list,
    policies: policies,
    product: product_list,
    footer_config: footer_config,
    package_details: package_details,
    daywise_discounts: daywiseDiscounts,
    layouts(storeDetails, category, templateIndex, contentIndex) {
        let categoryData = getCategoryInfo(storeDetails, category, templateIndex, contentIndex);
        if(categoryData) {
            let layoutInfo = categoryData.layout_list;
            layout_list.forEach((el, index) => {
                // primary slider
                if(index===0) {
                    el.image_list.forEach((obj, objIndex) => {
                        obj.content_details.heading = layoutInfo[index].image_list[objIndex].heading;
                        obj.content_details.sub_heading = layoutInfo[index].image_list[objIndex].sub_heading;
                        obj.desktop_coordinates = layoutInfo[index].image_list[objIndex].desktop_coordinates;
                        obj.mobile_coordinates = layoutInfo[index].image_list[objIndex].mobile_coordinates;
                        obj.position = layoutInfo[index].image_list[objIndex].position;
                    });
                }
                else {
                    el.heading = layoutInfo[index].heading;
                    el.sub_heading = layoutInfo[index].sub_heading;
                    // section grid
                    if(index===5) {
                        el.image_list.forEach((obj, objIndex) => {
                            obj.content_details.heading = layoutInfo[index].image_list[objIndex].heading;
                        });
                    }
                    // advantage highlighted section
                    if(index===3) {
                        el.coordinates = layoutInfo[index].coordinates;
                    }
                }
            });
            return layout_list;
        }
        else { return null; }
    },
    getStoreCatInfo(storeDetails, category, templateIndex, contentIndex) {
        return getCategoryInfo(storeDetails, category, templateIndex, contentIndex);
    },
    contactUsConfig(storeDetails) {
        let compDetails = storeDetails.company_details;
        return {
            heading: "SAY HELLO",
            sub_heading: "Feel free to get in touch with us.",
            address: "<p><em style='background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);'>"+compDetails.address+",</em></p><p><em style='background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);'>"+compDetails.city+", "+compDetails.state+" "+compDetails.pincode+",</em></p><p><em style='background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);'>"+storeDetails.country+" Phone: ("+compDetails.dial_code+")"+compDetails.mobile+"</em></p><p><em style='background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);'>Whatsapp: "+compDetails.dial_code+" "+compDetails.mobile+"</em></p><p><em style='background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);'>Email:&nbsp;</em><a href='mailto:"+storeDetails.email+"' rel='noopener noreferrer' target='_blank' style='background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);'><em>"+storeDetails.email+"</em></a></p>",
            store_id: storeDetails._id
        };
    }
};

function getCategoryInfo(storeDetails, category, templateIndex, contentIndex) {
    let templateSets = [
        {
          desktop_coordinates: { left: 1185, top: 160 },
          mobile_coordinates: { left: 141, top: 366 },
          primary_txt_position: "m_l",
          advantage_coordinates: { left: 279, top: 131 }
        },
        {
          desktop_coordinates: { left: 225, top: 160 },
          mobile_coordinates: { left: 141, top: 366 },
          primary_txt_position: "m_r",
          advantage_coordinates: { left: 279, top: 131 }
        },
        {
          desktop_coordinates: { left: 1233, top: 160 },
          mobile_coordinates: { left: 239, top: 366 },
          primary_txt_position: "m_l",
          advantage_coordinates: { left: 279, top: 131 }
        },
        {
          desktop_coordinates: { left: 980, top: 160 },
          mobile_coordinates: { left: 141, top: 366 },
          primary_txt_position: "m_l",
          advantage_coordinates: { left: 279, top: 131 }
        },
        {
          desktop_coordinates: { left: 181, top: 160 },
          mobile_coordinates: { left: 141, top: 366 },
          primary_txt_position: "m_r",
          advantage_coordinates: { left: 279, top: 131 }
        }
    ];
    
    let clothingList = [
        {
            site_title: storeDetails.name+" | Online shopping "+storeDetails.company_details.city+", "+storeDetails.country+" - Shop for clothes & apparels",
            announcement: "Latest Products on Offer!",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fashionable apparels for everyone",
                            sub_heading: "Level up your style"
                        },
                        {
                            heading: "Join in on the big clothing sale",
                            sub_heading: "Premium items on offer"
                        }
                    ]
                },
                { heading: "The "+storeDetails.name+" brand" },
                {
                    heading: "Explore our collection",
                    sub_heading: "The best products in town"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: storeDetails.name+" sells only the finest of clothing carefully chosen by our team. The clothing is of the finest quality with rigorous quality checks. We aim to sell the best products at the most affordable price"
                },
                {
                    heading: "Browse Products",
                    sub_heading: "Choose from our exclusive set of collections",
                },
                {
                    heading: "Our Promise",
                    sub_heading: "Quality in every detail",
                    image_list: [
                        { heading: "Trusted Brand" },
                        { heading: "Fast Delivery" },
                        { heading: "High-Quality Products" }
                    ]
                }
            ]
        },
        {
            site_title: "Shop & buy the best clothing with offers in "+storeDetails.company_details.city+", "+storeDetails.country+" | "+storeDetails.name,
            announcement: "Limited stock Available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Clothing made for every occasion",
                            sub_heading: "Find the perfect outfit"
                        },
                        {
                            heading: "Selected items on sale",
                            sub_heading: "Get the best clothing offers"
                        }
                    ]
                },
                { heading: "About our brand" },
                {
                    heading: "Categories",
                    sub_heading: "Choose from our handpicked collection"
                },
                {
                    heading: "The "+storeDetails.name+" Advantage",
                    sub_heading: "Finding quality clothing at the right price in "+storeDetails.country+" is a big challenge, we at "+storeDetails.name+" found that it's reasonable and easy to find good clothing in other countries! Our main goal was to bring clothing that you would usually have to ship out from other countries right here in "+storeDetails.country+" with easy access and at comparatively affordable prices!"
                },
                {
                    heading: "Our Collection",
                    sub_heading: "Curated products for the best look",
                },
                {
                    heading: "The best brand for clothing",
                    sub_heading: "How we stand out from the competition",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        },
        {
            site_title: "Online clothing store - Shopping site with offers in "+storeDetails.company_details.city+", "+storeDetails.country+" at "+storeDetails.name,
            announcement: "100% Quality guaranteed!",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Shopping for clothes made easy",
                            sub_heading: "Buy at the right price"
                        },
                        {
                            heading: "The best clothing deals in town",
                            sub_heading: "Browse offer collection"
                        }
                    ]
                },
                { heading: "The "+storeDetails.name+" story" },
                {
                    heading: "Shop from our collection",
                    sub_heading: "Specially curated set of products for you"
                },
                {
                    heading: "The "+storeDetails.name+" Edge",
                    sub_heading: "Our main goal with "+storeDetails.name+" is to deliver the best clothing at an affordable price. We pride ourselves in providing excellent support for our customers in "+storeDetails.country+". Having our operations in "+storeDetails.company_details.city+" has helped us in delivering the best clothing!"
                },
                {
                    heading: "Our Products",
                    sub_heading: "Handpicked collection for the stylish few",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Three reasons to buy from us",
                    image_list: [
                        { heading: "Quality Assured" },
                        { heading: "Delivery Guaranteed" },
                        { heading: "Fast Support" }
                    ]
                }
            ]
        },
        {
            site_title: "Stylish clothes websites in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "The fashion staples",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Discover our must have pieces",
                            sub_heading: "Redefine your style statement"
                        },
                        {
                            heading: "What every closet needs",
                            sub_heading: "All what your wardrobe needs"
                        }
                    ]
                },
                { heading: "About our brand" },
                {
                    heading: "Come, let's explore",
                    sub_heading: "Yes your wardrobe must have these"
                },
                {
                    heading: "The "+storeDetails.name+" Influence",
                    sub_heading: "Fashion speaks louder than words and so does the must have pieces from your closet. Search from "+storeDetails.name+"’s widest range of fashion staples and get your glam quotient on point. Redefining your style statement got much easier with our statement pieces to start with."
                },
                {
                    heading: "Our must have collection",
                    sub_heading: "Pieces which are much needed for your look",
                },
                {
                    heading: "Why choose "+storeDetails.name+"?",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Timely delivery" },
                        { heading: "Uncompromising quality" }
                    ]
                }
            ]
        },
        {
            site_title: "Budget friendly fashion with "+storeDetails.name+" in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Pocket friendly fashion",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Slay in a budget",
                            sub_heading: "Find your perfect fit"
                        },
                        {
                            heading: "Your everyday looks made economical",
                            sub_heading: "Get that right fit at right cost"
                        }
                    ]
                },
                { heading: "The "+storeDetails.name+" story" },
                {
                    heading: "Our prospectus",
                    sub_heading: "We sell what you see"
                },
                {
                    heading: "What makes "+storeDetails.name+" superior",
                    sub_heading: "With "+storeDetails.name+" you don’t have to burn a hole in your pocket to make those heads turn with your perfect outfit. Don’t limit yourself in choosing your look of the day because we have got you covered with our pocket friendly pieces."
                },
                {
                    heading: "Our modest catalogue",
                    sub_heading: "Freshly grown pieces for perfection",
                },
                {
                    heading: "What we deliver?",
                    sub_heading: "Check out",
                    image_list: [
                        { heading: "Timely support" },
                        { heading: "On time delivery" },
                        { heading: "Quality guaranteed" }
                    ]
                }
            ]
        }
    ];

    let jewelleryList = [
        {
            site_title: "Best jewellery options in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Discover our timeless pieces",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Go-to jewellery pieces",
                            sub_heading: "Amp up your look"
                        },
                        {
                            heading: "Evergreen jewellery pieces",
                            sub_heading: "Seal your deal with our offers"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Our collection",
                    sub_heading: "Handpicked from nooks & crannies"
                },
                {
                    heading: "Why you should choose "+storeDetails.name,
                    sub_heading: "“I have enough jewellery”, said no girl ever. "+storeDetails.name+" provides you timeless pieces which can never go out of fashion in the comfort of your home. The evergreen pieces which have reigned for years and still continue their legacy."
                },
                {
                    heading: "Welcome, let's check out",
                    sub_heading: "You get what you see",
                },
                {
                    heading: "Our promises",
                    sub_heading: "Here we go",
                    image_list: [
                        { heading: "Handpicked pieces" },
                        { heading: "Well known brand" },
                        { heading: "Promising delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Affordable jewellery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Perfect for pocket pieces",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Budget friendly jewellery shopping",
                            sub_heading: "Level up your fashion"
                        },
                        {
                            heading: "Economical jewellery styles",
                            sub_heading: "Pay less, buy more"
                        }
                    ]
                },
                { heading: "The "+storeDetails.name+" story" },
                {
                    heading: "Our genre",
                    sub_heading: "Pieces you can't say no to"
                },
                {
                    heading: storeDetails.name+"'s lead",
                    sub_heading: "With changing outfits, jewellery too demands a change. "+storeDetails.name+" is that change. Choose from our wide range of jewellery the perfect fit for your outfit without disrupting your budget. We believe that a wider choice doesn’t always need wider pockets."
                },
                {
                    heading: "Explore more",
                    sub_heading: "Made for you",
                },
                {
                    heading: "Reasons to buy from "+storeDetails.name,
                    sub_heading: "This is why",
                    image_list: [
                        { heading: "Customer support" },
                        { heading: "Healthier environment" },
                        { heading: "Quality assurance" }
                    ]
                }
            ]
        },
        {
            site_title: "Latest jewellery in "+storeDetails.company_details.city+" "+storeDetails.country,
            announcement: "Latest products available ",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Top notch jewellery pieces for you",
                            sub_heading: "Turn your fashion game on point"
                        },
                        {
                            heading: "Best in style looks",
                            sub_heading: "All what your outfit needs"
                        }
                    ]
                },
                { heading: "The "+storeDetails.name+" story" },
                {
                    heading: "Explore our brochure",
                    sub_heading: "The best in class designs"
                },
                {
                    heading: "The "+storeDetails.name+" power",
                    sub_heading: "The "+storeDetails.name+" brings to you the finest quality latest products to give perfection to your look. Complete your outfit with our best quality jewellery pieces and stand a chance to make those heads turn."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Specially curated for you",
                },
                {
                    heading: "What makes us stand out?",
                    sub_heading: "Check out",
                    image_list: [
                        { heading: "Safe & Secure Ordering" },
                        { heading: "100% Quality Guarantee" },
                        { heading: "Skin Friendly" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - Online jewellery seller in "+storeDetails.company_details.city+" "+storeDetails.country,
            announcement: "Sale on selected products",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Skin friendly pieces curated for you",
                            sub_heading: "Best quality products"
                        },
                        {
                            heading: "Jewellery pampering your skin",
                            sub_heading: "Ornaments your skin will love"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Shop all",
                    sub_heading: "Rise above all"
                },
                {
                    heading: "The "+storeDetails.name+" speciality",
                    sub_heading: "The "+storeDetails.name+" understands how important it is to take care of your skin that’s why we choose all the skin friendly pieces for you. We give your skin a touch of perfection with a glow of gold."
                },
                {
                    heading: "Explore our range",
                    sub_heading: "To give you the best look",
                },
                {
                    heading: "Best in jewellery",
                    sub_heading: "How do we make a mark?",
                    image_list: [
                        { heading: "Delivery on time" },
                        { heading: "Best quality" },
                        { heading: "Cruelty free" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - website for jewellery in "+storeDetails.company_details.city+" "+storeDetails.country,
            announcement: "New arrivals awaiting you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Perfect jewels for every occasion",
                            sub_heading: "Anti-tarnish pieces"
                        },
                        {
                            heading: "Long lasting jewels for you",
                            sub_heading: "The shine that you need"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Let's discover",
                    sub_heading: "Uncommon designs for you"
                },
                {
                    heading: storeDetails.name+" trump card",
                    sub_heading: "Running in markets is not your thing with "+storeDetails.name+". Choose from our widest range of anti-tarnish jewellery which can pass on to generations without oxidising. These also can be the perfect options to gift to your loved ones as a token of love."
                },
                {
                    heading: "All categories",
                    sub_heading: "Large selection to choose from",
                },
                {
                    heading: "Best in the market",
                    sub_heading: "What makes us worthy",
                    image_list: [
                        { heading: "Fastest Shipping" },
                        { heading: "Low prices everyday" },
                        { heading: "Safe ordering" }
                    ]
                }
            ]
        }
    ];

    let sareeList = [
        {
            site_title: "Online saree shopping in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "100% Quality guaranteed",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Uncompromising quality saree collection",
                            sub_heading: "Rich and fine textured fabric"
                        },
                        {
                            heading: "Revamp your style quotient",
                            sub_heading: "Give a twist to your look"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "What we have for you",
                    sub_heading: "Best in class"
                },
                {
                    heading: storeDetails.name+" advantage",
                    sub_heading: storeDetails.name+" values your money and want to make every penny worthy with our best and finest quality fabric. We believe that a saree is not just a piece of clothing but an emotion and we value your emotions to the utmost."
                },
                {
                    heading: "Our Collection",
                    sub_heading: "Say yes to the dress",
                },
                {
                    heading: "Why should you choose us",
                    sub_heading: "Let's find out",
                    image_list: [
                        { heading: "Timely delivery" },
                        { heading: "Best offers" },
                        { heading: "Reasonable prices" }
                    ]
                }
            ]
        },
        {
            site_title: "Discounts on saree in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Sarees from all over India",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Sarees designed as per you",
                            sub_heading: "You name it, we have it"
                        },
                        {
                            heading: "Traditional and modern designs on sale",
                            sub_heading: "Discounted pieces made with love"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s ride" },
                {
                    heading: "Our creations",
                    sub_heading: "Uniquely made for you"
                },
                {
                    heading: storeDetails.name+" dominance",
                    sub_heading: "Saree is no longer just a traditional piece of clothing; it too has taken a contemporary turn and still doesn’t fail to fascinate people with its elegance. So the "+storeDetails.name+" brings to you all the types of sarees that you need in your wardrobe."
                },
                {
                    heading: "Product list",
                    sub_heading: "What's your type",
                },
                {
                    heading: "Our commitment",
                    sub_heading: "To make you happy",
                    image_list: [
                        { heading: "Value for money" },
                        { heading: "On time delivery" },
                        { heading: "Satisfactory response" }
                    ]
                }
            ]
        },
        {
            site_title: "Celebrity style saree in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Latest fashion sarees",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Selected sarees from all across India",
                            sub_heading: "Standard and must have sarees"
                        },
                        {
                            heading: "Sarees your wardrobe should have",
                            sub_heading: "The never out of fashion outfit"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Our catalogue",
                    sub_heading: "Designed by perfectionists"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "With "+storeDetails.name+", we curate fashion for you and handpick the finest pieces made by purists from all over India. We believe that India has everything made for a reason and so does these fabrics used in making our enduring sarees as they too have a history. So we ought to make you feel closer to your culture and traditions."
                },
                {
                    heading: "Our articles",
                    sub_heading: "What are you looking for",
                },
                {
                    heading: "We vow",
                    sub_heading: "To serve you better everyday with",
                    image_list: [
                        { heading: "Secure ordering" },
                        { heading: "Lowest prices" },
                        { heading: "Latest fashion" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - website for saree in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best offers on sarees",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Sarees you can't say no to",
                            sub_heading: "Celebrity inspired styles"
                        },
                        {
                            heading: "Famous designs to choose from",
                            sub_heading: "Curated fashion for you"
                        }
                    ]
                },
                { heading: "How did "+storeDetails.name+" start" },
                {
                    heading: "Timeless collection",
                    sub_heading: "Evergreen pieces"
                },
                {
                    heading: storeDetails.name+" primacy",
                    sub_heading: storeDetails.name+" also presents to you all the everlasting sarees that have been rocking for years and still have a legit place in everybody’s heart. These standard sarees can be experimented with in different ways in your everyday looks and that’s what makes them a must have."
                },
                {
                    heading: "Shop all",
                    sub_heading: "What would you want today",
                },
                {
                    heading: "The best of all",
                    sub_heading: "Why us?",
                    image_list: [
                        { heading: "100% quality guaranteed" },
                        { heading: "Finest colors" },
                        { heading: "Latest pieces" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - designer saree collection",
            announcement: "Affordable saree collection",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fashionable sarees in your budget",
                            sub_heading: "Stylish yet pocket friendly"
                        },
                        {
                            heading: "Modest yet modern sarees",
                            sub_heading: "Sarees you would love"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s run" },
                {
                    heading: "Time to explore",
                    sub_heading: "Our token of love"
                },
                {
                    heading: storeDetails.name+" precedence",
                    sub_heading: "Saree is a feeling for every Indian woman and we at "+storeDetails.name+" want to make it accessible to all irrespective of anybody’s pocket. Choose your style, your type and we take care of your budget. 1000+ designs available for you at your doorstep in the comfort of your house."
                },
                {
                    heading: "View all",
                    sub_heading: "Love to see you here",
                },
                {
                    heading: "Known brand for saree",
                    sub_heading: "What makes us different",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Best customer service" },
                        { heading: "Easy ordering" }
                    ]
                }
            ]
        }
    ];

    let perfumeList = [
        {
            site_title: "Perfumes on sale in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Perfumes on discounted prices",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fragrances that will do the talk",
                            sub_heading: "Finest perfumes on great prices"
                        },
                        {
                            heading: "Pay less, buy more",
                            sub_heading: "Your favourite perfumes discounted"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s story" },
                {
                    heading: "Our genre",
                    sub_heading: "Choose what's best for you"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: storeDetails.name+" knows how essential it is to smell your best so we bring to you your favourite fragrances at discounted prices. Get your hands on the top notch fragrances available worldwide at great offers and seal the deal with us."
                },
                {
                    heading: "Our niche",
                    sub_heading: "Which one would you pick today",
                },
                {
                    heading: "Why us?",
                    sub_heading: "3 reasons to choose us",
                    image_list: [
                        { heading: "Widest range" },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        },
        {
            site_title: "Branded perfumes in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Branded perfumes available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "The best of all perfumes",
                            sub_heading: "Now available at your doorstep"
                        },
                        {
                            heading: "Selected items on sale",
                            sub_heading: "Well known fragrances worldwide"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s history" },
                {
                    heading: "Our elite collection",
                    sub_heading: "Get your hands on your favourites"
                },
                {
                    heading: storeDetails.name+" convenience",
                    sub_heading: "Perfume and persona goes hand in hand. Considering this "+storeDetails.name+" brings these elite and luxurious fragrances to your doorstep. You want it; you got it just with a single click in the comfort of your home."
                },
                {
                    heading: "Shop all",
                    sub_heading: "Exclusively chosen for you",
                },
                {
                    heading: "What are we known for",
                    sub_heading: "Our supremacy",
                    image_list: [
                        { heading: "We sell what you see, , " },
                        { heading: "Uncompromising quality" },
                        { heading: "On time delivery" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - best quality perfumes in "+storeDetails.company_details.city,
            announcement: "Best quality perfumes",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fragrances to make your mark",
                            sub_heading: "All kinds of perfumes under one roof"
                        },
                        {
                            heading: "A range for everybody to choose from",
                            sub_heading: "Perfumes that last all day long"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Discover all",
                    sub_heading: "Your perfumes express your personality"
                },
                {
                    heading: storeDetails.name+" preference",
                    sub_heading: "Make those heads turn by your scent with "+storeDetails.name+". Your perfume says more than your outfit. We bring to you the finest fragrances from all over the world for you to set the bar of that perfect smell."
                },
                {
                    heading: "Let's browse",
                    sub_heading: "What would you prefer this time",
                },
                {
                    heading: "Our loyalty",
                    sub_heading: "What we bring to you",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Finest quality" },
                        { heading: "Customer satisfaction" }
                    ]
                }
            ]
        },
        {
            site_title: "Famous perfumes in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Luxury fragrances for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fragrances made for everybody",
                            sub_heading: "Choose your fragrance"
                        },
                        {
                            heading: "Smell great on a budget",
                            sub_heading: "Perfumes from all over world"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s tale" },
                {
                    heading: "Our catalogue",
                    sub_heading: "For a better start to the day"
                },
                {
                    heading: storeDetails.name+" prevalence",
                    sub_heading: storeDetails.name+"’s round the clock fragrances to kick-start your day at a refreshing note and create an aura that nobody will forget throughout the day. Try some of our newly launched scents and keep them guessing about your new smell."
                },
                {
                    heading: "Discover our scents",
                    sub_heading: "What's in store for you",
                },
                {
                    heading: "The best in perfume",
                    sub_heading: "What we have for you",
                    image_list: [
                        { heading: "Lowest prices" },
                        { heading: "Customer service" },
                        { heading: "100% quality guaranteed" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - good quality perfumes at affordable prices",
            announcement: "Fragrances from all over world",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fragrances that are a mood changer",
                            sub_heading: "Select yours now"
                        },
                        {
                            heading: "Feel fresh at a very decent price",
                            sub_heading: "Pocket friendly perfumes available"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Explore all",
                    sub_heading: "Scents make the best memories"
                },
                {
                    heading: storeDetails.name+" advantage",
                    sub_heading: "We believe in spreading good vibes and what better way to do that than to smell good. Bringing a smile of somebody’s face doesn’t have to be expensive, so "+storeDetails.name+" brings to you a range of affordable perfumes to choose from."
                },
                {
                    heading: "The economical store",
                    sub_heading: "How do you want to smell?",
                },
                {
                    heading: "Trusted worldwide",
                    sub_heading: "Because we provide",
                    image_list: [
                        { heading: "Timely delivery" },
                        { heading: "Best offers" },
                        { heading: "Easy ordering" }
                    ]
                }
            ]
        }
    ];

    let homeFurnitureList = [
        {
            site_title: "Best quality furniture in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "World class furniture for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Let your furniture speak for you",
                            sub_heading: "Choose from our wide range"
                        },
                        {
                            heading: "Economical furniture pieces",
                            sub_heading: "For your special space"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Our collection",
                    sub_heading: "Designed for you"
                },
                {
                    heading: storeDetails.name+" dominance",
                    sub_heading: "We at "+storeDetails.name+" believe that every furniture tells a story and we want your house stories to be relished for a lifetime. So we bring the best quality furniture to your home that will surely have a lot to say."
                },
                {
                    heading: "Product list",
                    sub_heading: "Pieces your house would love",
                },
                {
                    heading: "What makes us worthy",
                    sub_heading: "We assure",
                    image_list: [
                        { heading: "Value for money" },
                        { heading: "On time delivery" },
                        { heading: "Satisfactory response" }
                    ]
                }
            ]
        },
        {
            site_title: "Affordable furniture in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Selected pieces of furniture on sale",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Furniture for every house",
                            sub_heading: "To fit in your budget"
                        },
                        {
                            heading: "Don't burn a hole in your pocket",
                            sub_heading: "With our discounted collection"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Discover your favourites",
                    sub_heading: "Curated as per your wishes"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: "Your home is the place you spend your life in, the place you feel the most comfortable in. Don’t you think this place needs all the pampering? So pamper your house with "+storeDetails.name+"’s exclusive range of furniture to show your love to your house."
                },
                {
                    heading: "Our articles",
                    sub_heading: "Wide range to choose from",
                },
                {
                    heading: "We pledge",
                    sub_heading: "To make online shopping easy",
                    image_list: [
                        { heading: "Quality Assured" },
                        { heading: "Delivery Guaranteed" },
                        { heading: "Fast Support" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - home decor ideas",
            announcement: "Redesign your home with us",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Decorating your house got easier",
                            sub_heading: "Give your house a new twist"
                        },
                        {
                            heading: "Revamp your house on a budget",
                            sub_heading: "Discover our timeless pieces"
                        }
                    ]
                },
                { heading: "What's behind "+storeDetails.name },
                {
                    heading: "What are you looking for",
                    sub_heading: "Pieces you can't say no to"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: "Your house reflects your taste and choices, let it speak on your behalf. With "+storeDetails.name+"’s collection choose what explains you the best and is meant for you. Make your house your reflection picking out the pieces you would want in your house and let people admire the kind of person you are."
                },
                {
                    heading: "Discover our collection",
                    sub_heading: "What do you want to see?",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Three reasons to choose us",
                    image_list: [
                        { heading: "Trusted brand" },
                        { heading: "Fast Delivery" },
                        { heading: "High-Quality Products" }
                    ]
                }
            ]
        },
        {
            site_title: "Home decor in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "The household staples",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "All what your house needs",
                            sub_heading: "To give itself a make over"
                        },
                        {
                            heading: "Discounted furniture pieces for you",
                            sub_heading: "Select your favourite!"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Have a look",
                    sub_heading: "The best in class designs"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "Your house has the power to change your mood. So why not decorate it exactly how you would want your mood to be? Revamp your house with "+storeDetails.name+" and give a treat to your mood swings and everybody else’s eyes. As your house is the safest place to display your emotions."
                },
                {
                    heading: "We sell what you see",
                    sub_heading: "We love seeing you here",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Best of both worlds",
                    image_list: [
                        { heading: "Easy Support" },
                        { heading: "Customer Satisfaction" },
                        { heading: "Fast Delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Latest furniture in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Latest furniture available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Trending furniture at your doorstep",
                            sub_heading: "just a click away"
                        },
                        {
                            heading: "Furnishings made for you on sale",
                            sub_heading: "Let's check out"
                        }
                    ]
                },
                { heading: storeDetails.name+" legacy" },
                {
                    heading: "Choose what's yours",
                    sub_heading: "Rise above all"
                },
                {
                    heading: storeDetails.name+" supremacy",
                    sub_heading: storeDetails.name+" understands that building the house of your dreams comes with a lot of pressure and keeping a check on your pocket shouldn’t be one. So we are here to make your dreams come true with our exclusive range of handpicked furniture pieces to start with."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Specially curated for you",
                },
                {
                    heading: "The promises",
                    sub_heading: "We stand by",
                    image_list: [
                        { heading: "Pocket friendly" },
                        { heading: "Hassle free checkout" },
                        { heading: "Safe ordering" }
                    ]
                }
            ]
        }
    ];

    let mobileComputerList = [
        {
            site_title: "Mobiles online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Latest mobiles available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Buy latest mobiles in town",
                            sub_heading: "With just a click"
                        },
                        {
                            heading: "Exciting offers awaiting you",
                            sub_heading: "Browse our collection"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Shop from our collection",
                    sub_heading: "Choose what's best for you"
                },
                {
                    heading: storeDetails.name+" advantage",
                    sub_heading: storeDetails.name+" brings to you the widest range of latest mobile phones to choose from. You get everything you want under one roof. So say no to roaming in the markets and yes to hassle free shopping with "+storeDetails.name+"."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Choose from our exclusive collection",
                },
                {
                    heading: "What makes us worthy",
                    sub_heading: "Let's see",
                    image_list: [
                        { heading: "Widest range" },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        },
        {
            site_title: "Mobiles, computers available in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Offers on mobiles, computers",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Gadgets to uplift your personality",
                            sub_heading: "Have a look"
                        },
                        {
                            heading: "Our bestsellers are now discounted",
                            sub_heading: "You can't miss this sale"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Explore our collection",
                    sub_heading: "Pocket friendly pieces"
                },
                {
                    heading: storeDetails.name+" supremacy",
                    sub_heading: "It’s time to update your electronic devices with "+storeDetails.name+"’s wide range of mobile phones, computers and accessories. Time to say bye to your old gadgets which must have become mundane by now."
                },
                {
                    heading: "Discover all",
                    sub_heading: "Choose from our wide range",
                },
                {
                    heading: "We pledge",
                    sub_heading: "To make you happy",
                    image_list: [
                        { heading: "Handpicked pieces" },
                        { heading: "Well known brand" },
                        { heading: "Promising delivery" }
                    ]
                }
            ]
        },
        {
            site_title: storeDetails.name+" - original mobiles and computers in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "100% original computers and mobiles",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "We guarantee you the originality",
                            sub_heading: "Trust us and shop"
                        },
                        {
                            heading: "Shop from our discounted collection",
                            sub_heading: "To get you the best deal"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Have a look",
                    sub_heading: "Choose your next gadget"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: "Mobile phones have now become an inseparable part of our lives. And "+storeDetails.name+" believes that this part of your life should be the best one so we bring to you the latest mobiles in the market in the comfort of your home."
                },
                {
                    heading: "Browse all",
                    sub_heading: "What do you want to see?",
                },
                {
                    heading: "Our commitment",
                    sub_heading: "To satisfy you",
                    image_list: [
                        { heading: "Pocket friendly" },
                        { heading: "Hassle free checkout" },
                        { heading: "Secure ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Mobile accessories in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Mobile phone accessories available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Mobile, computers & accessories available",
                            sub_heading: "Everything in one place"
                        },
                        {
                            heading: "Choose from our wide collection on sale",
                            sub_heading: "Pay less, buy more"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Buy yours now",
                    sub_heading: "Your next favourite"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: storeDetails.name+" is giving the most loved accessories at discounted prices and lots of offers to choose from. So what are you waiting for? Grab your next gadget before the sale ends. Happy Shopping."
                },
                {
                    heading: "Choose yours",
                    sub_heading: "What would you want today?",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        },
        {
            site_title: "Cheap mobiles, computers online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Limited stock Available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Grab your favourite gadgets now",
                            sub_heading: "From our limited stock"
                        },
                        {
                            heading: "Get your hands on your favourite discounted ones",
                            sub_heading: "Explore from our products"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Grab yours",
                    sub_heading: "The best products in town"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: "Smartphones have made our lives much easier than we could have imagined. So why compromise on such a ‘necessity’ (nowadays) when you can get the best of both worlds at your doorstep without any hustle with "+storeDetails.name+" widest collection."
                },
                {
                    heading: "Shop all",
                    sub_heading: "What's missing in your bag?",
                },
                {
                    heading: "Why choose "+storeDetails.name+"?",
                    sub_heading: "Reasons to choose us",
                    image_list: [
                        { heading: "Delivery on time" },
                        { heading: "Best quality" },
                        { heading: "Cruelty free" }
                    ]
                }
            ]
        }
    ];

    let restaurantCafeList = [
        {
            site_title: "Famous restaurant "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "You demand, we deliver",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Host a party!",
                            sub_heading: "Leave the food part on us"
                        },
                        {
                            heading: "Feed your stomach bugs pocket friiendly",
                            sub_heading: "With our affordable wide menu"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Discover all",
                    sub_heading: "All what your taste buds need"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: storeDetails.name+" aims at satisfying your taste buds with its wide food menu to choose from. We would love to serve you with our best quality food specially made for you. Choose from your favourite dishes and treat yourselves with a great meal."
                },
                {
                    heading: "Browse all",
                    sub_heading: "What do you want to eat?",
                },
                {
                    heading: "Our commitment",
                    sub_heading: "To satisfy you",
                    image_list: [
                        { heading: "Best quality" },
                        { heading: "Timely delivery" },
                        { heading: "Fresh food" }
                    ]
                }
            ]
        },
        {
            site_title: "Best food in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Scrumptious food at your doorstep",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Wide range of cuisines to choose from",
                            sub_heading: "Choose your favourite"
                        },
                        {
                            heading: "Keep your stomach and pocket happy",
                            sub_heading: "For your day to be happier and economical"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "What we have for you",
                    sub_heading: "Curated as per your wishes"
                },
                {
                    heading: storeDetails.name+" precedence",
                    sub_heading: "Be it dine in or take away, your stomach bugs deserve to be treated at the best. "+storeDetails.name+" brings the best ambience for you to sit down and enjoy your meal in the comfort of our restaurant and in the comfort of your house both. Dine in or take away, we promise to serve you with the best."
                },
                {
                    heading: "Discover all",
                    sub_heading: "What are you looking for?",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Let's find out",
                    image_list: [
                        { heading: "Good quality" },
                        { heading: "Best ingredients" },
                        { heading: "Secure ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Tasty food cafe in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Finger licking food for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Tasty food in the comfort of your house",
                            sub_heading: "Pick yours today"
                        },
                        {
                            heading: "Food combo deals to satisfy your taste buds",
                            sub_heading: "From our wide food menu"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Food menu",
                    sub_heading: "Specially made for you"
                },
                {
                    heading: storeDetails.name+" supremacy",
                    sub_heading: "Give a treat to your taste buds with "+storeDetails.name+"’s widest range of cuisines. Choose from your favourites and enjoy a scrumptious meal. And lastly don’t forget to sip on a cup hot cup of your favourite coffee or tea to go with the desserts."
                },
                {
                    heading: "Eat all",
                    sub_heading: "What's your food choices?",
                },
                {
                    heading: "We pledge",
                    sub_heading: "To serve you better everyday",
                    image_list: [
                        { heading: "Fresh food" },
                        { heading: "Good ingredients" },
                        { heading: "Safe and secure ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Best rated restaurant, cafe in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "The best Restaurant in town",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "We have got your taste buds covered",
                            sub_heading: "With our tempting food variety"
                        },
                        {
                            heading: "Pay less, eat more",
                            sub_heading: "With our exciting combos"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s tale" },
                {
                    heading: "Our selection",
                    sub_heading: "Get your hands on your favourites"
                },
                {
                    heading: storeDetails.name+" advantage",
                    sub_heading: "Food is a celebration and we want you to celebrate everyday with us. "+storeDetails.name+" would love to be your food companion with its endless food varieties to make your stomach go happily crazy and your taste buds asking for more."
                },
                {
                    heading: "Explore all",
                    sub_heading: "We love seeing you here",
                },
                {
                    heading: "The best in Restaurant & Cafe",
                    sub_heading: "This is why",
                    image_list: [
                        { heading: "Hygienic" },
                        { heading: "Fastest delivery" },
                        { heading: "Pure veg" }
                    ]
                }
            ]
        },
        {
            site_title: "Afforable best quality restaurant, cafe in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Pocket friendly food options",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "All what your tummy needs",
                            sub_heading: "Delivered to you"
                        },
                        {
                            heading: "Grab our food deals now",
                            sub_heading: "For that extra discount"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Grab yours",
                    sub_heading: "Lip smacking food options"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: storeDetails.name+" understands how happy your stomach needs to be for your day to be happier. So here we are the saviour of your day and your stomach. Give a pocket friendly treat to your stomach bugs with our super saver combos to choose from."
                },
                {
                    heading: "Our menu",
                    sub_heading: "Wide menu to choose from",
                },
                {
                    heading: "Why choose "+storeDetails.name+"?",
                    sub_heading: "Reasons to choose us",
                    image_list: [
                        { heading: "Great offers" },
                        { heading: "Best quality ingredients" },
                        { heading: "On time delivery" }
                    ]
                }
            ]
        }
    ];

    let bakeryCakeShopList = [
        {
            site_title: "Best quality bakery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Handmade with love for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Customised for you with love",
                            sub_heading: "With the best ingredients"
                        },
                        {
                            heading: "Pay less, eat more",
                            sub_heading: "With our budget friendly cakes"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "What are you looking for",
                    sub_heading: "Get your hands on your favourites"
                },
                {
                    heading: "The "+storeDetails.name+" Advantage",
                    sub_heading: "The companionship of scrumptious cake is enough to make any occasion or moment truly a memorable affair. Welcome to the world of lip smacking dry cakes, fondant cakes, cream cakes, designer cakes, and photo cakes only at "+storeDetails.name+"."
                },
                {
                    heading: "Choose yours",
                    sub_heading: "Specially curated for you",
                },
                {
                    heading: "The promises",
                    sub_heading: "We stand by",
                    image_list: [
                        { heading: "Good quality" },
                        { heading: "Best ingredients" },
                        { heading: "Secure ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Famous cake shop in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Celebrate your special day with us",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Celebrate your birthday with us",
                            sub_heading: "Choose from our wide range of cakes"
                        },
                        {
                            heading: "Choose from our deals collection",
                            sub_heading: "Offers on cakes for you"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "What are you celebrating?",
                    sub_heading: "Let us be a part of it"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: "No celebration is complete without cake, so "+storeDetails.name+" brings your favourite cake to your doorstep to give you celebrations a perfect start. Make your occasions special with us; choose from our wide range of cakes and other bakery products."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Made for you",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Reasons to choose us",
                    image_list: [
                        { heading: "Hygienic" },
                        { heading: "Fastest delivery" },
                        { heading: "Best offers" }
                    ]
                }
            ]
        },
        {
            site_title: "Fresh cakes in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Fresh cakes at your doorstep",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Get scrumptious cakes delivered to you",
                            sub_heading: "With just a click away"
                        },
                        {
                            heading: "Celebrate with our offers",
                            sub_heading: "With our tasty cakes"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Happy to see you here",
                    sub_heading: "We were looking for you"
                },
                {
                    heading: storeDetails.name+" supremacy",
                    sub_heading: storeDetails.name+" aims at satisfying your taste buds with its fresh cakes and other bakery items. We would love serving your tummy with our best quality food specially made for you with love."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Wide menu to choose from",
                },
                {
                    heading: "What makes us worthy",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Great offers" },
                        { heading: "Best quality ingredients" },
                        { heading: "On time delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Good quality bakery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best offers on cake",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "We want to be a part of your celebration",
                            sub_heading: "Count on us!"
                        },
                        {
                            heading: "Keep your tummy and pocket happy",
                            sub_heading: "With our discounts"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Glad that you came here",
                    sub_heading: "Would love to serve you"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: "Leave your taste buds asking for more with "+storeDetails.name+" widest range of bakery products. You name it, we get it for you. We are happy to customise your cakes as per your wants and requirements because we want to make you smile."
                },
                {
                    heading: "Our menu",
                    sub_heading: "What do you want to eat?",
                },
                {
                    heading: "Known brand for Bakery & Cake shop",
                    sub_heading: "This is why",
                    image_list: [
                        { heading: "Best quality" },
                        { heading: "Timely delivery" },
                        { heading: "Fresh food" }
                    ]
                }
            ]
        },
        {
            site_title: "Cakes online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "The best bakery in town",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Give a treat to your taste buds",
                            sub_heading: "With our tempting bakery options"
                        },
                        {
                            heading: "Grab our yummy deals now",
                            sub_heading: "With that extra discount"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Love seeing you",
                    sub_heading: "What will you like today?"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: storeDetails.name+" believes that life is all about these happy moments where you live a little more. So we bring to you these delicious cake options in all the flavours in the world  to gift as birthday gifts to your loved ones and be a part of their happy moments to make them all the more special for them."
                },
                {
                    heading: "Our Collection",
                    sub_heading: "What would you prefer this time",
                },
                {
                    heading: "Our commitment",
                    sub_heading: "To make you happy",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        }
    ];

    let footwearList = [
        {
            site_title: "Latest footwear in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Latest products available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "A range for everybody to choose from",
                            sub_heading: "Get your hands on your favourites"
                        },
                        {
                            heading: "Pay less, buy more",
                            sub_heading: "Grab our discounted products now"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Grab yours",
                    sub_heading: "Get your hands on your favourites"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: storeDetails.name+" brings to you a wide range of handpicked footwear and accessories to complete your outfit and complement it in the best way possible. Choose yours now and keep slaying."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Wide range to choose from",
                },
                {
                    heading: "What makes us worthy",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Pocket friendly" },
                        { heading: "Hassle free checkout" },
                        { heading: "Secure ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Best quality footwear in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best quality footwears",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "All what your outfit needs",
                            sub_heading: "To uplift your look"
                        },
                        {
                            heading: "Pocket friendly pieces",
                            sub_heading: "Curated for you"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Discover all",
                    sub_heading: "Choose your pick of the day"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: storeDetails.name+" values your money and want to make every penny worthy with the best quality footwear and accessories. Get the show going with our wide, pocket friendly range which will not only suit your budget but also your look of the day."
                },
                {
                    heading: "Explore all",
                    sub_heading: "You get what you see",
                },
                {
                    heading: "The promises",
                    sub_heading: "We stand by",
                    image_list: [
                        { heading: "Widest range" },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        },
        {
            site_title: "Accessories for women online in "+storeDetails.company_details.city+", country",
            announcement: "Best offers on footwears and accessories",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Discover our must have pieces",
                            sub_heading: "To revamp your style quotient "
                        },
                        {
                            heading: "Budget friendly fashion",
                            sub_heading: "Handpicked for you"
                        }
                    ]
                },
                { heading: storeDetails.name+" legacy" },
                {
                    heading: "What are you looking for",
                    sub_heading: "Your next favourite"
                },
                {
                    heading: storeDetails.name+" supremacy",
                    sub_heading: "Redefine your style statement with "+storeDetails.name+"’s widest range of footwear and accessories to get your outfit on point and your style quotient growing and glowing. Stop scrolling, start exploring with us."
                },
                {
                    heading: "Our Collection",
                    sub_heading: "Choose from our exclusive collection",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Let's see",
                    image_list: [
                        { heading: "Trusted Brand" },
                        { heading: "Fast Delivery" },
                        { heading: "High-Quality Products" }
                    ]
                }
            ]
        },
        {
            site_title: "Accessories for men in "+storeDetails.company_details.city+", country",
            announcement: "Discover our timeless pieces",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Handpicked specially for you",
                            sub_heading: "Delivered at your doorstep"
                        },
                        {
                            heading: "Affordable footwears and accessories",
                            sub_heading: "To revamp your outfit"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Choose what's yours",
                    sub_heading: "Pocket friendly pieces"
                },
                {
                    heading: storeDetails.name+" precedence",
                    sub_heading: "Who said comfort doesn’t come with style? We "+storeDetails.name+" presents to you the amalgamation of style with comfort in our wide range of footwear and accessories to get your glam game on point. Choose your style from our exclusive collection curated specially for you."
                },
                {
                    heading: "Our catalogue",
                    sub_heading: "We love seeing you here",
                },
                {
                    heading: "Trusted worldwide",
                    sub_heading: "Because we provide",
                    image_list: [
                        { heading: "Handpicked pieces" },
                        { heading: "Well known brand" },
                        { heading: "Promising delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Affordable footwear online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Sale on selected products",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Timeless pieces to go with",
                            sub_heading: "At the best prices"
                        },
                        {
                            heading: "Our bestsellers are now discounted",
                            sub_heading: "You can't miss this sale"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Take a look",
                    sub_heading: "The best in class designs"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: "We understand the power of a perfect outfit so we bring to you a wide range of handpicked footwear and accessories to uplift your outfit game and enhance your look of the day. Choose yours now and let the party going."
                },
                {
                    heading: "Discover all",
                    sub_heading: "Curated products for the best look",
                },
                {
                    heading: "Our loyalty",
                    sub_heading: "What we bring to you",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        }
    ];

    let beautyCosmeticsList = [
        {
            site_title: "Cosmetics online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Pocket friendly beauty products",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Cosmetics your skin will love",
                            sub_heading: "Handpicked specially for you"
                        },
                        {
                            heading: "Offers that you will love",
                            sub_heading: "And you can't miss"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Discover all",
                    sub_heading: "The best products in town"
                },
                {
                    heading: storeDetails.name+" dominance",
                    sub_heading: "Revamp your style by experimenting with your looks with "+storeDetails.name+"’s widest range of makeup products for all skin types at pocket friendly prices to make those head turns. So what are you waiting for? Grab our hot deals now."
                },
                {
                    heading: "Take a look",
                    sub_heading: "To give you the best look",
                },
                {
                    heading: "Trusted worldwide",
                    sub_heading: "Because we provide",
                    image_list: [
                        { heading: "Value for money" },
                        { heading: "On time delivery" },
                        { heading: "Satisfactory response" }
                    ]
                }
            ]
        },
        {
            site_title: "Branded cosmetics online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best offers for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Beauty products made as per your skin",
                            sub_heading: "Get your glam game on"
                        },
                        {
                            heading: "The best deals for you",
                            sub_heading: "Grab yours now"
                        }
                    ]
                },
                { heading: storeDetails.name+" legacy" },
                {
                    heading: "Grab yours",
                    sub_heading: "Get your hands on your favourites"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: "Wonder how these makeup artists do wonders and bring your best side out? With "+storeDetails.name+" become your own makeup artist and get your hands on the best and finest cosmetics and skin care products without burning a hole in your pocket."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Specially curated for you",
                },
                {
                    heading: "Our commitment",
                    sub_heading: "To satisfy you",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Vegan" },
                        { heading: "Cruelty free" }
                    ]
                }
            ]
        },
        {
            site_title: "Websites for make up in "+storeDetails.company_details.city,
            announcement: "Handmade with love for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Shine as bright as your highlighter",
                            sub_heading: "With our beauty products"
                        },
                        {
                            heading: "Choose from our discounted collection",
                            sub_heading: "At the best prices"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Love seeing you",
                    sub_heading: "Pocket friendly make up"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "We understand the power of good glowing skin and make up as a cherry on top. So here we are presenting you the best quality make up and skin care products. Explore "+storeDetails.name+"’s widest range and get your glam game going."
                },
                {
                    heading: "Discover all",
                    sub_heading: "What do you want to see?",
                },
                {
                    heading: "Our loyalty",
                    sub_heading: "What we bring to you",
                    image_list: [
                        { heading: "Delivery on time" },
                        { heading: "Best quality" },
                        { heading: "Cruelty free" }
                    ]
                }
            ]
        },
        {
            site_title: "Affordable cosmetics in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Sale on selected products",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Showcase your best side",
                            sub_heading: "With our widest range of cosmetics"
                        },
                        {
                            heading: "Slay in a budget",
                            sub_heading: "Bring it on"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Glad that you came here",
                    sub_heading: "Specially made for you"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: storeDetails.name+" presents the hidden gems you have been looking for all this while for your dearest skin. Give your skin the pampering that it needs with our wide range of makeup and beauty products."
                },
                {
                    heading: "Our Collection",
                    sub_heading: "Curated products for the best look",
                },
                {
                    heading: "We pledge",
                    sub_heading: "To make you happy",
                    image_list: [
                        { heading: "Easy support" },
                        { heading: "Customer Satisfaction" },
                        { heading: "Fast delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Original make up online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best quality cosmetics",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Make those head turns",
                            sub_heading: "With your glow"
                        },
                        {
                            heading: "Our bestsellers are now discounted",
                            sub_heading: "You can't miss this sale"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Take a look",
                    sub_heading: "Curated as per your wishes"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: storeDetails.name+" believes that make up can make your day or break it. So we bring to you the finest and best quality cosmetics and other beauty products from every nooks and crannies to make you look your best."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Love to see you here",
                },
                {
                    heading: "The promises",
                    sub_heading: "We stand by",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        }
    ];

    let healthWellnessList = [
        {
            site_title: "Medicines available online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Medicines delivered at your doorstep",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Get the therapy you require",
                            sub_heading: "At your doorstep"
                        },
                        {
                            heading: "Pocket friendly products",
                            sub_heading: "To help you grow and heal"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Browse all",
                    sub_heading: "Everything under one roof"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: "Now you don’t have to wait in long queues outside pharmacies because "+storeDetails.name+" is a one-stop destination for all the healthcare products. You name it; we get it delivered to you. So now your health doesn’t have to wait for its nutrition with our superfast delivery services."
                },
                {
                    heading: "Our catalogue",
                    sub_heading: "We look after your well being",
                },
                {
                    heading: "Our loyalty",
                    sub_heading: "What we bring to you",
                    image_list: [
                        { heading: "Trusted Brand" },
                        { heading: "Fast Delivery" },
                        { heading: "High-Quality Products" }
                    ]
                }
            ]
        },
        {
            site_title: "Original medicines in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "100% original medicines delivered",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Original health and wellness products",
                            sub_heading: "Delivered to you"
                        },
                        {
                            heading: "Our bestsellers are now discounted",
                            sub_heading: "Grab what you need now"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Get well soon",
                    sub_heading: "Specially curated set of products for you"
                },
                {
                    heading: storeDetails.name+" dominance",
                    sub_heading: storeDetails.name+" strongly believes in the famous saying ‘Take care of your body, that’s the place you live in’. So we bring to you a wide variety of health and wellness products at affordable rates in the comfort of your house with hassle free ordering. It’s time to stay strong and healthy with us."
                },
                {
                    heading: "Our Collection",
                    sub_heading: "Specially curated for you",
                },
                {
                    heading: "Trusted worldwide",
                    sub_heading: "Because we provide",
                    image_list: [
                        { heading: "Widest range" },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        },
        {
            site_title: "Pharmacy online in "+storeDetails.company_details.city,
            announcement: "Offers on health and wellness products",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Don't miss any dose",
                            sub_heading: "Get your products at home"
                        },
                        {
                            heading: "You can't miss these offers",
                            sub_heading: "On selected health and wellness products"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Glad that you came here",
                    sub_heading: "The best products in town"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: storeDetails.name+" wishes to make healthcare accessible to everyone by giving them quality care at pocket friendly prices. Explore our widest range of health and wellness products and get your inner self growing, outer self glowing with the products needed by your body."
                },
                {
                    heading: "Choose yours",
                    sub_heading: "We would love to see you healthy",
                },
                {
                    heading: "The promises",
                    sub_heading: "We stand by",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        },
        {
            site_title: "Website for medicines in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Medicines delivered superfast",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Get your life glowing",
                            sub_heading: "Order your products online"
                        },
                        {
                            heading: "Choose from our sale collection",
                            sub_heading: "At the best prices"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Explore all",
                    sub_heading: "All what your body needs"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: storeDetails.name+" has highly trained and experienced pharmacists, doctors and phlebotomists to give you a satisfactory experience. Well being isn’t just a dream with us. With just one click, you can get the products required for your wellness delivered at your house."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Large selection to choose from",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Reasons to choose us",
                    image_list: [
                        { heading: "Delivery on time" },
                        { heading: "Best quality" },
                        { heading: "Cruelty free" }
                    ]
                }
            ]
        },
        {
            site_title: "Medicines online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Original medicines delivered at home",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Every health and wellness products you need",
                            sub_heading: "Delivered to your doorstep"
                        },
                        {
                            heading: "The best deals are waiting for you",
                            sub_heading: "Choose yours now"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Discover all",
                    sub_heading: "Choose what's best for you"
                },
                {
                    heading: storeDetails.name+" supremacy",
                    sub_heading: storeDetails.name+" brings to you all the life-saving drugs as well as the wellness products of the finest quality in the comfort of your house. We assure that your health is in the safest hands. Go ahead and treat your body with the nutrition that it needs for a healthy life."
                },
                {
                    heading: "Explore all",
                    sub_heading: "You get what you see",
                },
                {
                    heading: "Our commitment",
                    sub_heading: "To make you happy",
                    image_list: [
                        { heading: "Easy Support" },
                        { heading: "Customer Satisfaction" },
                        { heading: "Fast Delivery" }
                    ]
                }
            ]
        }
    ];

    let artCraftPhotographyList = [
        {
            site_title: "Paintings for sale in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Handmade artistry available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Celebrate everyday with our art",
                            sub_heading: "That will leave everyone spellbound"
                        },
                        {
                            heading: "Don't miss our ongoing sale",
                            sub_heading: "Get the best deals now"
                        }
                    ]
                },
                { heading: storeDetails.name+" legacy" },
                {
                    heading: "We this for you",
                    sub_heading: "Choose from our handpicked collection"
                },
                {
                    heading: storeDetails.name+" advantage",
                    sub_heading: storeDetails.name+" feels that Art is a feeling and an emotion in itself. So we handpick the best artistry for you and your house because emotions keep us surviving. Discover our timeless art pieces and give heart a reason to smile daily."
                },
                {
                    heading: "Discover all",
                    sub_heading: "Your choice of art describes you",
                },
                {
                    heading: "Our loyalty",
                    sub_heading: "What we bring to you",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Best customer service" },
                        { heading: "Easy ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Art online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best art pieces for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Putting heart and soul in every piece",
                            sub_heading: "To make it a masterpiece for you"
                        },
                        {
                            heading: "Don't burn a hole in your pocket ",
                            sub_heading: "Get our masterpieces at a discounted price"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s tale" },
                {
                    heading: "Take a look",
                    sub_heading: "Uncommon designs for you"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: storeDetails.name+" is a platform where we respect art and artworks from each and every artisan from all the parts of the world and bring it to you. We know the power of art in modifying and moulding an individual. Come and explore our world of art."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Lovely seeing you here",
                },
                {
                    heading: "We aim",
                    sub_heading: "At your satisfaction",
                    image_list: [
                        { heading: "Widest range" },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        },
        {
            site_title: "Artistry in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Finest quality masterpieces",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Revamp your house with us",
                            sub_heading: "And fall in love with it yet again"
                        },
                        {
                            heading: "Our bestsellers are now discounted",
                            sub_heading: "Grab what you need now"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Discover all",
                    sub_heading: "Get your hands on your favourites"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: storeDetails.name+" brings to the finest art from the best artisans from every nooks and crannies. We curate all the masterpieces to please your eyes and your pocket. So come and explore our authentic yet affordable collection."
                },
                {
                    heading: "Our collection",
                    sub_heading: "Let the art speak for itself",
                },
                {
                    heading: "Best in art",
                    sub_heading: "Know why",
                    image_list: [
                        { heading: "Delivery on time" },
                        { heading: "Best quality" },
                        { heading: "Cruelty free" }
                    ]
                }
            ]
        },
        {
            site_title: "Art and craft in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Sale on selected products",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Give your house the much needed makeover",
                            sub_heading: "With our artistry"
                        },
                        {
                            heading: "Pocket friendly art",
                            sub_heading: "Waiting for you"
                        }
                    ]
                },
                { heading: storeDetails.name+"'s history" },
                {
                    heading: "Explore all",
                    sub_heading: "Curated as per your wishes"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "Who thought that buying art works can be this easy. With "+storeDetails.name+" you can browse and buy artworks in a few defined steps. The world of art is waiting to be explored and rediscovered."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Handpicked for your happiness",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Three reasons to buy from us",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        },
        {
            site_title: "Photography in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Handmade with love for you",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Art that will make your eyes shine",
                            sub_heading: "And your heart smile"
                        },
                        {
                            heading: "We have the best deals for you",
                            sub_heading: "We are sure you won't miss them"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Choose what's yours",
                    sub_heading: "Rise above all"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: "Art has been an integral part of our lives since generations and will continue to be. Various kinds of art forms have existed and still exist in this world, each of which has a unique story and technique involved with it. "+storeDetails.name+" initiates to bring artworks to your doorstep with its handpicked masterpieces for you."
                },
                {
                    heading: "Have a look",
                    sub_heading: "You get what you see",
                },
                {
                    heading: "We want to serve you",
                    sub_heading: "With the best",
                    image_list: [
                        { heading: "Easy Support" },
                        { heading: "Customer Satisfaction" },
                        { heading: "Fast Delivery" }
                    ]
                }
            ]
        }
    ];

    let groceryList = [
        {
            site_title: "Groceries online in "+storeDetails.company_details.city,
            announcement: "100% original groceries",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "100% quality groceries available",
                            sub_heading: "At your doorstep"
                        },
                        {
                            heading: "Great offers waiting for you",
                            sub_heading: "Grab yours now"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Discover all",
                    sub_heading: "Love serving you"
                },
                {
                    heading: storeDetails.name+" precedence",
                    sub_heading: "Buying groceries has never been this easy. Just with a few clicks get your groceries delivered at your doorstep with the trust of "+storeDetails.name+" and widest variety to choose from. You get all what you need under one roof, isn’t that so convenient?"
                },
                {
                    heading: "Our collection",
                    sub_heading: "Choose from our exclusive collection",
                },
                {
                    heading: "We owe you",
                    sub_heading: "All our loyalty",
                    image_list: [
                        { heading: "Widest range, , " },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        },
        {
            site_title: "Fresh and best quality groceries in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best offers on groceries",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Best quality groceries delivered at your doorstep",
                            sub_heading: "With a few clicks"
                        },
                        {
                            heading: "Grocery at the lowest cost",
                            sub_heading: "With uncompromising quality"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Browse all",
                    sub_heading: "Love seeing you here"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "From local to exotic brands, from household to personal products, from every nooks and crannies; "+storeDetails.name+" bring to you the finest and widest range of products to choose from in the comfort of your house."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Wide range to choose from",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Best customer service" },
                        { heading: "Easy ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Best price grocery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Hot deals on groceries",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Don't roam, just use your phone to order groceries",
                            sub_heading: "Delivered at your doorstep"
                        },
                        {
                            heading: "Our discounted products await you",
                            sub_heading: "Take them home now"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Explore all",
                    sub_heading: "Everything under one roof"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: storeDetails.name+" is changing the way the nation has been shopping groceries since ages. Shopping groceries was never this easy; no drives to the market, no long queues, just your phone and you can get all what you need for your house delivered to you in no time."
                },
                {
                    heading: "Take a look",
                    sub_heading: "We would love to see you healthy",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Three reasons to buy from us",
                    image_list: [
                        { heading: "Pocket friendly" },
                        { heading: "Hassle free checkout" },
                        { heading: "Secure ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Fruits and vegetables delivery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Groceries at your doorstep",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Convenience delivered, order your groceries",
                            sub_heading: "With our best quality fruits and vegetables"
                        },
                        {
                            heading: "Hot deals your way",
                            sub_heading: "Get your favourites now"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Buy yours",
                    sub_heading: "The best products in town"
                },
                {
                    heading: storeDetails.name+" supermacy",
                    sub_heading: "With "+storeDetails.name+" you can now buy your groceries and order your household products online without travelling long distances or standing in never ending queues. With our wide selection to choose from and fast delivery you have all the time left to do other important chores."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Specially curated for you",
                },
                {
                    heading: "We want to",
                    sub_heading: "Make you happy",
                    image_list: [
                        { heading: "Easy Support" },
                        { heading: "Customer Satisfaction" },
                        { heading: "Fast Delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Grocery delivery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best quality grocery available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Order groceries at home real quick",
                            sub_heading: "Start exploring and order now"
                        },
                        {
                            heading: "You can't miss these offers",
                            sub_heading: "Your grocery is waiting"
                        }
                    ]
                },
                { heading: "What's behind "+storeDetails.name },
                {
                    heading: "Choose yours",
                    sub_heading: "Specially curated set of products for you"
                },
                {
                    heading: "The "+storeDetails.name+" Influence",
                    sub_heading: storeDetails.name+" brings to you the widest selection of groceries to choose from with an uncompromising quality and great offers to please your budget. With a just a few clicks, you can get anything that you want delivered to your doorstep with the trust of numerous well known brands."
                },
                {
                    heading: "Buy all",
                    sub_heading: "All what you need",
                },
                {
                    heading: "We pledge",
                    sub_heading: "To serve you the best",
                    image_list: [
                        { heading: "Lowest prices" },
                        { heading: "Customer service" },
                        { heading: "100% quality guaranteed" }
                    ]
                }
            ]
        }
    ];

    let fruitsVegetablesList = [
        {
            site_title: "Fruits and vegetables online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Organic fruits and vegetables available",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "100% organic fruits and vegetables available",
                            sub_heading: "Buy your favourites now"
                        },
                        {
                            heading: "Great offers waiting for you",
                            sub_heading: "Grab yours now"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Discover all",
                    sub_heading: "What's cooking today?"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "From local to exotic, "+storeDetails.name+" brings to you the best quality fruits and vegetables at unbeatable prices. Stay healthy, stay home and order your favourite fruits and veggies online for your next meal."
                },
                {
                    heading: "Our catalogue",
                    sub_heading: "Wide range to choose from",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Three reasons to buy from us",
                    image_list: [
                        { heading: "Handpicked" },
                        { heading: "Best customer service" },
                        { heading: "Easy ordering" }
                    ]
                }
            ]
        },
        {
            site_title: "Fresh fruits in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Fresh fruits and vegetables delivered",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Give a treat to your taste buds",
                            sub_heading: "Fresh fruits and vegetables for you"
                        },
                        {
                            heading: "Hot deals your way",
                            sub_heading: "Get yours now"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Buy yours",
                    sub_heading: "Would love to serve you"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: "Who thought that buying fruits and vegetables can be done this easily? No shouting from the balcony, no walk/drive to the market, just your phone and your choice of fruits and vegetables in the comfort of your house with "+storeDetails.name+"."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Your health is our wealth",
                },
                {
                    heading: "We pledge",
                    sub_heading: "To serve you better everyday",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        },
        {
            site_title: "Fruits and vegetables home delivery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Offers on fruits and vegetables",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "A healthy body and a healthy mind",
                            sub_heading: "With our best quality fruits and vegetables"
                        },
                        {
                            heading: "Fruits and vegetables on lowest cost",
                            sub_heading: "With uncompromising quality"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Grab yours",
                    sub_heading: "The best products in town"
                },
                {
                    heading: storeDetails.name+" edge",
                    sub_heading: "Need your veggies real quick to prepare your next meal? Well we have come as a saviour. Order from "+storeDetails.name+"’s widest range of fruits and vegetables and get the finest quality of everything delivered at your doorstep with a few clicks."
                },
                {
                    heading: "Buy all",
                    sub_heading: "Choose from our exclusive collection",
                },
                {
                    heading: "Our loyalty",
                    sub_heading: "What we bring to you",
                    image_list: [
                        { heading: "We sell what you see" },
                        { heading: "Uncompromising quality" },
                        { heading: "On time delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Fresh vegetables online in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Fruits and vegetables at lowest rates",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fruits and vegetables delivered at your doorstep",
                            sub_heading: "With just one click"
                        },
                        {
                            heading: "You can't miss these offers ",
                            sub_heading: "Fresh fruits and vegetables awaiting you"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "We love to see you here",
                    sub_heading: "Choose what's best for you"
                },
                {
                    heading: storeDetails.name+" dominance",
                    sub_heading: "If you are looking for uplifting your snacking game by shifting to nutritious fruits then you can choose from "+storeDetails.name+"’s widest range of local as well as premium exotic fruits and vegetables and get them delivered at your doorstep with just a few clicks."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Handpicked for you",
                },
                {
                    heading: "What makes us stand out",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Organic" },
                        { heading: "100% quality guaranteed" },
                        { heading: "Fast delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Fruits and vegetables delivery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best quality fruits and vegetables",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Best quality fruits and vegetables delivered to you",
                            sub_heading: "At your doorstep"
                        },
                        {
                            heading: "Make space in your fridge because",
                            sub_heading: "We have offers you can't say no to"
                        }
                    ]
                },
                { heading: storeDetails.name+" legacy" },
                {
                    heading: "Happy eating",
                    sub_heading: "All what your taste buds need"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: "Not only fresh dishes, but you can now also get fresh fruits and vegetables get delivered to your house in no time with "+storeDetails.name+" so that you can make your delicious dishes yourself. Choose from our widest range of good quality fruits and veggies and avoid that one extra trip to the market."
                },
                {
                    heading: "Select yours",
                    sub_heading: "Large selection to choose from",
                },
                {
                    heading: "Best in Fruits & Vegetables",
                    sub_heading: "Because we provide",
                    image_list: [
                        { heading: "Widest range" },
                        { heading: "Environment friendly" },
                        { heading: "Happiness delivered" }
                    ]
                }
            ]
        }
    ];

    let chickenFishMeatList = [
        {
            site_title: "Fresh chicken and meat in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Chicken, meat and fish delivered at home",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Get your hands on the finest quality of meat",
                            sub_heading: "In just a few clicks"
                        },
                        {
                            heading: "Offers you can't miss",
                            sub_heading: "Waiting for you"
                        }
                    ]
                },
                { heading: storeDetails.name+" ride" },
                {
                    heading: "Browse all",
                    sub_heading: "Choose your meal of the day"
                },
                {
                    heading: storeDetails.name+" upper hand",
                    sub_heading: "With a just a few clicks, you can get fresh chicken, meat and seafood delivered to your doorstep. Isn’t that so convenient and hassle free? Come and explore "+storeDetails.name+"’s widest range of best quality poultry, mutton and seafood and please your stomach bugs with a delicious meal."
                },
                {
                    heading: "Our menu",
                    sub_heading: "We would love to see you healthy",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Let's know",
                    image_list: [
                        { heading: "Happiness guaranteed" },
                        { heading: "Quality promise" },
                        { heading: "Delivery on time" }
                    ]
                }
            ]
        },
        {
            site_title: "Best quality chicken meat and fish in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Offers on fresh chicken and meat",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "100% quality chicken, meat and fish available",
                            sub_heading: "In the comfort of your house"
                        },
                        {
                            heading: "Meat at lowest cost",
                            sub_heading: "With uncompromising quality"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Grab yours",
                    sub_heading: "All what your tummy needs"
                },
                {
                    heading: "The "+storeDetails.name+" Influence",
                    sub_heading: "Ditch the long queues and trips to the market with "+storeDetails.name+"’s large selection of best quality poultry, mutton and seafood. Get your hands on your favourites sitting at home and give a treat to your taste buds."
                },
                {
                    heading: "Our variety",
                    sub_heading: "We love seeing you here",
                },
                {
                    heading: "What makes us the best",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Antibiotic free" },
                        { heading: "Premium quality" },
                        { heading: "Fast delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Non vegetarian home delivery in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Best quality chicken, meat and fish",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Prepare your today's meal with us",
                            sub_heading: "Wide variety of chicken, meat and fish"
                        },
                        {
                            heading: "Great offers waiting for you",
                            sub_heading: "Grab yours now"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "Buy yours",
                    sub_heading: "Best products in town"
                },
                {
                    heading: "Our Advantage",
                    sub_heading: "Travelling long distances or standing in never ending queues has become old school with "+storeDetails.name+"’s home delivery of fresh chicken, meat and fish. We have a wide selection to choose from and we offer a timely delivery so that you can focus on other chores and rely on us to feed your stomach bugs."
                },
                {
                    heading: "Our selection",
                    sub_heading: "Widest selection to choose from",
                },
                {
                    heading: "We want to satisy you",
                    sub_heading: "So we provide",
                    image_list: [
                        { heading: "Easy Support" },
                        { heading: "Customer Satisfaction" },
                        { heading: "Fast Delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Chicken and meat delivery at home in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Chicken, meat, fish at lowest rates",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Best quality chicken, meat and fish for you",
                            sub_heading: "Choose what you want"
                        },
                        {
                            heading: "Our discounted products are here",
                            sub_heading: "Make way in your fridge"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Discover all",
                    sub_heading: "Would love to serve you"
                },
                {
                    heading: storeDetails.name+" precedence",
                    sub_heading: storeDetails.name+" is the best place for non-vegetarians as they get a large selection of products with the premium produce which is antibiotic free in the comfort of their house. So why go anywhere else when you can get your next meal delivered at your house raw and cooked both."
                },
                {
                    heading: "Our catalogue",
                    sub_heading: "Best quality specially for you",
                },
                {
                    heading: "We love to see you happy",
                    sub_heading: "So we bring to you",
                    image_list: [
                        { heading: "Organic" },
                        { heading: "100% quality guaranteed" },
                        { heading: "Fast delivery" }
                    ]
                }
            ]
        },
        {
            site_title: "Online chicken, meat and fish in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Wide variety of fish meat and chicken",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fresh chicken, meat and fish delivered ",
                            sub_heading: "At your doorstep"
                        },
                        {
                            heading: "Hot deals your way",
                            sub_heading: "Get yours now"
                        }
                    ]
                },
                { heading: "What's behind "+storeDetails.name },
                {
                    heading: "Choose yours",
                    sub_heading: "Specially curated set of products for you"
                },
                {
                    heading: storeDetails.name+" leverage",
                    sub_heading: storeDetails.name+" brings to you the widest selection of chicken, fish and meat varieties to choose from best offers to please your pocket. No rushing to the markets, order what you want to cook today and get it delivered to you in no time."
                },
                {
                    heading: "Browse all",
                    sub_heading: "Handpicked for you",
                },
                {
                    heading: "Why buy from "+storeDetails.name,
                    sub_heading: "Reasons to buy from us",
                    image_list: [
                        { heading: "Antibiotic free" },
                        { heading: "Best quality" },
                        { heading: "Safe and secure ordering" }
                    ]
                }
            ]
        }
    ];

    let localServicesList = [
        {
            site_title: "Household services at home in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Get services at home",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Pamper yourself with our on demand services ",
                            sub_heading: "In the comfort of your house"
                        },
                        {
                            heading: "Offers you don't want to miss",
                            sub_heading: "Pick yours today"
                        }
                    ]
                },
                { heading: "How "+storeDetails.name+" started" },
                {
                    heading: "All services",
                    sub_heading: "All what you need for you house"
                },
                {
                    heading: storeDetails.name+" prevalence",
                    sub_heading: storeDetails.name+" understands how precious your time is. So omit the hustle and bustle of looking for the right person for your household services and rely on us for that. Book trained professionals for your home services at affordable prices."
                },
                {
                    heading: "Discover all",
                    sub_heading: "Satisfactory services for you",
                },
                {
                    heading: "Why us?",
                    sub_heading: "Reasons to choose us",
                    image_list: [
                        { heading: "Hygienic" },
                        { heading: "Safe" },
                        { heading: "Best technicians" }
                    ]
                }
            ]
        },
        {
            site_title: "Beauty services at home in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Offers on local services",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Explore our wide range of services available",
                            sub_heading: "For your house and yourself"
                        },
                        {
                            heading: "Get your household services",
                            sub_heading: "At a disocunted price"
                        }
                    ]
                },
                { heading: storeDetails.name+" journey" },
                {
                    heading: "Our services",
                    sub_heading: "Best services in town"
                },
                {
                    heading: storeDetails.name+" dominance",
                    sub_heading: "Fulfil your household needs with "+storeDetails.name+". Come and explore our household and beauty services and pamper yourself and your house. Book trained professionals for your home services at affordable prices and get the best in class services for your house and its appliances."
                },
                {
                    heading: "Our selection",
                    sub_heading: "Best services for you",
                },
                {
                    heading: "Our aim",
                    sub_heading: "To provide best services",
                    image_list: [
                        { heading: "Single product use" },
                        { heading: "Best quality products" },
                        { heading: "Timely delivered services" }
                    ]
                }
            ]
        },
        {
            site_title: "House cleaning in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Affordable household services",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Get the best service guranteed",
                            sub_heading: "At the best prices"
                        },
                        {
                            heading: "Great deals on your way",
                            sub_heading: "Book yours now"
                        }
                    ]
                },
                { heading: "What's behind "+storeDetails.name },
                {
                    heading: "Explore all",
                    sub_heading: "This is what your home demands"
                },
                {
                    heading: storeDetails.name+" preference",
                    sub_heading: "With over 1000+ qualified professionals and best in class services, "+storeDetails.name+" has made it to many hearts and is still trying to put the best foot forward to make a mark. Come and explore our household and beauty services and pamper yourself and your house."
                },
                {
                    heading: "Our services",
                    sub_heading: "Large selection to choose from",
                },
                {
                    heading: "We believe",
                    sub_heading: "In providing you the best",
                    image_list: [
                        { heading: "Trusted by many" },
                        { heading: "On time services" },
                        { heading: "Premium products" }
                    ]
                }
            ]
        },
        {
            site_title: "Services at home in "+storeDetails.company_details.city+", "+storeDetails.country,
            announcement: "Special discounts on our services",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Give a makeover to your house",
                            sub_heading: "With our household services"
                        },
                        {
                            heading: "Pocket friendly deals for you",
                            sub_heading: "Add these to your cart"
                        }
                    ]
                },
                { heading: "About the brand" },
                {
                    heading: "Browse all",
                    sub_heading: "Everyday household services"
                },
                {
                    heading: storeDetails.name+" convenience",
                    sub_heading: "House appliances not working and you need them repaired real quick? "+storeDetails.name+" is here as your saviour. From house cleaning, to personal grooming you name it and we have the service ready for you."
                },
                {
                    heading: "Our catalogue",
                    sub_heading: "Best technicians for you",
                },
                {
                    heading: "What makes us stand out",
                    sub_heading: "Find out",
                    image_list: [
                        { heading: "Low contact services" },
                        { heading: "Best professionals" },
                        { heading: "Hygienic" }
                    ]
                }
            ]
        },
        {
            site_title: "App for local services at home",
            announcement: "Book now and get a discount",
            layout_list: [
                {
                    image_list: [
                        {
                            heading: "Fix anything in your house",
                            sub_heading: "Book us and leave the rest on us"
                        },
                        {
                            heading: "Pay less, avail more",
                            sub_heading: "With our ongoing sale"
                        }
                    ]
                },
                { heading: storeDetails.name+" story" },
                {
                    heading: "Discover all",
                    sub_heading: "Love to serve you"
                },
                {
                    heading: storeDetails.name+" precedence",
                    sub_heading: "Who thought getting the household services done can be this easy? "+storeDetails.name+" brings all the household and beauty services to you at your doorstep. Just with a few clicks, you can almost all the essential house services done without any hassle."
                },
                {
                    heading: "Explore all",
                    sub_heading: "Love seeing you here",
                },
                {
                    heading: "The best in local services",
                    sub_heading: "Because we provide",
                    image_list: [
                        { heading: "Best brands" },
                        { heading: "Premium experience" },
                        { heading: "Top professionals" }
                    ]
                }
            ]
        }
    ];

    let storeCategories = [
        { name: "clothing", groups: clothingList },
        { name: "jewellery", groups: jewelleryList },
        { name: "saree", groups: sareeList },
        { name: "perfume", groups: perfumeList },
        { name: "home_furniture", groups: homeFurnitureList },
        { name: "mobile_computer", groups: mobileComputerList },
        { name: "restaurant_cafe", groups: restaurantCafeList },
        { name: "bakery_cake_shop", groups: bakeryCakeShopList },
        { name: "footwear", groups: footwearList },
        { name: "beauty_cosmetics", groups: beautyCosmeticsList },
        { name: "health_wellness", groups: healthWellnessList },
        { name: "art_craft_photography", groups: artCraftPhotographyList },
        { name: "grocery", groups: groceryList },
        { name: "fruits_vegetables", groups: fruitsVegetablesList },
        { name: "chicken_fish_meat", groups: chickenFishMeatList },
        { name: "local_services", groups: localServicesList }
    ];
    let categoryData = null;
    let catIndex = storeCategories.findIndex(obj => obj.name==category);
    if(catIndex!=-1 && storeCategories[catIndex].groups[contentIndex]) {
        categoryData = storeCategories[catIndex].groups[contentIndex];
        // primary slider 1
        categoryData.layout_list[0].image_list[0].desktop_coordinates = templateSets[templateIndex].desktop_coordinates;
        categoryData.layout_list[0].image_list[0].mobile_coordinates = templateSets[templateIndex].mobile_coordinates;
        categoryData.layout_list[0].image_list[0].position = templateSets[templateIndex].primary_txt_position;
        // primary slider 2
        categoryData.layout_list[0].image_list[1].desktop_coordinates = templateSets[templateIndex].desktop_coordinates;
        categoryData.layout_list[0].image_list[1].mobile_coordinates = templateSets[templateIndex].mobile_coordinates;
        categoryData.layout_list[0].image_list[1].position = templateSets[templateIndex].primary_txt_position;
        // brand highlighted section
        categoryData.layout_list[1].sub_heading = storeDetails.seo_details.meta_desc;
        // advantage highlighted section
        categoryData.layout_list[3].coordinates = templateSets[templateIndex].advantage_coordinates;
    }
    return categoryData;
}