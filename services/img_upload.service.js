const fs = require("fs");
const extractFrames = require('gif-extract-frames');
const sharp = require('sharp');
const sizeOf = require('image-size');

exports.singleFileUpload = function(image, rootPath, resolutionStatus, imgName) {
    return new Promise((resolve, reject) => {
        if(image) {
            checkDirectory(rootPath).then(() => {
                let fileType = ""; let base64Data = "";
                if(image.indexOf('png;base64') > -1) {
                    fileType = ".png";
                    base64Data = image.replace(/^data:image\/png;base64,/, "");
                } else {
                    fileType = ".jpg";
                    base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
                }
                let randomName = new Date().valueOf()+'-'+Math.floor(Math.random() * Math.floor(999999));
                if(imgName) { randomName = imgName; }
                let fileName = rootPath+'/'+randomName+fileType;
                fs.writeFile(fileName, base64Data, 'base64', function(err) {
                    if(!err) {
                        if(resolutionStatus) {
                            sizeOf(fileName, function (err, dimensions) {
                                if(!err && dimensions) {
                                    let width = Math.floor(dimensions.width*(15/100));
                                    let height = Math.floor(dimensions.height*(15/100));
                                    let lowResFileName = rootPath+'/'+randomName+"_s"+fileType;
                                    sharp(fileName).resize(width, height).toFile(lowResFileName, (err, info) => {
                                        resolve(fileName);
                                    });
                                }
                                else { resolve(fileName); }
                            });
                        }
                        else { resolve(fileName); }
                    }
                    else { resolve(null); }
                });
            })
            .catch(() => { resolve(null); });
        }
        else { resolve(null); }
    });
}

exports.logoUpload = function(jsonData) {
    return new Promise((resolve, reject) => {
        let imgData = "";
        if(jsonData.image.indexOf('png;base64') > -1) { imgData = jsonData.image.replace(/^data:image\/png;base64,/, ""); }
        else { imgData = jsonData.image.replace(/^data:image\/jpeg;base64,/, ""); }
        imgData = new Buffer.from(imgData, 'base64');
        // store logo
        sharp(imgData)
        .resize({ height: 100 })
        .png({quality : 100})
        .toFile(jsonData.root_path+"/logo.png")
        .then(() => {
            // _s store logo
            sharp(imgData)
            .resize({ height: 15 })
            .png({quality : 100})
            .toFile(jsonData.root_path+"/logo_s.png")
            .then(() => {
                // brand logo
                sharp(imgData)
                .resize({ height: 200 })
                .png({quality : 100})
                .toFile(jsonData.root_path+"/brand-logo.png")
                .then(() => {
                    // social logo
                    sharp(imgData)
                    .flatten({ background: "#ffffff" })
                    .resize({ width: 200, height: 200, kernel: sharp.kernel.lanczos3, fit: 'contain', background: "#ffffff" }) 
                    .jpeg({ quality: 100, chromaSubsampling: '4:4:4'})
                    .toFile(jsonData.root_path+"/social_logo.jpg")
                    .then(() => {
                        // mail logo
                        sharp(imgData)
                        .resize({ height: 80 })
                        .png({quality : 100})
                        .toFile(jsonData.root_path+"/mail_logo.png")
                        .then(() => {
                            // favicon
                            sharp(imgData)
                            .resize({ width: 50, height: 50, fit: 'contain', background: "#ffffff" })
                            .png({quality : 100})
                            .toFile(jsonData.root_path+"/favicon.png")
                            .then(() => {
                                resolve({ status: true });
                            })
                            .catch((err) => { reject({ status: false, error: err, message: "favicon logo" }); });
                        })
                        .catch((err) => { reject({ status: false, error: err, message: "mail logo" }); });
                    })
                    .catch((err) => { reject({ status: false, error: err, message: "social logo" }); });
                })
                .catch((err) => { reject({ status: false, error: err, message: "brand logo" }); });
            })
            .catch((err) => { reject({ status: false, error: err, message: "_s store logo" }); });;
        })
        .catch((err) => { reject({ status: false, error: err, message: "store logo" }); });
    });
}

