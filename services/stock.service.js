const mongoose = require('mongoose');
const product = require("../src/models/product.model");
const coupon = require("../src/models/coupon_codes.model");
const offer = require("../src/models/offer_codes.model");

exports.decProductStock = function(itemList) {
    for(let i=0; i<itemList.length; i++)
    {
        let proData = itemList[i];
        let qty = parseFloat(proData.quantity);
        let variants = proData.variant_types;
        product.findOne({ _id: mongoose.Types.ObjectId(proData.product_id) }, function(err, response) {
            if(!err && response) {
                let productDetails = response;
                if(variants.length)
                {
                    let queryParams = {};
                    let variantInfo = [];
                    if(variants.length===1) {
                        queryParams = { _id: mongoose.Types.ObjectId(proData.product_id),
                            variant_list: {
                                "$elemMatch": {
                                    [variants[0].name]: variants[0].value
                                }
                            }
                        };
                        variantInfo = productDetails.variant_list.filter(element => 
                            element[variants[0].name]==variants[0].value
                        );
                    }
                    else if(variants.length===2) {
                        queryParams = { _id: mongoose.Types.ObjectId(proData.product_id),
                            variant_list: {
                                "$elemMatch": {
                                    [variants[0].name]: variants[0].value,
                                    [variants[1].name]: variants[1].value
                                }
                            }
                        };
                        variantInfo = productDetails.variant_list.filter(element => 
                            element[variants[0].name]==variants[0].value && element[variants[1].name]==variants[1].value
                        );
                    }
                    else if(variants.length===3) {
                        queryParams = { _id: mongoose.Types.ObjectId(proData.product_id),
                            variant_list: {
                                "$elemMatch": {
                                    [variants[0].name]: variants[0].value,
                                    [variants[1].name]: variants[1].value,
                                    [variants[2].name]: variants[2].value
                                }
                            }
                        };
                        variantInfo = productDetails.variant_list.filter(element => 
                            element[variants[0].name]==variants[0].value && element[variants[1].name]==variants[1].value && element[variants[2].name]==variants[2].value
                        );
                    }
                    if(variantInfo.length) {
                        if(variantInfo[0].hold_till) {
                            if(new Date(variantInfo[0].hold_till) > new Date()) {
                                product.findOneAndUpdate(
                                queryParams,
                                { $inc: { "ordered_qty": qty, "stock": -qty, "variant_list.$.stock": -qty, "variant_list.$.hold_qty": -qty } }, function(err, response) {
                                    return true;
                                });
                            }
                            else {
                                product.findOneAndUpdate(
                                queryParams,
                                { 
                                    $inc: { "ordered_qty": qty, "stock": -qty, "variant_list.$.stock": -qty },
                                    $set: { "variant_list.$.hold_qty": 0, "variant_list.$.hold_till": new Date() }
                                }, function(err, response) {
                                    return true;
                                });
                            }
                        }
                        else {
                            product.findOneAndUpdate(
                            queryParams,
                            { 
                                $inc: { "ordered_qty": qty, "stock": -qty, "variant_list.$.stock": -qty },
                                $set: { "variant_list.$.hold_qty": 0, "variant_list.$.hold_till": new Date() }
                            }, function(err, response) {
                                return true;
                            });
                        }
                    }
                    else {
                        product.findOneAndUpdate(
                        queryParams,
                        { 
                            $inc: { "ordered_qty": qty, "stock": -qty, "variant_list.$.stock": -qty },
                            $set: { "variant_list.$.hold_qty": 0, "variant_list.$.hold_till": new Date() }
                        }, function(err, response) {
                            return true;
                        });
                    }
                }
                else {
                    if(productDetails.hold_till) {
                        if(new Date(productDetails.hold_till) > new Date()) {
                            product.findOneAndUpdate(
                            { _id: mongoose.Types.ObjectId(productDetails._id) },
                            { $inc: { "ordered_qty": qty, "stock": -qty, "hold_qty": -qty } }, function(err, response) {
                                return true;
                            });
                        }
                        else {
                            product.findOneAndUpdate(
                            { _id: mongoose.Types.ObjectId(productDetails._id) },
                            { 
                                $inc: { "ordered_qty": qty, "stock": -qty },
                                $set: { "hold_qty": 0, "hold_till": new Date() }
                            }, function(err, response) {
                                return true;
                            });
                        }
                    }
                    else {
                        product.findOneAndUpdate(
                        { _id: mongoose.Types.ObjectId(productDetails._id) },
                        { 
                            $inc: { "ordered_qty": qty, "stock": -qty },
                            $set: { "hold_qty": 0, "hold_till": new Date() }
                        }, function(err, response) {
                            return true;
                        });
                    }
                }
            }
        });
    }
}

