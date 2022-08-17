const PDFDocument = require('pdfkit');
const fs = require('fs');
const dateFormat = require('dateformat');
const commonService = require("../services/common.service");
const setupConfig = require('../config/setup.config');
const path = require("path");
const rootDir = path.join(__dirname).replace("services", "");

exports.ysPayments = function(storeDetails, invoiceDetails) {
  return new Promise((resolve, reject) => {
    let filePath = "uploads/"+storeDetails._id+"/invoices/"+invoiceDetails._id+".pdf";
    let subCharges = 0; let appCharges = 0;
    let tranCharges = 0; let discount = 0;
    if(invoiceDetails.order_type=='purchase_plan') {
      subCharges = invoiceDetails.package_details.price;
      discount = invoiceDetails.discount;
    }
    if(invoiceDetails.order_type=='purchase_app') {
      appCharges = invoiceDetails.app_list.reduce((accumulator, currentValue) => {
        return accumulator + currentValue['price'];
      }, 0);
    }
    if(invoiceDetails.order_type=='plan_renewal') {
      subCharges = invoiceDetails.package_details.price;
      appCharges = invoiceDetails.app_list.reduce((accumulator, currentValue) => {
        return accumulator + currentValue['price'];
      }, 0);
      tranCharges = invoiceDetails.transaction_charges;
      discount = invoiceDetails.credit;
    }
    if(invoiceDetails.order_type=='plan_change') {
      subCharges = invoiceDetails.package_details.price;
      appCharges = invoiceDetails.app_list.reduce((accumulator, currentValue) => {
        return accumulator + currentValue['price'];
      }, 0);
      tranCharges = invoiceDetails.transaction_charges;
      discount = invoiceDetails.discount - invoiceDetails.credit;
    }
    let doc = new PDFDocument({ size: "A4", margin: 30 });

    // Header
    doc
    .image(rootDir+"uploads/yourstore/logo.png", 30, 50, { width: 100 })
    .fillColor("#444444")
    .fontSize(8)
    .text("by Estore Mastery", 30, 82)
    .fontSize(10)
    .text(dateFormat(new Date(), "dd mmm yyyy"), 0, 50, { align: "right" })
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(invoiceDetails.invoice_number, 0, 65, { align: "right", oblique: true })
    .moveDown();

    // line break
    generateHr(doc, 105);

    // title
    doc
    .fillColor("#444444")
    .fontSize(18)
    .text("Invoice for "+storeDetails.name, 30, 130);

    // from
    doc
    .fontSize(11)
    .text("From", 30, 180)
    .font("Helvetica")
    .text("EStore Mastery Systems Pvt. Ltd.", 30, 205)
    .text(setupConfig.company_details.gst_no, 30, 223)
    .text("14, Gulmohar Avenue, Velachery Main Road,", 30, 241)
    .text("Guindy, Chennai", 30, 259)
    .text("Tamil Nadu 600032", 30, 277);

    // to
    if(!storeDetails.gst_no) { storeDetails.gst_no = '-'; }
    doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Bill to", 320, 180)
    .font("Helvetica")
    .text(storeDetails.name, 320, 205)
    .text(storeDetails.gst_no, 320, 223)
    .text(storeDetails.company_details.address.replace(new RegExp('\n', 'g'), " "), 320, 241)

    // table
    let invoiceTableTop = 350;
    doc.font("Helvetica-Bold");
    let rowDetails = { "field1": "No.", "field2": "Description", "field3": "Outlay" };
    generateTableRow(doc, invoiceTableTop, rowDetails);
    generateHr(doc, invoiceTableTop+20);

    doc.font("Helvetica");
    rowDetails = { "field1": "1", "field2": "Platform Rental Charges", "field3": commonService.rupeesFormat(subCharges) };
    generateTableRow(doc, invoiceTableTop+30, rowDetails);
    generateHr(doc, invoiceTableTop+50);

    rowDetails = { "field1": "2", "field2": "Advanced Feature Charges", "field3": commonService.rupeesFormat(appCharges) };
    generateTableRow(doc, invoiceTableTop+60, rowDetails);
    generateHr(doc, invoiceTableTop+80);

    rowDetails = { "field1": "3", "field2": "Transaction Charges", "field3": commonService.rupeesFormat(tranCharges) };
    generateTableRow(doc, invoiceTableTop+90, rowDetails);
    generateHr(doc, invoiceTableTop+110);

    rowDetails = { "field1": "4", "field2": "Discount", "field3": commonService.rupeesFormat(discount) };
    generateTableRow(doc, invoiceTableTop+120, rowDetails);
    generateHr(doc, invoiceTableTop+140);

    invoiceTableTop += 60;

    // tax
    if(invoiceDetails.igst && invoiceDetails.igst.percentage) {
      rowDetails = { "field1": "5", "field2": "Tax ("+invoiceDetails.igst.percentage+"% IGST)", "field3": commonService.rupeesFormat(invoiceDetails.igst.amount) };
      generateTableRow(doc, invoiceTableTop+90, rowDetails);
      generateHr(doc, invoiceTableTop+110);
    }
    if(invoiceDetails.cgst && invoiceDetails.cgst.percentage) {
      rowDetails = { "field1": "5", "field2": "Tax ("+invoiceDetails.cgst.percentage+"% CGST)", "field3": commonService.rupeesFormat(invoiceDetails.cgst.amount) };
      generateTableRow(doc, invoiceTableTop+90, rowDetails);
      generateHr(doc, invoiceTableTop+110);
    }
    if(invoiceDetails.sgst && invoiceDetails.sgst.percentage) {
      rowDetails = { "field1": "6", "field2": "Tax ("+invoiceDetails.sgst.percentage+"% SGST)", "field3": commonService.rupeesFormat(invoiceDetails.sgst.amount) };
      generateTableRow(doc, invoiceTableTop+120, rowDetails);
      generateHr(doc, invoiceTableTop+140);
    }

    doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text('-', 30, invoiceTableTop+155)
    .text('INVOICE GRAND TOTAL', 80, invoiceTableTop+155)
    .text(commonService.rupeesFormat(invoiceDetails.amount), 280, invoiceTableTop+155, { align: "right" });
    generateHr(doc, invoiceTableTop+175);

    // final content
    doc
    .fontSize(11)
    .text("Amount Paid: "+commonService.rupeesFormat(invoiceDetails.amount), 30, invoiceTableTop+200) // 600
    .font("Helvetica")
    .text("Note: The above prices are in "+invoiceDetails.currency_type.country_code, 30, invoiceTableTop+220);

    // signature
    // doc
    // .fontSize(10)
    // .text("by Estore Mastery Systems Pvt. Ltd.", 0, invoiceTableTop+260, { align: "right" })
    // .strokeColor("#aaaaaa")
    // .lineWidth(1)
    // .moveTo(400, invoiceTableTop+335)
    // .lineTo(565, invoiceTableTop+335)
    // .stroke();

    // footer
    doc
    .fontSize(10)
    .text("This invoice is digitally signed", 30, 800, { align: "center", width: 500 });

    let rootPath = rootDir+"uploads/"+storeDetails._id+"/invoices";
    if(!fs.existsSync(rootPath)) {
      fs.mkdir(rootPath, { recursive: true }, (err) => {
        if(!err) {
          let writeStream = fs.createWriteStream(rootDir+filePath);
          doc.pipe(writeStream);
          doc.end();
          writeStream.on('finish', function () {
            resolve(filePath);
          });
        }
        else {
          resolve("unable to create directory");
        }
      });
    }
    else {
      let writeStream = fs.createWriteStream(rootDir+filePath);
      doc.pipe(writeStream);
      doc.end();
      writeStream.on('finish', function () {
        resolve(filePath);
      });
    }
  });
}

function generateTableRow(doc, y, rowDetails) {
  doc
  .fontSize(10)
  .text(rowDetails.field1, 30, y)
  .text(rowDetails.field2, 80, y)
  .text(rowDetails.field3, 280, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
  .strokeColor("#aaaaaa")
  .lineWidth(1)
  .moveTo(30, y)
  .lineTo(565, y)
  .stroke();
}