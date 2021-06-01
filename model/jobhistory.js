const mongoose = require('mongoose')


var jobhistoryschema = new mongoose.Schema({
    dateOfJourney:{type:Date},
    customername:{type:String},
    driverid:{type:mongoose.Schema.Types.ObjectId,ref:'driver'},
    address:{type:String},
    lat:{type:String},
    long:{type:String},
    isDeleted:{type:Boolean,default:false}
},{timestamps:true})

const jobmodel = mongoose.model('jobhistory',jobhistoryschema)

module.exports=jobmodel
