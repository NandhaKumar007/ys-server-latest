'use strict';
const router = require('express').Router();
const storeController = require('../controllers/store/store.controller');
const catalogController = require('../controllers/store/catalog.controller');
const menuController = require('../controllers/store/menu.controller');
const sectionController = require('../controllers/store/section.controller');
const categoryController = require('../controllers/store/category.controller');
const subCategoryController = require('../controllers/store/sub_category.controller');
const childSubCategoryController = require('../controllers/store/child_sub_category.controller');
const productController = require('../controllers/store/product.controller');
const bannerController = require('../controllers/store/banner.controller');
const layoutController = require('../controllers/store/layout.controller');
const featuresController = require('../controllers/store/features.controller');
const addonController = require('../controllers/store/addon.controller');
const measurementController = require('../controllers/store/measurement.controller');
const tagController = require('../controllers/store/tag.controller');
const footNoteController = require('../controllers/store/footnote.controller');
const faqController = require('../controllers/store/faq.controller');
const archiveController = require('../controllers/store/archive.controller');
const giftCardController = require('../controllers/store/gift_card.controller');
const offerCodesController = require('../controllers/store/offer_codes.controller');
const blogController = require('../controllers/store/blog.controller');
const customerController = require('../controllers/store/customer.controller');
const currencyController = require('../controllers/store/currency.controller');

const taxRatesController = require('../controllers/store/tax_rates.controller');
const sizeChartController = require('../controllers/store/size_chart.controller');
const taxonomyController = require('../controllers/store/taxonomy.controller');
const productColorsController = require('../controllers/store/product_colors.controller');
const amenityController = require('../controllers/store/amenities.controller');
const imgTagController = require('../controllers/store/image_tags.controller');

const shippingController = require('../controllers/store/shipping.controller');
const quotationController = require('../controllers/store/quotation.controller');
const orderController = require('../controllers/store/orders.controller');
const couponController = require('../controllers/store/coupon.controller');
const paymentController = require('../controllers/store/payment.controller');
const paymentTypesController = require('../controllers/store/payment_types.controller');
const policyController = require('../controllers/store/policy.controller');
const contactPageController = require('../controllers/store/contact_page.controller');
const locationController = require('../controllers/store/location.controller');
const extraPageController = require('../controllers/store/extra_page.controller');
const dinamicOfferController = require('../controllers/store/dinamic_offers.controller');
const dinamicRewardsController = require('../controllers/store/dinamic_rewards.controller');

const subUserController = require('../controllers/store/sub_user.controller');
const vendorsController = require('../controllers/store/vendors.controller');
const courierPartnerController = require('../controllers/store/courier_partner.controller');
const adController = require('../controllers/store/ad.controller');
const adOrdersController = require('../controllers/store/ad_orders.controller');
const AiStylesController = require('../controllers/store/ai_styles.controller');
const sizingAssistantController = require('../controllers/store/sizing_assistant.controller');
const discountsController = require('../controllers/store/discounts.controller');
const collectionController = require('../controllers/store/collection.controller');
const appointmentServicesController = require('../controllers/store/appointment_services.controller');
const appointmentController = require('../controllers/store/appointment.controller');
const reviewController = require('../controllers/store/review.controller');
const branchController = require('../controllers/store/branch.controller');
const quickOrderController = require('../controllers/store/quick_order.controller');

// user
const addressListController = require('../controllers/user/addresslist.controller');
const modelListController = require('../controllers/user/model.controller');

router
    .route('/details')
    .get(storeController.details)
    .put(storeController.update)
router
    .route('/adv_details')
    .get(storeController.adv_details)
router
    .route('/properties')
    .get(storeController.prop_details)
    .put(storeController.update_prop)
router
    .route('/feedback')
    .post(storeController.feedback)
router
    .route('/newsletter_subscribers')
    .get(storeController.newsletter_subscribers)
router
    .route('/dashboard')
    .post(storeController.dashboard)
router
    .route('/dashboard_customers')
    .post(storeController.dashboard_customers)
router
    .route('/vendor_dashboard')
    .post(storeController.vendor_dashboard)
