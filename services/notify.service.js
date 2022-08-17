const webpush = require('web-push');
const request = require('request');
const setupConfig = require('../config/setup.config');
const imgUploadService = require('../services/img_upload.service');

const vapidKeys = {
    publicKey: 'BK7P3Gui8d5itafHsJ0_amZrnaM8lADhEZcQCRrDZBoBEh_33HBiLHBjS0LUk5UP3Zr2xU2tlFS9Ypnv0xJQHNk',
    privateKey: 'Yp_XKJmhvq-rbZaZ_a0cmHVJxMIqo5IJduAbcnHTVkU'
};
webpush.setVapidDetails('mailto: rianozal@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

// web notification
exports.web = function(subscribers, payloadData) {
    const notificationPayload = {
        notification: {
            title: payloadData.title,
            body: payloadData.body,
            "icon": "assets/icons/icon-144x144.png",
            "badge": "assets/icons/icon-144x144.png"
        }
    };
    Promise.all(subscribers.map(sub => {
        webpush.sendNotification(sub, JSON.stringify(notificationPayload));
    }))
    .then(data => { return true; })
    .catch(err => { console.log(err); return false; });
};

// app notification
exports.app = function(regIds, formData) {
    return new Promise((resolve, reject) => {
        if(regIds.length) {
            let notifyPayload = { title: formData.title, body: formData.body };
            let rootPath = 'uploads/yourstore/notify';
            imgUploadService.singleFileUpload(formData.image, rootPath, false, null).then((img) => {
                if(img) { notifyPayload.image = setupConfig.api_base+img; }
                if(formData.redirect) { notifyPayload.url = formData.redirect; }
                const options = {
                    url: 'https://fcm.googleapis.com/fcm/send',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'key='+setupConfig.gcm_id },
                    body: { registration_ids: regIds, notification: notifyPayload, data: notifyPayload },
                    json: true
                };
                request(options, function(err, response, body) {
                    if(!err && response.statusCode == 200) { resolve({ status: true, data: body }); }
                    else { reject({ status: false, data: body, message: "Notification Error" }); }
                });
            });
        }
        else { resolve({ status: true }); }
    });
}