exports.compressFileUpload = function(image, resizeConfig, rootPath, resolutionStatus, imgName) {
    return new Promise((resolve, reject) => {
        if(image) {
            checkDirectory(rootPath).then(() => {
                let fileType = ""; let base64Data = ""; let imgMultiplier = 1;
                if(image.indexOf('png;base64') > -1) {
                    fileType = ".png";
                    imgMultiplier = 0;
                    base64Data = image.replace(/^data:image\/png;base64,/, "");
                } else {
                    fileType = ".jpg";
                    base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
                }
                let randomName = new Date().valueOf()+'-'+Math.floor(Math.random() * Math.floor(999999));
                if(imgName) { randomName = imgName; }
                let fileName = rootPath+'/'+randomName+'.jpg';
                let lowResFileName = rootPath+'/'+randomName+"_s"+'.jpg';
                base64Data = new Buffer.from(base64Data, 'base64');
                if(resizeConfig) {
                    if(fileType=='.png') {
                        sharp(base64Data)
                        .flatten({ background: "#ffffff" })
                        .resize({ width: resizeConfig.crop_width, height: resizeConfig.crop_height, kernel: sharp.kernel.lanczos3, fit: 'contain' })
                        .jpeg({quality : resizeConfig.quality, chromaSubsampling: '4:4:4'})
                        .toFile(fileName)
                        .then((dimensions) => {
                            if(resolutionStatus) {
                                let width = Math.floor(dimensions.width*(15/100));
                                let height = Math.floor(dimensions.height*(15/100));
                                sharp(fileName).resize(width, height).toFile(lowResFileName, () => {
                                    resolve(fileName);
                                });
                            }
                            else { resolve(fileName); }
                        });
                    }
                    else {
                        sharp(base64Data)
                        .resize({ width: resizeConfig.crop_width, height: resizeConfig.crop_height, kernel: sharp.kernel.lanczos3, fit: 'contain' })
                        .jpeg({quality : resizeConfig.quality, chromaSubsampling: '4:4:4'})
                        .toFile(fileName)
                        .then((dimensions) => {
                            if(resolutionStatus) {
                                let width = Math.floor(dimensions.width*(15/100));
                                let height = Math.floor(dimensions.height*(15/100));
                                sharp(fileName).resize(width, height).toFile(lowResFileName, () => {
                                    resolve(fileName);
                                });
                            }
                            else { resolve(fileName); }
                        });
                    }
                }
                else {
                    let sizeInBytes = 4 * Math.ceil((base64Data.length / 3))*0.5624896334383812;
                    let sizeInKb = Math.round(sizeInBytes/1024);
                    let imgQuality = 100;
                    if(sizeInKb > 225) {
                        imgQuality = Math.round(117.7901 + (-13.6577 * imgMultiplier) + (-0.02142 * sizeInKb));
                        if(imgQuality > 100) { imgQuality = 100; }
                    }
                    if(fileType=='.png') {
                        sharp(base64Data)
                        .flatten({ background: "#ffffff" })
                        .jpeg({quality : imgQuality, chromaSubsampling: '4:4:4'})
                        .toFile(fileName)
                        .then((dimensions) => {
                            if(resolutionStatus) {
                                let width = Math.floor(dimensions.width*(15/100));
                                let height = Math.floor(dimensions.height*(15/100));
                                sharp(fileName).resize(width, height).toFile(lowResFileName, () => {
                                    resolve(fileName);
                                });
                            }
                            else { resolve(fileName); }
                        });
                    }
                    else {
                        sharp(base64Data)
                        .jpeg({quality : imgQuality, chromaSubsampling: '4:4:4'})
                        .toFile(fileName)
                        .then((dimensions) => {
                            if(resolutionStatus) {
                                let width = Math.floor(dimensions.width*(15/100));
                                let height = Math.floor(dimensions.height*(15/100));
                                sharp(fileName).resize(width, height).toFile(lowResFileName, () => {
                                    resolve(fileName);
                                });
                            }
                            else { resolve(fileName); }
                        });
                    }
                }
            })
            .catch(() => { resolve(null); });
        }
        else { resolve(null); } 
    });
}

exports.fileUpload = function(file, rootPath, fname) {
    return new Promise((resolve, reject) => {
        if(file) {
            checkDirectory(rootPath).then(() => {
                let splitData = file.name.split(".");
                let fileType = splitData[splitData.length-1];
                let randomName = new Date().valueOf()+'-'+Math.floor(Math.random() * Math.floor(999999));
                if(fname) { randomName = fname; }
                let fileName = rootPath+'/'+randomName+'.'+fileType;
                file.mv(fileName, (err) => {
                    if(err) { resolve(null); }
                    else { resolve(fileName); }
                });
            })
            .catch(() => { resolve(null); });
        }
        else { resolve(null); }
    });
}

exports.imageFileUpload = function(image, rootPath, resolutionStatus, imgName) {
    return new Promise((resolve, reject) => {
        if(image) {
            checkDirectory(rootPath).then(() => {
                let fileType = 'jpg';
                if(image.mimetype=='image/png') { fileType = 'png'; }
                else if(image.mimetype=='image/gif') { fileType = 'gif'; }
                let randomName = new Date().valueOf()+'-'+Math.floor(Math.random() * Math.floor(999999));
                if(imgName) { randomName = imgName; }
                let fileName = rootPath+'/'+randomName+'.'+fileType;
                image.mv(fileName, (err) => {
                    if(!err) {
                        if(resolutionStatus) {
                            let lowResFileName = rootPath+'/'+randomName+"_s."+fileType;
                            if(fileType=='gif') {
                                extractFrames({ input: fileName, output: lowResFileName })
                                .then((result) => { resolve(fileName); })
                                .catch((err) => { resolve(null); });
                            }
                            else {
                                sizeOf(fileName, function (err, dimensions) {
                                    if(!err && dimensions) {
                                        let width = Math.floor(dimensions.width*(15/100));
                                        let height = Math.floor(dimensions.height*(15/100));
                                        sharp(fileName).resize(width, height).toFile(lowResFileName, (err, info) => {
                                            resolve(fileName);
                                        });
                                    }
                                    else { resolve(fileName); }
                                });
                            }
                        }
                        else { resolve(fileName); }
                    }
                    else { resolve(null); }
                });
            })
            .catch(() => { resolve(null); });
        }
        else { resolve(null); }
    });
}

function checkDirectory(rootPath) {
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(rootPath)) {
            fs.mkdir(rootPath, { recursive: true }, (err) => {
                if(!err) { resolve(true); }
                else { reject(err); }
            });
        }
        else { resolve(true); }
    });
}