router
    .route('/billing_statement')
    .post(storeController.billing_statement)
router
    .route('/domain_enquiry')
    .post(storeController.domain_enquiry)
router
    .route('/change_pwd')
    .post(storeController.change_pwd)
router
    .route('/update_logo')
    .post(storeController.update_logo)
router
    .route('/create_ssl')
    .get(storeController.create_ssl)

router
    .route('/section')
    .get(sectionController.list)
    .post(sectionController.add)
    .put(sectionController.update)
    .patch(sectionController.soft_remove)
router
    .route('/section/details')
    .post(sectionController.details)

router
    .route('/category')
    .get(categoryController.list)
    .post(categoryController.add)
    .put(categoryController.update)
    .patch(categoryController.soft_remove)
router
    .route('/category/details')
    .post(categoryController.details)

router
    .route('/sub_category')
    .get(subCategoryController.list)
    .post(subCategoryController.add)
    .put(subCategoryController.update)
    .patch(subCategoryController.soft_remove)
router
    .route('/sub_category/details')
    .post(subCategoryController.details)

router
    .route('/child_sub_category')
    .get(childSubCategoryController.list)
    .post(childSubCategoryController.add)
    .put(childSubCategoryController.update)
    .patch(childSubCategoryController.soft_remove)
router
    .route('/child_sub_category/details')
    .post(childSubCategoryController.details)

router
    .route('/product_list')
    .get(productController.count)
    .post(productController.list)
router
    .route('/multi_product_list')
    .post(productController.multi_list)
router
    .route('/product')
    .post(productController.add)
    .put(productController.update)
    .patch(productController.soft_remove)
router
    .route('/product/:productId')
    .get(productController.details)
router
    .route('/product/overall')
    .put(productController.overall_update)
router
    .route('/product/images')
    .put(productController.update_images)
router
    .route('/product/brochure')
    .post(productController.upload_brochure)
router
    .route('/product/details')
    .put(productController.update_category)
router
    .route('/product/archive')
    .put(productController.move_to_archive)
router
    .route('/product_bulk_upload')
    .post(productController.addMany)

router
    .route('/banner')
    .get(bannerController.details)
    .put(bannerController.update)

router
    .route('/layout')
    .get(layoutController.list)
    .post(layoutController.add)
    .put(layoutController.update)
    .patch(layoutController.delete)
router
    .route('/layout_list')
    .put(layoutController.update_image_list)
    .patch(layoutController.reset)
router
    .route('/layout_list_v2')
    .put(layoutController.update_image_list_v2)

router
    .route('/product_features')
    .get(featuresController.product_features)
router
    .route('/store_features')
    .get(featuresController.store_features)
router
    .route('/vendor_features')
    .get(featuresController.vendor_features)
router
    .route('/ys_features')
    .get(featuresController.ys_features)
router
    .route('/ys_features/create_payment')
    .post(featuresController.create_payment)
router
    .route('/ys_features/app')
    .post(featuresController.install_ys_feature)
    .patch(featuresController.uninstall_ys_feature)

router
    .route('/addon')
    .get(addonController.list)
    .post(addonController.add)
    .put(addonController.update)
    .patch(addonController.soft_remove)

router
    .route('/measurement')
    .get(measurementController.list)
    .post(measurementController.add)
    .put(measurementController.update)
    .patch(measurementController.soft_remove)

router
    .route('/tag')
    .get(tagController.list)
    .post(tagController.add)
    .put(tagController.update)
    .patch(tagController.soft_remove)

router
    .route('/footnote')
    .get(footNoteController.list)
    .post(footNoteController.add)
    .put(footNoteController.update)
    .patch(footNoteController.soft_remove)

router
    .route('/faq')
    .get(faqController.list)
    .post(faqController.add)
    .put(faqController.update)
    .patch(faqController.soft_remove)

router
    .route('/archive')
    .get(archiveController.list)
    .post(archiveController.add)
    .put(archiveController.update)
    .patch(archiveController.soft_remove)

router
    .route('/archive/product')
    .get(archiveController.product_list)
    .put(archiveController.move_from_archive)
    .post(archiveController.move_bulk_products_from_archive)