exports.incProductStock = function(itemList) {
    for(let i=0; i<itemList.length; i++)
    {
        let proData = itemList[i];
        let qty = parseFloat(proData.quantity);
        let variants = proData.variant_types;
        if(variants.length)
        {
            let queryParams = {};
            if(variants.length===1) {
                queryParams = { _id: mongoose.Types.ObjectId(proData.product_id),
                    variant_list: {
                        "$elemMatch": {
                            [variants[0].name]: variants[0].value
                        }
                    }
                };
            }
            else if(variants.length===2) {
                queryParams = { _id: mongoose.Types.ObjectId(proData.product_id),
                    variant_list: {
                        "$elemMatch": {
                            [variants[0].name]: variants[0].value,
                            [variants[1].name]: variants[1].value
                        }
                    }
                };
            }
            else if(variants.length===3) {
                queryParams = { _id: mongoose.Types.ObjectId(proData.product_id),
                    variant_list: {
                        "$elemMatch": {
                            [variants[0].name]: variants[0].value,
                            [variants[1].name]: variants[1].value,
                            [variants[2].name]: variants[2].value
                        }
                    }
                };
            }
            // update
            product.findOneAndUpdate(queryParams, { $inc: { "ordered_qty": -qty, "stock": qty, "variant_list.$.stock": qty } }, function(err, response) {
                return true;
            });
        }
        else {
            product.findOneAndUpdate({ _id: mongoose.Types.ObjectId(proData.product_id) }, { $inc: { "ordered_qty": -qty, "stock": qty } }, function(err, response) {
                return true;
            });
        }
    }
}

exports.updateCouponBalance = function(orderDetails) {
    let couponList = orderDetails.coupon_list;
    for(let i=0; i<couponList.length; i++)
    {
        let couponDetails = couponList[i];
        let price = parseFloat(couponDetails.price);
        let orderData = { order_id: orderDetails._id, order_number: orderDetails.order_number, redeemed_amount: price };
        coupon.findOne({ _id: mongoose.Types.ObjectId(couponDetails.coupon_id) },  function(err, response) {
            if(!err && response) {
                if(response.coupon_type=='wallet') {
                    coupon.findOneAndUpdate({ _id: mongoose.Types.ObjectId(couponDetails.coupon_id) },
                    { 
                        $inc: { "redeemed_amount": price, "balance": -price },
                        $push: { order_list: orderData },
                        $set: { "hold_till": new Date() }
                    }, function(err, response) {
                        return true;
                    });
                }
                else {
                    coupon.findOneAndUpdate({ _id: mongoose.Types.ObjectId(couponDetails.coupon_id) },
                    { 
                        $inc: { "redeemed_amount": price },
                        $push: { order_list: orderData },
                        $set: { "balance": 0, "hold_till": new Date() }
                    }, function(err, response) {
                        return true;
                    });
                }
            }
            else {
                return true;
            }
        });
    }
}

exports.incOfferRedeemCount = function(offerDetails) {
    offer.findByIdAndUpdate(offerDetails.id, { $inc: { "redeemed_count": 1 } }, function(err, response) {
        return true;
    });
}

