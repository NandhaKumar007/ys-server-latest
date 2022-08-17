const config = {
    mail_base: 'https://yourstore.io/store-mail/',
    api_base: 'https://dev.whitemastery.com/yourstoreapi/',
    image_base: 'https://dev.whitemastery.com/yourstoreapi/uploads/',
    store_login_base: "https://dev.whitemastery.com/yourstore/admin",
    sub_domain_base: "https://dev.whitemastery.com/yourstore/",
    admin_secret: "24ULh]t@zw9!byQH",
    mail_config: {
        transporter: {
            host: "lin.ezveb.com",
            port: 25,
            secureConnection: false,
            auth: {
                user: "test02@yourstore.io",
                pass: "qwerty123"
            }
        }
    },
    ys_mail_config: {
        transporter: {
            host: "lin.ezveb.com",
            port: 25,
            secureConnection: false,
            auth: {
                user: "test02@yourstore.io",
                pass: "qwerty123"
            }
        },
        send_from: "Yourstore <test02@yourstore.io>",
        genie_sales_mail: "test02@yourstore.io",
        notify_mail: "test02@yourstore.io",
        pre_sales_mail: "test02@yourstore.io",
        support_mail: "test02@yourstore.io",
        sales_mail: "test02@yourstore.io"
    },
    company_details: {
        country: "India",
        state: "Tamil Nadu",
        gst_no: "GSTIN33AAFCN2369B1ZT",
        sgst: 9, cgst: 9, igst: 18
    },
    free_plan: "5f4cd131573e9a1e680239f1",
    base_plans: {
        order_based: "5f4cd235573e9a1e680239fd",
        quot_based: "626a6616bb6d8c0afb0f4fc6",
        service_based: "626a6ee0bb6d8c0afb0fdb92",
        multi_vendor: "626ab91fbb6d8c0afb162396"
    },
    update_order_custom: ["5d0ca4c89f21de0314f98f24", "5fbcac07fd6ce3538c2cf355"],
    gcm_id: "AAAAM7IgH1Y:APA91bGFsu9ivk6jw20-Q1OvdyTobvKlNUxMCAYtXagzweqz74tc4DIJXBWmHzOPid-IvXvsqR3RtOmmkDwrERmIVQEWGQyZB8N31pIoY2eaQWFYSqy9fiusDrUcaVL8xCrwMxDcHrRr"
};

module.exports = config;