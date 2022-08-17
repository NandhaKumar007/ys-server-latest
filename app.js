const express = require('express');
const helmet = require('helmet');
const port = 4000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");
const fs = require('fs');
const http = require('http');
const logger = require('morgan');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const fileUpload = require('express-fileupload');
const dbConfig = require('./config/db.config');
const jwtConfig = require('./config/jwtsecret');
const colorThief = require('colorthief');
const app = express();

const environment = 'development';
// const environment = 'production';

app.use(helmet());
app.use(cors());
app.use(logger('dev'));
app.use(fileUpload());
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit:'50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.Promise = global.Promise;

if(environment=='production')
{
	/* DB CONNECTION */
	mongoose.connect(dbConfig.production.credentials, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => console.log('production database connected'))
	.catch((err) => console.error('production db conn err', err));
}
else
{
	/* DB CONNECTION */
	mongoose.connect(dbConfig.development.credentials, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => console.log('development database connected'))
	.catch((err) => console.error('development db conn err', err));
}

/* CREATE SERVER */
const server = http.createServer(app);

/* LISTEN PORT */
server.listen(port, function (err, res) {
	if (err) console.log('port error', err);
	console.log('Running on port '+port+'...');
});

const userRoutes = require('./src/routes/user.route');
const authRoutes = require('./src/routes/auth.route');
const guestRoutes = require('./src/routes/guest.route');
const adminRoutes = require('./src/routes/admin.route');
const storeRoutes = require('./src/routes/store.route');
const otherRoutes = require('./src/routes/others.route');
const guestUserRoutes = require('./src/routes/guest_user.route');
const storeDetailRoutes = require('./src/routes/store_details.route');

app.use('/user', verifyUserToken, userRoutes);
app.use('/admin', verifyAdminToken, adminRoutes);
app.use('/store', verifyStoreToken, storeRoutes);
app.use('/guest_user', verifyGuestUserToken, guestUserRoutes);

app.use('/auth', authRoutes);
app.use('/guest', guestRoutes);
app.use('/others', otherRoutes);
app.use('/store_details', storeDetailRoutes);

const jenkinController = require('./src/controllers/jenkin.controller');
app.use('/jenkin', jenkinController);

app.get('/', function(req, res) { res.send({ message : 'Welcome to yourstore version 0.1' }); });
app.get('/undefined', function(req, res) { res.end(); });
app.get('/null', function(req, res) { res.end(); });

const admin = require('./src/models/admin.model');
const store = require('./src/models/store.model');
const vendor = require('./src/models/vendor.model');
const guestUser = require('./src/models/guest_user.model');
const storeFeatures = require('./src/models/store_features.model');

const commonService = require("./services/common.service");
const imgUploadService = require("./services/img_upload.service");

app.post('/logo_upload', function(req, res) {
	req.body.root_path = "uploads/"+req.body.store_id;
	if(!fs.existsSync(req.body.root_path)) {
		fs.mkdir(req.body.root_path, { recursive: true }, (err) => {
			if(!err) {
				imgUploadService.logoUpload(req.body).then((respData) => {
					colorThief.getColor(path.join(__dirname, req.body.root_path+'/logo.png')).then(color => {
						colorThief.getPalette(path.join(__dirname, req.body.root_path+'/logo.png')).then(colors => {
							colors.unshift(color);
							res.json({ status: true, colors: colors.map(color => commonService.rgbToHex(color)) });
						}).catch(err => {
							res.json({ status: false, message: 'getcolors error' });
						});
					})
					.catch(err => {
						res.json({ status: false, message: 'getcolors error' });
					});
				})
				.catch((errData) => { res.json(errData); });
			}
			else { res.json({ status: false, error: err, message: "mkdir error" }); }
		});
	}
	else {
		imgUploadService.logoUpload(req.body).then((respData) => {
			colorThief.getColor(path.join(__dirname, req.body.root_path+'/logo.png')).then(color => {
				colorThief.getPalette(path.join(__dirname, req.body.root_path+'/logo.png')).then(colors => {
					colors.unshift(color);
					res.json({ status: true, colors: colors.map(color => commonService.rgbToHex(color)) });
				}).catch(err => {
					res.json({ status: false, message: 'getcolors error' });
				});
			})
			.catch(err => {
				res.json({ status: false, message: 'getcolors error' });
			});
		})
		.catch((errData) => { res.json(errData); });
	}
});

app.post('/logo_colors', function(req, res) {
	colorThief.getColor(req.body.file_name).then(color => {
		colorThief.getPalette(req.body.file_name).then(colors => {
			colors.unshift(color);
			res.json({ status: true, colors: colors.map(color => commonService.rgbToHex(color)) });
		}).catch(err => {
			res.json({ status: false, message: 'getcolors error' });
		});
	})
    .catch(err => {
		res.json({ status: false, message: 'getcolors error' });
	});
});

