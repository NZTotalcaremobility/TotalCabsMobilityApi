const mongoose = require('mongoose');
var enquiryschema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phonenumber: { type: Number },
    mobNo: { type: Number },
    pickDate: { type: Date },
    dropDate: { type: Date },
    equipment: { type: String },
    noOfPassengers: { type: String },
    enquiry: { type: String },
    isDeleted: { type: Boolean, default: false },
    fleet: { type: String }
}, { timestamps: true });

const enquirymodel = mongoose.model('enquiry', enquiryschema)

module.exports = enquirymodel
