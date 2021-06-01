const mongoose = require('mongoose')

const riderschema = new mongoose.Schema({

    rating:{type:Number},
    phonenumber:{type:String},
    pickuplocation:{type:String},
    droplocation:{type:String},
    deviceInfo: [
        
        {
           
        deviceType: {
            type: String
        },

        deviceToken: {
            type: String
        },
        access_token: {
            type: String
        },
    }],
    isDeleted:{type:Boolean,default:false},
    status:{type:false,default:false}
})

let ridermodel = mongoose.model('rider',riderschema)


module.exports=ridermodel