function holdProductStock(productDetails) {
    return new Promise((resolve, reject) => {
        // hold 7 minutes
        let holdTillTime = new Date().setMinutes(new Date().getMinutes() + 7);
        let variants = productDetails.variant_types;
        if(variants.length)
        {
            let queryParams = {};
            if(variants.length===1) {
                queryParams = { _id: mongoose.Types.ObjectId(productDetails.product_id),
                    variant_list: {
                        "$elemMatch": {
                            [variants[0].name]: variants[0].value
                        }
                    }
                };
            }
            else if(variants.length===2) {
                queryParams = { _id: mongoose.Types.ObjectId(productDetails.product_id),
                    variant_list: {
                        "$elemMatch": {
                            [variants[0].name]: variants[0].value,
                            [variants[1].name]: variants[1].value
                        }
                    }
                };
            }
            else if(variants.length===3) {
                queryParams = { _id: mongoose.Types.ObjectId(productDetails.product_id),
                    variant_list: {
                        "$elemMatch": {
                            [variants[0].name]: variants[0].value,
                            [variants[1].name]: variants[1].value,
                            [variants[2].name]: variants[2].value
                        }
                    }
                };
            }
            // update
            if(productDetails.hold_till) {
                if(new Date(productDetails.hold_till) > new Date()) {
                    product.findOneAndUpdate(
                        queryParams,
                        {
                            $inc: { "variant_list.$.hold_qty": productDetails.quantity },
                            $set: { "variant_list.$.hold_till": new Date(holdTillTime) }
                        }, function(err, response) {
                        resolve(true);
                    });
                }
                else {
                    product.findOneAndUpdate(
                        queryParams,
                        { $set: { "variant_list.$.hold_qty": productDetails.quantity, "variant_list.$.hold_till": new Date(holdTillTime) } }, function(err, response) {
                        resolve(true);
                    });
                }
            }
            else {
                product.findOneAndUpdate(
                    queryParams,
                    { $set: { "variant_list.$.hold_qty": productDetails.quantity, "variant_list.$.hold_till": new Date(holdTillTime) } }, function(err, response) {
                    resolve(true);
                });
            }
        }
        else {
            if(productDetails.hold_till) {
                if(new Date(productDetails.hold_till) > new Date()) {
                    product.findOneAndUpdate(
                        { _id: mongoose.Types.ObjectId(productDetails.product_id) },
                        { 
                            $inc: { "hold_qty": productDetails.quantity },
                            $set: { "hold_till": holdTillTime }
                        }, function(err, response) {
                        resolve(true);
                    });
                }
                else {
                    product.findOneAndUpdate(
                        { _id: mongoose.Types.ObjectId(productDetails.product_id) },
                        { $set: { "hold_qty": productDetails.quantity, "hold_till": holdTillTime } }, function(err, response) {
                        resolve(true);
                    });
                }
            }
            else {
                product.findOneAndUpdate(
                    { _id: mongoose.Types.ObjectId(productDetails.product_id) },
                    { $set: { "hold_qty": productDetails.quantity, "hold_till": holdTillTime } }, function(err, response) {
                    resolve(true);
                });
            }
        }
    });
}

function holdCoupon(couponDetails) {
    return new Promise((resolve, reject) => {
        // hold 7 minutes
        let holdTillTime = new Date().setMinutes(new Date().getMinutes() + 7);
        coupon.findOneAndUpdate({ _id: mongoose.Types.ObjectId(couponDetails.coupon_id) },
            { $set: { hold_till: holdTillTime } }, function(err, response) {
            resolve(true);
        });
    });
}

exports.holdProductAndCoupon = async function(uniqueItemList, couponList) {
    for(let i=0; i<uniqueItemList.length; i++) {
        // hold product
        await holdProductStock(uniqueItemList[i]);
    }
    for(let i=0; i<couponList.length; i++) {
        // hold coupon
        await holdCoupon(couponList[i]);
    }
    return true;
}