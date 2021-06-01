
const fs = require("fs");
const PDFDocument = require("pdfkit");
var path = require('path');
const utility = require("../../config/utility");
const constants = require("../../config/constants");
const puppeteer = require('puppeteer')
const ejs = require('ejs')



function createInvoice(invoice, transactionId) {
    const location = `${constants.invoicePath}/${transactionId}.pdf`;

    let doc = new PDFDocument({ size: "A4", margin: 50 });

    generateHeader(doc);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateFooter(doc);
    doc.end();
    doc.pipe(fs.createWriteStream(location));
    return `/${constants.invoicePath}/${transactionId}.pdf`;
}

function generateHeader(doc) {
    doc
        .image(path.join(__dirname, '../../frontend/src/assets/images/logo-cab-green.png'), 50, 45, { width: 80 })
        .fillColor("#444444")
        .fontSize(18)
        .text("Total Cab mobilty", 50, 100)
        .fontSize(10)
        .text(`Driver Name`, 200, 50, { align: "right" })
        .text(`GST Number`, 200, 65, { align: "right" })
        .text("Phone", 200, 80, { align: "right" })
        .moveDown();
}

function generateCustomerInformation(doc, invoice) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Invoice", 50, 160);

    generateHr(doc, 185);

    const customerInformationTop = 200;

    doc
        .fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.invoice_nr, 150, customerInformationTop)
        .font("Helvetica")
        .text("Invoice Date:", 50, customerInformationTop + 15)
        .text(invoice.inVoiceDate ? formatDate(invoice.inVoiceDate) : '', 150, customerInformationTop + 15)
        .text("Balance Due:", 50, customerInformationTop + 30)
        .text(
            formatCurrency(invoice.total - invoice.paid),
            150,
            customerInformationTop + 30
        )

        .font("Helvetica-Bold")
        .text(invoice.user.name, 300, customerInformationTop)
        .font("Helvetica")
        .text(invoice.user.email, 300, customerInformationTop + 15)
        .text(
            invoice.user.address,
            300,
            customerInformationTop + 40
        )
        .moveDown();

    generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 330;
    let additionalSpace = 0

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Driver Name",
        "Pessenger Name",
        "Pick Location",
        "Drop Location",
        "Distance",
        "Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        let position = invoiceTableTop + (i + 1) * 40;

        generateTableRow(
            doc,
            position,
            item.driverName,
            item.userName,
            item.pickupLocation,
            item.dropLocation,
            item.distance,
            formatCurrency(item.Amount)
        );
        let pickLocationLenght = item.pickupLocation.length > 0 ? Number(item.pickupLocation.length / 13) : 0
        let dropLocationLenght = item.dropLocation.length > 0 ? Number(item.dropLocation.length / 13) : 0

        if (pickLocationLenght > 3) {
            position += Number((pickLocationLenght * 10).toFixed());
            additionalSpace = Number(pickLocationLenght * 10)
        } else if (dropLocationLenght > 3) {
            position += Number((dropLocationLenght * 10).toFixed());
            additionalSpace = Number(dropLocationLenght * 10)
        }
        generateHr(doc, position + 35);
    }

    const taxPosition = additionalSpace + invoiceTableTop + (i + 1) * 40;
    generateTableRow(
        doc,
        taxPosition,
        "Payment Type",
        invoice.paymentType,
        "",
        "",
        "Tax",
        formatCurrency(invoice.tax)
    );

    const subtotalPosition = taxPosition + 30;
    generateTableRow(
        doc,
        subtotalPosition,
        "",
        "",
        "",
        "",
        "Subtotal",
        formatCurrency(invoice.subtotal)
    );

    const totalPosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        totalPosition,
        "",
        "",
        "",
        "",
        "Total",
        formatCurrency(invoice.total)
    )

    const paidToDatePosition = totalPosition + 20;
    generateTableRow(
        doc,
        paidToDatePosition,
        "",
        "",
        "",
        "",
        "Paid",
        formatCurrency(invoice.paid)
    );

    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        duePosition,
        "",
        "",
        "",
        "",
        "Balance Due",
        formatCurrency(invoice.total - invoice.paid)
    );
    doc.font("Helvetica");
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            "Payment is due within 15 days. Thank you for your business.",
            50,
            780,
            { align: "center", width: 500 }
        );
}

function generateTableRow(
    doc,
    y,
    driverName,
    userName,
    form,
    to,
    distance,
    total
) {
    doc
        .fontSize(10)
        .text(driverName, 50, y)
        .text(userName, 120, y)
        .text(form, 220, y, { width: 70 })
        .text(to, 320, y, { width: 70 })
        .text(distance, 400, y)
        .text(total, 0, y, { align: "right" });
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(cents) {
    const paisa = cents
    return `$ ${paisa}`;
}

function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return year + "/" + month + "/" + day;
}



// gernate format for send invoce  to mailTo
/**
 * method to generate format for sending email
 * 
 * 
 * @param {String} to 
 * @param {string} filePath 
 * @param {Function} callback 
 */

const sendInvoiceToMail = (to, filePath, callback) => {
    let mailTo = to;
    let subject = 'Invoice';
    let message = "Your Invoice Has been Generated";
    let attachment = [{
        filename: 'Invoice.pdf',
        path: path.join(__dirname, '../../', filePath)
    }]

    utility.sendmailWithAttachment(mailTo, subject, message, attachment, callback)
}
const generatePdf = async (data, id) => {
    try {
        const invoicePath = path.resolve(`views/invoice.ejs`);

        let location = `${constants.invoicePath}/${id}${constants.invoiceFileType}`;

        let html = await ejs.renderFile(invoicePath, data);

        // launch virtual browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage()

        // We set the page content as the generated html by handlebars
        await page.setContent(html)

        // We use pdf function to generate the pdf in the same folder as this file.
        await page.pdf({ path: location, format: 'A4' })
        await browser.close();

        return location;
    } catch (err) {
        return Promise.reject("Could not load html template");
    }
}



module.exports = {
    createInvoice,
    mailToInvoice: sendInvoiceToMail,
    generatePdf
};

