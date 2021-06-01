const mongoose = require('mongoose')

const driverdetailsschema = new mongoose.Schema({

    driverid:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    date:{type:Date},
    distance:{type:String}


})

const driversdetailsmodel = mongoose.model('driverdetail',driverdetailsschema)

module.exports=driversdetailsmodel