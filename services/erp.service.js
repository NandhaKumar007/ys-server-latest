const request = require('request');
const mongoose = require('mongoose');
const store = require("../src/models/store.model");

exports.ambar = function(jsonData) {
    return new Promise((resolve, reject) => {
        let erpConfig = jsonData.erp_config;
        if(jsonData.event_type=='add_product') {
            let productDetails = jsonData.product_details;
            let erpData = {
                key: erpConfig.key,
                secret: erpConfig.secret,
                data: { barcode: productDetails.sku }
            };
            const options = {
                url: erpConfig.base_url+"/"+erpConfig.add_product_api,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': jsonData.user_agent },
                body: erpData,
                json: true
            };
            request(options, function(err, response, body) {
                if(!err && response.statusCode == 200) {
                    if(!body.code) { resolve({ status: true }); }
                    else { resolve({ status: false, message: "ERP failure", response: body }); }
                }
                else { resolve({ status: false, message: "ERP error", error: err, status_code: response.statusCode }); }
            });
        }
        else if(jsonData.event_type=='place_order') {
            let orderDetails = jsonData.order_details;
            let billingAddr = orderDetails.billing_address;
            if(!billingAddr) { billingAddr = orderDetails.shipping_address; }
            if(!billingAddr.state || billingAddr.country!='India') { billingAddr.state = 'Other Territory'; }
            let itemList = [];
            orderDetails.item_list.forEach(elem => {
                let itemIndex = itemList.findIndex(obj => obj.barcode==elem.sku);
                if(itemIndex!=-1) { itemList[itemIndex].qty += elem.quantity }
                else { itemList.push({ barcode: elem.sku, qty: elem.quantity }) }
            });
            let erpData = {
                key: erpConfig.key,
                secret: erpConfig.secret,
                data: {
                    customer: {
                      name: billingAddr.name,
                      phone: billingAddr.dial_code+billingAddr.mobile,
                      email: orderDetails.customer_email,
                      address: billingAddr.address,
                      state: billingAddr.state
                    },
                    items: itemList
                }
            };
            const options = {
                url: erpConfig.base_url+"/"+erpConfig.purchase_api,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': jsonData.user_agent },
                body: erpData,
                json: true
            };
            request(options, function(err, response, body) {
                if(!err && response.statusCode == 200) {
                    if(!body.code) { resolve({ status: true }); }
                    else { resolve({ status: false, message: "ERP failure", response: body }); }
                }
                else { resolve({ status: false, message: "ERP error", error: err, status_code: response.statusCode }); }
            });
        }
        else { resolve({ status: false, message: "Invalid ERP type" }); }
    });
}