router
    .route('/gift_card')
    .get(giftCardController.list)
    .post(giftCardController.add)
    .put(giftCardController.update)
    .patch(giftCardController.hard_remove)

router
    .route('/offers')
    .get(offerCodesController.list)
    .post(offerCodesController.add)
    .put(offerCodesController.update)
    .patch(offerCodesController.soft_remove)
router
    .route('/offer_details')
    .get(offerCodesController.details)

router
    .route('/blog')
    .get(blogController.list)
    .post(blogController.add)
    .put(blogController.update)
    .patch(blogController.hard_remove)
router
    .route('/blog_details')
    .get(blogController.details)

router
    .route('/sub_user')
    .get(subUserController.list)
    .post(subUserController.add)
    .put(subUserController.update)
    .patch(subUserController.hard_remove)
router
    .route('/sub_user/update_pwd')
    .put(subUserController.update_pwd)

router
    .route('/vendor')
    .get(vendorsController.list)
    .post(vendorsController.add)
    .put(vendorsController.update)
    .patch(vendorsController.hard_remove)
router
    .route('/vendor/update_pwd')
    .put(vendorsController.update_pwd)
router
    .route('/vendor/change_pwd')
    .post(vendorsController.change_pwd)
router
    .route('/vendor/activation')
    .post(vendorsController.activation)
    .put(vendorsController.link_account)

// vendor wallet 
router
    .route('/vendor_topup/vendor_wallet')
    .post(vendorsController.vendor_wallet_topup)

router
    .route('/vendor_topup/vendor_wallet_stmt')
    .post(vendorsController.vendor_wallet_stmt)

router
    .route('/currency')
    .get(currencyController.list)
    .post(currencyController.add)
    .put(currencyController.update)
    .patch(currencyController.hard_remove)
router
    .route('/currency/details')
    .get(currencyController.common_details)

router
    .route('/tax_rates')
    .get(taxRatesController.list)
    .post(taxRatesController.add)
    .put(taxRatesController.update)
    .patch(taxRatesController.soft_remove)

router
    .route('/size_chart')
    .get(sizeChartController.list)
    .post(sizeChartController.add)
    .put(sizeChartController.update)
    .patch(sizeChartController.soft_remove)

router
    .route('/taxonomy')
    .get(taxonomyController.list)
    .post(taxonomyController.add)
    .put(taxonomyController.update)
    .patch(taxonomyController.soft_remove)

router
    .route('/product_colors')
    .get(productColorsController.list)
    .post(productColorsController.add)
    .put(productColorsController.update)
    .patch(productColorsController.soft_remove)

router
    .route('/amenities')
    .get(amenityController.list)
    .post(amenityController.add)
    .put(amenityController.update)
    .patch(amenityController.soft_remove)

router
    .route('/image_tags')
    .get(imgTagController.list)
    .post(imgTagController.add)
    .put(imgTagController.update)
    .patch(imgTagController.hard_remove)
router
    .route('/image_auto_tags')
    .put(imgTagController.update_auto_tags)

router
    .route('/shipping')
    .get(shippingController.list)
    .post(shippingController.add)
    .put(shippingController.update)
    .patch(shippingController.hard_remove)
router
    .route('/shipping_details')
    .get(shippingController.details)
router
    .route('/delivery_methods')
    .get(shippingController.delivery_details)
    .put(shippingController.update_delivery)
router
    .route('/pincodes')
    .get(shippingController.pincodes)
    .put(shippingController.update_pincodes)

router
    .route('/branches')
    .get(branchController.list)
    .post(branchController.add)
    .put(branchController.update)
    .patch(branchController.soft_remove)

router
    .route('/quick_order')
    .get(quickOrderController.list)
    .post(quickOrderController.add)
    .put(quickOrderController.update)
    .patch(quickOrderController.hard_remove)

router
    .route('/customer')
    .get(customerController.list)
    .post(customerController.add)
    .put(customerController.update)
router
    .route('/customer_models')
    .get(customerController.model_history_list)
    .post(customerController.add_model_history)
router
    .route('/customer_details')
    .get(customerController.details)
