const request = require('request');
const mongoose = require('mongoose');
const vendor = require('../src/models/vendor.model');

exports.create = function(jsonData, callback) {

    let courierPartners = jsonData.courier_partners.filter(obj => obj.status=='active');
    let vendorDetails = jsonData.vendor_details;
    let dpIndex = courierPartners.findIndex(obj => obj.name=='Delhivery');
    if(dpIndex!=-1) {
        let dpConfig = courierPartners[dpIndex];
        dpConfig.base_url = "https://staging-express.delhivery.com";
        if(dpConfig.mode=='live') { dpConfig.base_url = "https://track.delhivery.com"; }
        let formData = {
            phone: vendorDetails.mobile,
            city: vendorDetails.pickup_address.city,
            name: vendorDetails.page_url,
            pin: vendorDetails.pickup_address.pincode,
            address: vendorDetails.pickup_address.address,
            country: vendorDetails.pickup_address.country,
            email: vendorDetails.email,
            registered_name: vendorDetails.contact_person,
            return_address: vendorDetails.pickup_address.address,
            return_pin: vendorDetails.pickup_address.pincode,
            return_city: vendorDetails.pickup_address.city,
            return_state: vendorDetails.pickup_address.state,
            return_country: vendorDetails.pickup_address.country
        };
        // create warehouse
        let options = {
            url: dpConfig.base_url+'/api/backend/clientwarehouse/create/',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Token '+dpConfig.token },
            body: formData, json: true
        };
        let pIndex = vendorDetails.pickup_locations.findIndex(el => el.name=='Delhivery');
        if(pIndex!=-1) {
            // edit
            formData.name = vendorDetails.pickup_locations[pIndex].location_id;
            options.url = dpConfig.base_url+'/api/backend/clientwarehouse/edit/';
        }
        request(options, function(err, response, body) {
            if(!err) {
                if(response.statusCode == 200 || response.statusCode == 201) {
                    if(pIndex==-1) {
                        vendorDetails.pickup_locations.push({ name: 'Delhivery', location_id: vendorDetails.page_url });
                        vendor.findOneAndUpdate({ _id: mongoose.Types.ObjectId(vendorDetails._id) },
                        { $set: { pickup_locations: vendorDetails.pickup_locations } }, function() {
                            callback(false, true);
                        });
                    }
                    else { callback(false, true); }
                }
                else { callback(true, body); }
            }
            else { callback(true, body); }
        });
    }
    else { callback(false, true); }

}