"use strict";
const mongoose = require('mongoose');
const store = require("../../models/store.model");
const customer = require("../../models/customer.model");
const ysSubscribers = require("../../models/ys_subscribers.model");

exports.subscribers = (req, res) => {
    ysSubscribers.find({}, function(err, response) {
        if(!err && response) {
            res.json({ status: true, list: response });
        }
        else {
            res.json({ status: false, error: err, message: "No data found" });
        }
    });
}

exports.import_customers = (req, res) => {
    let storeDetails = JSON.parse(req.body.data);
    store.findOne({ _id: mongoose.Types.ObjectId(storeDetails.store_id), status: "active" }, function(err, response) {
        if(!err && response)
        {
            if(req.files) {
                let fileName = "uploads/customer-list-"+storeDetails.store_id;
                customersUpload(storeDetails.store_id, req.files.customerListFile, fileName).then((customerListResp) => {
                    // customer.insertMany(customerListResp, function(err, response) {
                    //     res.json({ status: true, data: err });
                    // });
                    res.json({ status: true, data: "hold upload" });
                });
            }
            else {
                res.json({ status: false, message: "Invalid file" });
            }
        }
        else {
            res.json({ status: false, error: err, message: "Invalid Store" });
        }
    });
}

function customersUpload(storeId, file, name) {
    return new Promise((resolve, reject) => {
        if(file) {
            let filename = name+path.extname(file.name);
            file.mv(filename, function(err) {
                if(!err) {
                    xlsxtojson({ input: filename, output: null, lowerCaseHeaders: true }, function(err, list) {
                        let customerList = [];
                        for(let i=0; i<list.length; i++)
                        {
                            if(list[i].name!='' && list[i].email!='')
                            {
                                let sendData = { store_id: storeId, name: list[i].name, email: list[i].email.trim().toLowerCase() };
                                // mobile no
                                if(list[i].mobile_no) { sendData.mobile = list[i].mobile_no; }
                                // created on
                                sendData.created_on = new Date();
                                if(list[i].created_on) { sendData.created_on = new Date(list[i].created_on); }
                                // address
                                if(list[i].billing_address=="TRUE") {
                                    if(!list[i].state) { list[i].state = "NA" };
                                    if(!list[i].pincode) { list[i].pincode = "NA" };
                                    sendData.address_list = [{
                                        type: 'home',
                                        billing_address: true,
                                        name: list[i].address_name,
                                        dial_code: list[i].dial_code,
                                        mobile: list[i].address_mobile,
                                        address: list[i].address,
                                        city: list[i].city,
                                        state: list[i].state,
                                        country: list[i].country,
                                        pincode: list[i].pincode,
                                    }];
                                }
                                customerList.push(sendData);
                            }
                        }
                        fs.unlinkSync(filename);
                        resolve(customerList);
                    });
                }
                else {
                    reject("International zone csv upload error");
                }
            });
        }
        else {
            resolve([]);
        }
    });
}