router
    .route('/email_validate')
    .get(customerController.email_validate)
router
    .route('/abandoned_carts')
    .get(customerController.abandoned_carts)

// guest users
router
    .route('/guest-user')
    .get(customerController.guest_user)
router
    .route('/abandoned-guest-user')
    .get(customerController.abandoned_guest_user)

// catalog
router
    .route('/catalog')
    .get(catalogController.list)
    .post(catalogController.add)
    .put(catalogController.update)
    .patch(catalogController.soft_remove)
router
    .route('/catalog/details')
    .post(catalogController.details)

// menus
router
    .route('/menu')
    .get(menuController.menu_list)
    .post(menuController.add_menu)
    .put(menuController.update_menu)
    .patch(menuController.remove_menu)
router
    .route('/menu/details')
    .post(menuController.menu_details)
router
    .route('/menu/images')
    .put(menuController.update_menu_images)

router
    .route('/menu_section')
    .get(menuController.section_list)
    .post(menuController.add_section)
    .put(menuController.update_section)
    .patch(menuController.remove_section)
router
    .route('/menu_section/details')
    .post(menuController.section_details)

router
    .route('/menu_category')
    .get(menuController.category_list)
    .post(menuController.add_category)
    .put(menuController.update_category)
    .patch(menuController.remove_category)
router
    .route('/menu_category/details')
    .post(menuController.category_details)

router
    .route('/menu_sub_category')
    .get(menuController.sub_category_list)
    .post(menuController.add_sub_category)
    .put(menuController.update_sub_category)
    .patch(menuController.remove_sub_category)
router
    .route('/menu_sub_category/details')
    .post(menuController.sub_category_details)

// quotations
router
    .route('/quotations')
    .post(quotationController.create_quotation)
    .put(quotationController.update_quotation)
    .patch(quotationController.cancel_quotation)
router
    .route('/send_quotation')
    .post(quotationController.send_quotation)
router
    .route('/confirm_quotation')
    .post(quotationController.confirm_quotation)
router
    .route('/quotation_list')
    .post(quotationController.list)

// orders
router
    .route('/orders')
    .post(orderController.manual_order)
    .put(orderController.update_order)
    .patch(orderController.cancel_order)
router
    .route('/order_list')
    .post(orderController.list)
router
    .route('/settlement_orders')
    .post(orderController.settlement_orders)
    .put(orderController.update_settlement_order)
router
    .route('/inactive_order_list')
    .post(orderController.inactive_list)
router
    .route('/order_details')
    .get(orderController.details)
router
    .route('/place_inactive_order')
    .post(orderController.place_inactive_order)
router
    .route('/order_status')
    .put(orderController.status_update)
router
    .route('/resend_order_email')
    .post(orderController.resend_mail)
router
    .route('/donation_list')
    .post(orderController.donation_list)
router
    .route('/guest_order_list')
    .post(orderController.guest_order_list)
router
    .route('/order_item_group')
    .post(orderController.add_item_group)
    .put(orderController.update_item_group)
    .patch(orderController.remove_item_group)

// coupon codes
router
    .route('/coupon_list')
    .post(couponController.list)
router
    .route('/coupon_details')
    .post(couponController.details)
router
    .route('/coupon')
    .post(couponController.add)
    .put(couponController.update)
    .patch(couponController.soft_remove)
router
    .route('/coupon/resend_email')
    .post(couponController.resend_email)

// user
router
    .route('user/address')
    .post(addressListController.add)
    .put(addressListController.update)
    .patch(addressListController.remove)

router
    .route('user/model')
    .post(modelListController.add)
    .put(modelListController.update)
    .patch(modelListController.remove)

// courier partners
router
    .route('/cp')
    .get(courierPartnerController.list)
    .post(courierPartnerController.add)
    .put(courierPartnerController.update)
    .patch(courierPartnerController.hard_remove)

router
    .route('/courier_partner')
    .get(courierPartnerController.order_details)
    .post(courierPartnerController.create_order)
    .put(courierPartnerController.update_order)
    .patch(courierPartnerController.cancel_order)
