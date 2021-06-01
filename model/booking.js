const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema(
  {
    user:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    driver:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    distance: { type: String },
    duration: { type:String},
    fare: {type: String},
    tax: {type: Number},
    totalFare : {type: Number},
    taxiType : {type : String },
    status :{type: String, enum : ['Booked', 'Cancelled', 'Driver-Assigned','User-Picked','In-Route','Completed'], default : 'Booked'},
    pickupLocation :{
      type: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },
    dropLocation :{
      type: { type: String },
      coordinates: { type: [Number] },
      address: { type: String},
    },
    isDeleted : {
      type : Boolean,
      default : false
    },
  }, 
  {
    timestamps: true,
  }
);
const bookingmodel = mongoose.model("booking", bookingSchema);

module.exports = bookingmodel;