/* Middlewares */
function verifyAdminToken(req, res, next) {
    if(req.headers.authorization) {
    	let token = req.headers.authorization.split(' ')[1];
    	if(token) {
    		jwt.verify(token, jwtConfig.jwtSecretKey, function(err, response) {
	            if(!err && response) {
					req.id = response.id;
					admin.findOne({ _id: mongoose.Types.ObjectId(response.id), status: "active", session_key: response.session_key }, function(err, response) {
						if(!err && response) {
							next();
						}
						else {
							return res.json({ status: false, session_end: true, message: 'Invalid Login' });
						}
					});
	            }
	            else { return res.json({ status: false, message: 'Failed to authenticate token.' }); }
	        });
    	}
	    else { return res.json({ status: false, message: 'Unauthorized request.' }); }
    }
    else { return res.json({ status: false, message: 'No token provided.' }); }
}

function verifyStoreToken(req, res, next) {
    if(req.headers.authorization) {
    	let token = req.headers.authorization.split(' ')[1];
    	if(token) {
    		jwt.verify(token, jwtConfig.jwtSecretKey, function(err, response) {
	            if(!err && response) {
					req.id = response.id;
					req.login_type = response.login_type;
					if(response.login_type=='admin') {
						store.findOne({ _id: mongoose.Types.ObjectId(response.id), status: "active", session_key: response.session_key }, function(err, response) {
							if(!err && response) {
								next();
							}
							else {
								return res.json({ status: false, session_end: true, message: 'Invalid Login' });
							}
						});
					}
					else if(response.login_type=='subuser') {
						req.subuser_id = response.subuser_id;
						storeFeatures.findOne({ store_id: mongoose.Types.ObjectId(response.id), "sub_users._id": mongoose.Types.ObjectId(response.subuser_id),
						"sub_users.session_key": response.session_key, "sub_users.status": "active" }, function(err, response) {
							if(!err && response) {
								next();
							}
							else {
								return res.json({ status: false, session_end: true, message: 'Invalid Login' });
							}
						});
					}
					else if(response.login_type=='vendor') {
						req.vendor_id = response.vendor_id;
						vendor.findOne({ store_id: mongoose.Types.ObjectId(response.id), _id: mongoose.Types.ObjectId(response.vendor_id),
						session_key: response.session_key, status: "active" }, function(err, response) {
							if(!err && response) {
								next();
							}
							else {
								return res.json({ status: false, session_end: true, message: 'Invalid Login' });
							}
						});
					}
					else { return res.json({ status: false, message: 'Invalid Login' }); }
	            }
	            else { return res.json({ status: false, message: 'Failed to authenticate token.' }); }
	        });
    	}
	    else { return res.json({ status: false, message: 'Unauthorized request.' }); }
    }
    else { return res.json({ status: false, message: 'No token provided.' }); }
}

function verifyUserToken(req, res, next) {
    if(req.headers.authorization) {
    	let token = req.headers.authorization.split(' ')[1];
    	if(token) {
    		jwt.verify(token, jwtConfig.jwtSecretKey, function(err, response) {
	            if(!err && response) {
					req.id = response.id;
					if(response.login_type) { req.login_type = response.login_type; }
					next();
	            }
	            else { return res.json({ status: false, message: 'Failed to authenticate token.' }); }
	        });
    	}
	    else { return res.json({ status: false, message: 'Unauthorized request.' }); }
    }
    else { return res.json({ status: false, message: 'No token provided.' }); }
}

function verifyGuestUserToken(req, res, next) {
    if(req.headers.authorization) {
    	let token = req.headers.authorization.split(' ')[1];
    	if(token) {
    		jwt.verify(token, jwtConfig.jwtSecretKey, function(err, response) {
	            if(!err && response) {
					req.id = response.id;
					if(response.login_type) { req.login_type = response.login_type; }
					guestUser.findOne({ _id: mongoose.Types.ObjectId(response.id), status: "active", session_key: response.session_key }, function(err, response) {
						if(!err && response) {
							next();
						}
						else {
							return res.json({ status: false, session_end: true, message: 'Invalid User' });
						}
					});
	            }
	            else { return res.json({ status: false, message: 'Failed to authenticate token.' }); }
	        });
    	}
	    else { return res.json({ status: false, message: 'Unauthorized request.' }); }
    }
    else { return res.json({ status: false, message: 'No token provided.' }); }
}
/* Middlewares end */

/* Scheduler */
const cronService = require("./services/scheduler.service");

// every hour
schedule.scheduleJob('59 59 * * * *', function() {
	if(environment=='production') {
		cronService.cartRecovery();
	}
});

// every day on 5 AM
schedule.scheduleJob('0 30 0 * * *', function() {
	if(environment=='production') {
		cronService.clearInactiveOrders();
		cronService.accountExpired('trial');
		cronService.accountExpired('live');
	}
});

// every day on 10 AM
schedule.scheduleJob('0 30 5 * * *', function() {
	if(environment=='production') {
		cronService.trialExpiry();
		cronService.planExpiry();
	}
});

// every day on 11 AM
schedule.scheduleJob('0 30 6 * * *', function() {
	if(environment=='production') {
		cronService.educationalMail();
	}
});
/* Scheduler end */