router
    .route('/courier_partner/pickup_request')
    .post(courierPartnerController.pickup_request)

router
    .route('/courier_partner/dunzo')
    .post(courierPartnerController.dunzo_create_order)
    .get(courierPartnerController.dunzo_order_status)
    .patch(courierPartnerController.cancel_dunzo_order)
router
    .route('/courier_partner/ghana')
    .post(courierPartnerController.ghana_create_order)

// wallet
router
    .route('/courier_partner/wallet')
    .post(courierPartnerController.wallet_topup)
router
    .route('/courier_partner/wallet_stmt')
    .post(courierPartnerController.wallet_statement)


// ad
router
    .route('/ad')
    .post(adController.add)
    .put(adController.update)
    .patch(adController.hard_remove)
router
    .route('/ad/setting')
    .post(adController.ad_setting)

// ad orders
router
    .route('/ad_orders')
    .post(adOrdersController.add)
    .patch(adOrdersController.soft_remove)
router
    .route('/ad_orders/list')
    .post(adOrdersController.list)

// AI Styles
router
    .route('/ai_styles')
    .get(AiStylesController.details)
    .put(AiStylesController.update)

// sizing assistant
router
    .route('/sizing_assistant')
    .get(sizingAssistantController.list)
    .post(sizingAssistantController.add)
    .put(sizingAssistantController.update)
    .patch(sizingAssistantController.soft_remove)
router
    .route('/sizing_assistant/:sizingId')
    .get(sizingAssistantController.details)

// new offers
router
    .route('/discounts')
    .get(discountsController.list)
    .post(discountsController.add)
    .put(discountsController.update)
    .patch(discountsController.soft_remove)
router
    .route('/discounts_config')
    .put(discountsController.update_config)

// collections
router
    .route('/collection')
    .get(collectionController.list)
    .post(collectionController.add)
    .put(collectionController.update)
    .patch(collectionController.soft_remove)
router
    .route('/collection/details')
    .post(collectionController.details)

// appointment category
router
    .route('/appointment_category')
    .get(appointmentServicesController.category_list)
    .post(appointmentServicesController.add_category)
    .put(appointmentServicesController.update_category)
    .patch(appointmentServicesController.hard_remove_category)

// appointment services
router
    .route('/appointment_services')
    .get(appointmentServicesController.service_details)
    .post(appointmentServicesController.add)
    .put(appointmentServicesController.update)
    .patch(appointmentServicesController.hard_remove)

// appointments
router
    .route('/appointment')
    .post(appointmentController.list)

// reviews
router
    .route('/product_review_list')
    .post(reviewController.list)
router
    .route('/product_reviews')
    .post(reviewController.add)
    .put(reviewController.update)
    .patch(reviewController.hard_remove)

// Payment Status
router
    .route('/payment_status/ccavenue')
    .post(paymentController.ccavenue_payment_status)
router
    .route('/payment_status/razorpay')
    .post(paymentController.razorpay_payment_status)

// payment types
router
    .route('/payment_types')
    .get(paymentTypesController.list)
    .post(paymentTypesController.add)
    .put(paymentTypesController.update)
    .patch(paymentTypesController.soft_remove)

// policies
router
    .route('/policies')
    .get(policyController.details)
    .put(policyController.update)

// contact page
router
    .route('/contact_page')
    .get(contactPageController.details)
    .put(contactPageController.update)

// locations
router
    .route('/locations')
    .get(locationController.list)
    .post(locationController.add)
    .put(locationController.update)
    .patch(locationController.soft_remove)
router
    .route('/locations_config')
    .put(locationController.update_config)

// extra pages
router
    .route('/extra_page')
    .get(extraPageController.list)
    .post(extraPageController.add)
    .put(extraPageController.update)
    .patch(extraPageController.hard_remove)

// dinamic offers
router
    .route('/dinamic_offers')
    .get(dinamicOfferController.list)
    .post(dinamicOfferController.add)
    .put(dinamicOfferController.update)
    .patch(dinamicOfferController.hard_remove)

// dinamic rewards
router
    .route('/dinamic_rewards')
    .get(dinamicRewardsController.list)

module.exports = router;