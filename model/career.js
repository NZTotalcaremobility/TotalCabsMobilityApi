


var mongoose = require("mongoose");
var careerSchema = new mongoose.Schema(
    {

        email: { type: String },
        phonenumber: { type: String },
        fname: { type: String },
        lname: { type: String },
        isWeekend: { type: Boolean },
        // Do you have a current passenger endorsement (p-endorsement) on your Driver's Licence? *
        pEndorsement: { type: Boolean },
        comments: { type: String },
        status: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

let careerModal = mongoose.model("career", careerSchema);

module.exports = careerModal;



