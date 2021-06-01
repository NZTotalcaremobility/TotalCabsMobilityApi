const mongoose = require("mongoose");
const areaCodeSchema = new mongoose.Schema(
  {
     areacode: { type: String },
    address: { type:String},
    isDeleted : {
      type : Boolean,
      default : false
    },
  }, 
  {
    timestamps: true,
  }
);
const areacodemodel = mongoose.model("areaCode", areaCodeSchema);

module.exports = areacodemodel;
