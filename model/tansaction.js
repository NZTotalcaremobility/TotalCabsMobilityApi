const { ObjectId } = require('mongoose')
var mongoose = require('mongoose')
var constantsMessages = require('../config/constants')

var transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    driverdetails: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    review: { type: mongoose.Schema.Types.ObjectId, ref: "review" },
    Amount: { type: Number },
    fare: { type: String },
    tax: { type: Number },
    Cardamount: { type: String },
    Cashamount: { type: String },
    pinAmount: { type: String },
    pin: { type: String },
    type: {
        type: String,
        enum: ['Epos', 'Cash', 'Pin', 'Split'],
        default: 'Cash'

    }, status: {
        type: String,
        enum: ['hold', 'processing', 'completed', 'failed'],
        default: 'hold'

    },
    jobid: { type: mongoose.Schema.Types.ObjectId, ref: 'driverstatus' }
}, { timestamps: true })

var transaction = mongoose.model('transaction', transactionSchema)

module.exports = transaction