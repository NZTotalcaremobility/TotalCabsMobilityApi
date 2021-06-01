const mongoose = require('mongoose')

const reviewschema = new mongoose.Schema({

    ratedto:{type:mongoose.Schema.Types.ObjectId,ref:'user'},
    ratedby:{type:mongoose.Schema.Types.ObjectId,ref:'user'},
    rating:{type:Number},
    review:{type:String}


})

const review = mongoose.model('review',reviewschema)

module.exports=review