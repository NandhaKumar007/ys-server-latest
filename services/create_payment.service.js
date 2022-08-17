const mongoose = require('mongoose');
const paypal = require('@paypal/checkout-server-sdk');
const Razorpay = require('razorpay');
const request = require('request');
const admin = require("../src/models/admin.model");
const store = require("../src/models/store.model");
const orderList = require("../src/models/order_list.model");
const couponCodes = require("../src/models/coupon_codes.model");
const donationList = require("../src/models/donation_list.model");
const dpWalletMgmt = require("../src/models/dp_wallet_mgmt.model");
const dinamicRewards = require("../src/models/dinamic_rewards.model");
const ysOrders = require("../src/models/ys_orders.model");
const commonService = require("./common.service");
const setupConfig = require("../config/setup.config");
const vendorWalletMgmt = require("../src/models/vendor_wallet_mgmt.model");

/** RAZORPAY **/
exports.createRazorpay = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let orderAmount = (commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = orderDetails.currency_type.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        orderList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: "product",
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createRazorpayForVendor = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let defaultCurrencyType = response.currency_types.filter(object => object.default_currency)[0];
                let orderAmount = orderDetails.order_price*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = defaultCurrencyType.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        vendorWalletMgmt.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: orderDetails.order_type,
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount,
                                    // payment_config: paymentMethod[0].app_config
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createRazorpayForGC = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let orderAmount = (commonService.priceConvert(orderDetails.currency_type, orderDetails.price))*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = orderDetails.currency_type.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        couponCodes.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: "giftcard",
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createRazorpayForDonation = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let orderAmount = (orderDetails.price)*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = orderDetails.currency_type.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        donationList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: "donation",
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createRazorpayForDinamicOffer = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let orderAmount = (orderDetails.purchase_amount)*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = orderDetails.currency_type.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        dinamicRewards.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: "dinamic_offer",
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createRazorpayForYsOrder = function(orderDetails, callback) {
    admin.findOne({}, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let orderAmount = ((orderDetails.amount).toFixed(2))*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = orderDetails.currency_type.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        ysOrders.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: orderDetails.order_type,
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount,
                                    payment_config: paymentMethod[0].app_config
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createRazorpayForDpWallet = function(orderDetails, callback) {
    admin.findOne({}, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Razorpay');
            if(paymentMethod.length)
            {
                let orderAmount = ((orderDetails.order_price).toFixed(2))*1;
                let razorOrderAmt = parseInt(orderAmount*100);
                let currencyType = orderDetails.currency_type.country_code;
                let instance = new Razorpay(paymentMethod[0].config);
                let options = {
                    amount: razorOrderAmt,
                    currency: currencyType,
                    receipt: orderDetails.order_number,
                    payment_capture: '1'
                };
                instance.orders.create(options, function(err, orderData) {
                    if(!err && orderData) {
                        dpWalletMgmt.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": orderData.id } }, function(err, response) {
                            if(!err && response) {
                                let sendData = {
                                    order_type: "dp_wallet",
                                    payment_method: 'Razorpay',
                                    razorpay_response: orderData,
                                    order_id: orderDetails._id,
                                    order_number: orderDetails.order_number,
                                    currency: currencyType,
                                    amount: orderAmount,
                                    payment_config: paymentMethod[0].app_config
                                };
                                callback(null, sendData);
                            }
                            else { callback(err, "payment_id update error"); }
                        });
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}
/** ### RAZORPAY ### **/

/** PAYPAL **/
exports.createPaypal = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='PayPal');
            if(paymentMethod.length)
            {
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price));
                let currencyType = orderDetails.currency_type.country_code;
                let payload = { 
                    order_type: "product_paypal_payment", order_id: orderDetails._id,
                    currency_type: currencyType, order_amount: orderAmount
                };
                createPayPalOrder(paymentMethod[0], payload).then((response) => {
                    if(response.result) {
                        let paypalLinks = response.result.links;
                        let index = paypalLinks.findIndex(obj => obj.rel === 'approve');
                        if(index!=-1) {
                            let sendData = {
                                order_type: "product",
                                payment_method: 'PayPal',
                                payment_url: paypalLinks[index].href,
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: currencyType,
                                amount: orderAmount
                            };
                            callback(null, sendData);
                        }
                        else { callback(true, 'PayPal error'); }
                    }
                    else { callback(true, response); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createPaypalForGC =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='PayPal');
            if(paymentMethod.length)
            {
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                let currencyType = orderDetails.currency_type.country_code;
                let payload = { 
                    order_type: "giftcard_paypal_payment", order_id: orderDetails._id,
                    currency_type: currencyType, order_amount: orderAmount
                };
                createPayPalOrder(paymentMethod[0], payload).then((response) => {
                    if(response.result) {
                        let paypalLinks = response.result.links;
                        let index = paypalLinks.findIndex(obj => obj.rel === 'approve');
                        if(index!=-1) {
                            let sendData = {
                                order_type: "giftcard",
                                payment_method: 'PayPal',
                                payment_url: paypalLinks[index].href,
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: currencyType,
                                amount: orderAmount
                            };
                            callback(null, sendData);
                        }
                        else { callback(true, 'PayPal error'); }
                    }
                    else { callback(true, response); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createPaypalForDonation =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='PayPal');
            if(paymentMethod.length)
            {
                let orderAmount = Number(orderDetails.price);
                let currencyType = orderDetails.currency_type.country_code;
                let payload = { 
                    order_type: "donation_paypal_payment", order_id: orderDetails._id,
                    currency_type: currencyType, order_amount: orderAmount
                };
                createPayPalOrder(paymentMethod[0], payload).then((response) => {
                    if(response.result) {
                        let paypalLinks = response.result.links;
                        let index = paypalLinks.findIndex(obj => obj.rel === 'approve');
                        if(index!=-1) {
                            let sendData = {
                                order_type: "donation",
                                payment_method: 'PayPal',
                                payment_url: paypalLinks[index].href,
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: currencyType,
                                amount: orderAmount
                            };
                            callback(null, sendData);
                        }
                        else { callback(true, 'PayPal error'); }
                    }
                    else { callback(true, response); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

async function createPayPalOrder(paypalConfig, orderDetails) {
    let clientId = paypalConfig.config.client_id;
    let clientSecret = paypalConfig.config.client_secret;
    let environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    if(paypalConfig.mode=='sandbox') { environment = new paypal.core.SandboxEnvironment(clientId, clientSecret); }
    let client = new paypal.core.PayPalHttpClient(environment);
    let request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        "intent": "CAPTURE",
        "application_context": {
            "return_url": setupConfig.api_base+"store_details/"+orderDetails.order_type+"/success/"+orderDetails.order_id,
            "cancel_url": setupConfig.api_base+"store_details/"+orderDetails.order_type+"/failure/"+orderDetails.order_id
        },
        "purchase_units": [{
            "amount": { "currency_code": orderDetails.currency_type, "value": orderDetails.order_amount }
        }]
    });
    let response = await client.execute(request);
    return response;
}
/** ### PAYPAL ### **/

/** FATOORAH **/
exports.createFatoorah =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Fatoorah');
            if(paymentMethod.length)
            {
                let executeUrl = "https://api.myfatoorah.com/v2/ExecutePayment";
                if(paymentMethod[0].mode=='sandbox') { executeUrl = "https://apitest.myfatoorah.com/v2/ExecutePayment"; }
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price));
                let additionalData = JSON.stringify({ order_type: 'product', order_id: orderDetails._id });
                if(!orderDetails.billing_address) {
                    orderDetails.billing_address = { name: "", dial_code: "", mobile: "" };
                }
                let jsonData = {
                    PaymentMethodId: orderDetails.fatoorah_pay_id,
                    CustomerName: orderDetails.billing_address.name,
                    DisplayCurrencyIso: orderDetails.currency_type.country_code,
                    MobileCountryCode: orderDetails.billing_address.dial_code,
                    CustomerMobile: orderDetails.billing_address.mobile,
                    CustomerEmail: orderDetails.customer_email,
                    InvoiceValue: orderAmount,
                    CallBackUrl: setupConfig.api_base+'store_details/fatoorah_payment/'+orderDetails.store_id,
                    ErrorUrl: setupConfig.api_base+'store_details/fatoorah_payment/'+orderDetails.store_id,
                    Language: 'EN',
                    UserDefinedField: additionalData
                };
                let options = {
                    method: 'POST', url: executeUrl,
                    headers: { Accept: 'application/json', Authorization: 'Bearer '+paymentMethod[0].config.token, 'Content-Type': 'application/json' },
                    body: jsonData, json: true
                };
                request(options, function (err, response, body) 
                {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.IsSuccess) {
                            orderList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": respData.Data.InvoiceId } }, function(err, response) {
                                if(!err && response) { callback(null, respData.Data); }
                                else { callback(err, "payment_id update error"); }
                            });
                        }
                        else { callback(respData, "Payment execution error"); }
                    }
                    else { callback(err, "Payment execution error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createFatoorahForGC =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Fatoorah');
            if(paymentMethod.length)
            {
                let executeUrl = "https://api.myfatoorah.com/v2/ExecutePayment";
                if(paymentMethod[0].mode=='sandbox') { executeUrl = "https://apitest.myfatoorah.com/v2/ExecutePayment"; }
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                let additionalData = JSON.stringify({ order_type: 'giftcard', order_id: orderDetails._id });
                if(!orderDetails.billing_address) {
                    orderDetails.billing_address = { name: "", dial_code: "", mobile: "" };
                }
                let jsonData = {
                    PaymentMethodId: orderDetails.fatoorah_pay_id,
                    CustomerName: orderDetails.billing_address.name,
                    DisplayCurrencyIso: orderDetails.currency_type.country_code,
                    MobileCountryCode: orderDetails.billing_address.dial_code,
                    CustomerMobile: orderDetails.billing_address.mobile,
                    CustomerEmail: orderDetails.customer_email,
                    InvoiceValue: orderAmount,
                    CallBackUrl: setupConfig.api_base+'store_details/fatoorah_payment/'+orderDetails.store_id,
                    ErrorUrl: setupConfig.api_base+'store_details/fatoorah_payment/'+orderDetails.store_id,
                    Language: 'EN',
                    UserDefinedField: additionalData
                };
                let options = {
                    method: 'POST', url: executeUrl,
                    headers: { Accept: 'application/json', Authorization: 'Bearer '+paymentMethod[0].config.token, 'Content-Type': 'application/json' },
                    body: jsonData, json: true
                };
                request(options, function (err, response, body) 
                {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.IsSuccess) {
                            couponCodes.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": respData.Data.InvoiceId } }, function(err, response) {
                                if(!err && response) { callback(null, respData.Data); }
                                else { callback(err, "payment_id update error"); }
                            });
                        }
                        else { callback(respData, "Payment execution error"); }
                    }
                    else { callback(err, "Payment execution error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createFatoorahForDonation =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Fatoorah');
            if(paymentMethod.length)
            {
                let executeUrl = "https://api.myfatoorah.com/v2/ExecutePayment";
                if(paymentMethod[0].mode=='sandbox') { executeUrl = "https://apitest.myfatoorah.com/v2/ExecutePayment"; }
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                let additionalData = JSON.stringify({ order_type: 'donation', order_id: orderDetails._id });
                let jsonData = {
                    PaymentMethodId: orderDetails.fatoorah_pay_id,
                    CustomerName: orderDetails.customer_name,
                    DisplayCurrencyIso: orderDetails.currency_type.country_code,
                    CustomerEmail: orderDetails.customer_email,
                    InvoiceValue: orderAmount,
                    CallBackUrl: setupConfig.api_base+'store_details/fatoorah_payment/'+orderDetails.store_id,
                    ErrorUrl: setupConfig.api_base+'store_details/fatoorah_payment/'+orderDetails.store_id,
                    Language: 'EN',
                    UserDefinedField: additionalData
                };
                let options = {
                    method: 'POST', url: executeUrl,
                    headers: { Accept: 'application/json', Authorization: 'Bearer '+paymentMethod[0].config.token, 'Content-Type': 'application/json' },
                    body: jsonData, json: true
                };
                request(options, function (err, response, body) 
                {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.IsSuccess) {
                            donationList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": respData.Data.InvoiceId } }, function(err, response) {
                                if(!err && response) { callback(null, respData.Data); }
                                else { callback(err, "payment_id update error"); }
                            });
                        }
                        else { callback(respData, "Payment execution error"); }
                    }
                    else { callback(err, "Payment execution error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}
/** ### FATOORAH ### **/

/** TELR **/
exports.createTelr =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Telr');
            if(paymentMethod.length)
            {
                let payMode = 0;
                if(paymentMethod[0].mode=='sandbox') { payMode = 1; }
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price));
                if(!orderDetails.billing_address) {
                    orderDetails.billing_address = { name: "", address: "", country: "" };
                }
                let payFormData = {
                    ivp_method: 'create',
                    ivp_store: paymentMethod[0].config.ivp_store,
                    ivp_authkey: paymentMethod[0].config.key,
                    ivp_amount: orderAmount,
                    ivp_currency: orderDetails.currency_type.country_code,
                    ivp_test: payMode,
                    ivp_cart: String(orderDetails._id),
                    ivp_desc: 'product',
                    return_auth: setupConfig.api_base+'store_details/telr_payment/product/'+orderDetails._id,
                    return_decl: setupConfig.api_base+'store_details/telr_payment/product/'+orderDetails._id,
                    return_can: storeDetails.base_url,
                    bill_fname: orderDetails.billing_address.name,
                    bill_addr1: orderDetails.billing_address.address,
                    bill_country: orderDetails.billing_address.country,
                    bill_email: orderDetails.customer_email
                };
                if(orderDetails.billing_address.landmark) { payFormData.bill_addr2 = orderDetails.billing_address.landmark; }
                if(orderDetails.billing_address.city) { payFormData.bill_city = orderDetails.billing_address.city; }
                if(orderDetails.billing_address.state) { payFormData.bill_region = orderDetails.billing_address.state; }
                if(orderDetails.billing_address.pincode) { payFormData.bill_zip = orderDetails.billing_address.pincode; }
                let options = {
                    method: 'POST', url: 'https://secure.telr.com/gateway/order.json',
                    headers: {}, formData: payFormData, json: true
                };
                request(options, function(err, response) {
                    let respData = response.body;
                    if(!err && respData) {
                        if(!respData.error) {
                            if(respData.order) {
                                orderList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": respData.order.ref } }, function(err, response) {
                                    if(!err && response) { callback(null, respData.order); }
                                    else { callback(err, "payment_id update error"); }
                                });
                            }
                            else { callback(respData, "Payment creation error"); }
                        }                      
                        else { callback(respData, respData.error.message); }
                    }
                    else { callback(err, "Payment creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createTelrForGC =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Telr');
            if(paymentMethod.length)
            {
                let payMode = 0;
                if(paymentMethod[0].mode=='sandbox') { payMode = 1; }
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                if(!orderDetails.billing_address) {
                    orderDetails.billing_address = { name: "", address: "", country: "" };
                }
                let payFormData = {
                    ivp_method: 'create',
                    ivp_store: paymentMethod[0].config.ivp_store,
                    ivp_authkey: paymentMethod[0].config.key,
                    ivp_amount: orderAmount,
                    ivp_currency: orderDetails.currency_type.country_code,
                    ivp_test: payMode,
                    ivp_cart: String(orderDetails._id),
                    ivp_desc: 'giftcard',
                    return_auth: setupConfig.api_base+'store_details/telr_payment/giftcard/'+orderDetails._id,
                    return_decl: setupConfig.api_base+'store_details/telr_payment/giftcard/'+orderDetails._id,
                    return_can: storeDetails.base_url,
                    bill_fname: orderDetails.billing_address.name,
                    bill_addr1: orderDetails.billing_address.address,
                    bill_country: orderDetails.billing_address.country,
                    bill_email: orderDetails.customer_email
                };
                if(orderDetails.billing_address.landmark) { payFormData.bill_addr2 = orderDetails.billing_address.landmark; }
                if(orderDetails.billing_address.city) { payFormData.bill_city = orderDetails.billing_address.city; }
                if(orderDetails.billing_address.state) { payFormData.bill_region = orderDetails.billing_address.state; }
                if(orderDetails.billing_address.pincode) { payFormData.bill_zip = orderDetails.billing_address.pincode; }
                let options = {
                    method: 'POST', url: 'https://secure.telr.com/gateway/order.json',
                    headers: {}, formData: payFormData, json: true
                };
                request(options, function(err, response) {
                    let respData = response.body;
                    if(!err && respData) {
                        if(!respData.error) {
                            if(respData.order) {
                                couponCodes.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": respData.order.ref } }, function(err, response) {
                                    if(!err && response) { callback(null, respData.order); }
                                    else { callback(err, "payment_id update error"); }
                                });
                            }
                            else { callback(respData, "Payment creation error"); }
                        }                      
                        else { callback(respData, respData.error.message); }
                    }
                    else { callback(err, "Payment creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createTelrForDonation =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Telr');
            if(paymentMethod.length)
            {
                let payMode = 0;
                if(paymentMethod[0].mode=='sandbox') { payMode = 1; }
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                let payFormData = {
                    ivp_method: 'create',
                    ivp_store: paymentMethod[0].config.ivp_store,
                    ivp_authkey: paymentMethod[0].config.key,
                    ivp_amount: orderAmount,
                    ivp_currency: orderDetails.currency_type.country_code,
                    ivp_test: payMode,
                    ivp_cart: String(orderDetails._id),
                    ivp_desc: 'donation',
                    return_auth: setupConfig.api_base+'store_details/telr_payment/donation/'+orderDetails._id,
                    return_decl: setupConfig.api_base+'store_details/telr_payment/donation/'+orderDetails._id,
                    return_can: storeDetails.base_url,
                    bill_fname: orderDetails.customer_name,
                    bill_email: orderDetails.customer_email
                };
                let options = {
                    method: 'POST', url: 'https://secure.telr.com/gateway/order.json',
                    headers: {}, formData: payFormData, json: true
                };
                request(options, function(err, response) {
                    let respData = response.body;
                    if(!err && respData) {
                        if(!respData.error) {
                            if(respData.order) {
                                donationList.findByIdAndUpdate(orderDetails._id, { $set: { "payment_details.order_id": respData.order.ref } }, function(err, response) {
                                    if(!err && response) { callback(null, respData.order); }
                                    else { callback(err, "payment_id update error"); }
                                });
                            }
                            else { callback(respData, "Payment creation error"); }
                        }                      
                        else { callback(respData, respData.error.message); }
                    }
                    else { callback(err, "Payment creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}
/** ### TELR ### **/

/** FOLOOSI **/
exports.createFoloosi =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Foloosi');
            if(paymentMethod.length)
            {
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price));
                if(!orderDetails.billing_address) {
                    orderDetails.billing_address = { name: "", mobile: "", address: "" };
                }
                let jsonData = {
                    transaction_amount: orderAmount,
                    currency: orderDetails.currency_type.country_code,
                    customer_name: orderDetails.billing_address.name,
                    customer_email: orderDetails.customer_email,
                    customer_mobile: orderDetails.billing_address.mobile,
                    customer_address: orderDetails.billing_address.address,
                    optional1: "product",
                    optional2: String(orderDetails._id)
                };
                let options = {
                    method: 'POST', url: "https://foloosi.com/api/v1/api/initialize-setup",
                    headers: { Accept: 'application/json', merchant_key: paymentMethod[0].config.merchant_key, 'Content-Type': 'application/json' },
                    body: jsonData, json: true
                };
                request(options, function (err, response, body) {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.data) { callback(null, respData.data); }
                        else { callback(true, respData.message); }
                    }
                    else { callback(err, "Payment creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createFoloosiForGC =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Foloosi');
            if(paymentMethod.length)
            {
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                if(!orderDetails.billing_address) {
                    orderDetails.billing_address = { name: "", mobile: "", address: "" };
                }
                let jsonData = {
                    transaction_amount: orderAmount,
                    currency: orderDetails.currency_type.country_code,
                    customer_name: orderDetails.billing_address.name,
                    customer_email: orderDetails.customer_email,
                    customer_mobile: orderDetails.billing_address.mobile,
                    customer_address: orderDetails.billing_address.address,
                    optional1: "giftcard",
                    optional2: String(orderDetails._id)
                };
                let options = {
                    method: 'POST', url: "https://foloosi.com/api/v1/api/initialize-setup",
                    headers: { Accept: 'application/json', merchant_key: paymentMethod[0].config.merchant_key, 'Content-Type': 'application/json' },
                    body: jsonData, json: true
                };
                request(options, function (err, response, body) {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.data) { callback(null, respData.data); }
                        else { callback(true, respData.message); }
                    }
                    else { callback(err, "Payment creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}

exports.createFoloosiForDonation =async function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, async function(err, response) {
        if(!err && response) {
            let paymentMethod = response.payment_types.filter(object => object.name=='Foloosi');
            if(paymentMethod.length)
            {
                let orderAmount = Number(commonService.priceConvert(orderDetails.currency_type, orderDetails.price));
                let jsonData = {
                    transaction_amount: orderAmount,
                    currency: orderDetails.currency_type.country_code,
                    customer_name: orderDetails.customer_name,
                    customer_email: orderDetails.customer_email,
                    optional1: "donation",
                    optional2: String(orderDetails._id)
                };
                let options = {
                    method: 'POST', url: "https://foloosi.com/api/v1/api/initialize-setup",
                    headers: { Accept: 'application/json', merchant_key: paymentMethod[0].config.merchant_key, 'Content-Type': 'application/json' },
                    body: jsonData, json: true
                };
                request(options, function (err, response, body) {
                    let respData = response.body;
                    if(!err && respData) {
                        if(respData.data) { callback(null, respData.data); }
                        else { callback(true, respData.message); }
                    }
                    else { callback(err, "Payment creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}
/** ### FOLOOSI ### **/

/** FLUTTER WAVE **/
exports.createFlutterwave = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let paymentMethod = response.payment_types.filter(object => object.name=='Flutterwave');
            if(paymentMethod.length)
            {
                let orderAmount = (commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))*1;
                let currencyType = orderDetails.currency_type.country_code;
                let jsonData = {
                    amount: orderAmount,
                    currency: currencyType,
                    tx_ref: new Date().valueOf(),
                    redirect_url: setupConfig.api_base+"store_details/fw_payment/"+storeDetails._id,
                    customer: {
                        email: orderDetails.customer_email,
                        name: orderDetails.billing_address.name,
                        phone_number: orderDetails.billing_address.dial_code+' '+orderDetails.billing_address.mobile
                    },
                    meta: {
                        order_type: "product",
                        store_id: storeDetails._id,
                        order_id: orderDetails._id,
                    },
                    customizations: {
                        title: storeDetails.name,
                        logo: setupConfig.image_base+storeDetails._id+"/logo.png?v="+new Date().valueOf()
                    }
                };
                let reqOptions = {
                    method: 'POST', url: "https://api.flutterwave.com/v3/payments",
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+paymentMethod[0].config.token },
                    body: jsonData, json: true
                };
                request(reqOptions, function (err, response, body)
                {
                    if(!err && response.statusCode == 200) {
                        if(body && body.status=='success') {
                            let sendData = {
                                order_type: "product",
                                payment_method: 'Flutterwave',
                                payment_url: body.data.link,
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: currencyType,
                                amount: orderAmount
                            };
                            callback(null, sendData);
                        }
                        else { callback(body, "Order create response error"); }
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}
/** ### FLUTTER WAVE ### **/

/** BILL BOX **/
exports.createBillbox = function(orderDetails, callback) {
    store.findOne({ _id: mongoose.Types.ObjectId(orderDetails.store_id) }, function(err, response) {
        if(!err && response) {
            let storeDetails = response;
            let paymentMethod = storeDetails.payment_types.filter(object => object.name=='Billbox');
            if(paymentMethod.length)
            {
                let payConfig = paymentMethod[0].config;
                let orderAmount = (commonService.priceConvert(orderDetails.currency_type, orderDetails.final_price))*1;
                let currencyType = orderDetails.currency_type.country_code;
                let jsonData = {
                    requestId: orderDetails._id+'-product',
                    appReference: payConfig.app_ref,
                    secret: payConfig.secret,
                    merchantOrderId: orderDetails._id+'-product',
                    currency: currencyType,
                    invoiceItems: [{
                        name: "#"+orderDetails.order_number,
                        imgUrl: setupConfig.image_base+storeDetails._id+'/logo.png?v='+new Date().valueOf(),
                        unitPrice: orderAmount,
                        quantity: 1,
                        subTotal: orderAmount
                    }]
                };
                let reqUrl = "https://bbposapi.doersops.com/webpos/createInvoice";
                if(paymentMethod[0].mode=="production") {
                    reqUrl = "https://posapi.usebillbox.com/webpos/createInvoice";
                }
                let reqOptions = {
                    method: 'POST', url: reqUrl,
                    headers: { 'Content-Type': 'application/json', 'appId': payConfig.app_id },
                    body: jsonData, json: true
                };
                request(reqOptions, function (err, response, body)
                {
                    if(!err && response.statusCode == 200) {
                        if(body && body.statusCode=='SUCCESS') {
                            let sendData = {
                                order_type: "product",
                                payment_method: 'Billbox',
                                payment_url: body.result.checkoutUrl,
                                order_id: orderDetails._id,
                                order_number: orderDetails.order_number,
                                currency: currencyType,
                                amount: orderAmount
                            };
                            callback(null, sendData);
                        }
                        else { callback(body, "Order create response error"); }
                    }
                    else { callback(err, "Order creation error"); }
                });
            }
            else { callback(true, 'Invalid payment method'); }
        }
        else { callback(err, 'Invalid store'); }
    });
}
/** ### BILL BOX ### **/