const { Schema, model } = require('mongoose');

const ContactSchema = new Schema({
    fullName: String,
    contanctNo: Number,
    email: String,
    enquiry: String,
}, { timestamps: true });

module.exports = model('contact', ContactSchema);