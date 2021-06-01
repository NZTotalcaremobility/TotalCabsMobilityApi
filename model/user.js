


var mongoose = require("mongoose");
var constantsMessages = require("../config/constants");
var bcrypt = require("bcrypt-nodejs");
var customerSchema = new mongoose.Schema(
  {

    //driverstatus: { type: mongoose.Schema.Types.ObjectId, ref: 'driverstatus' },
    dob: { type: Date },
    licencenumber: { type: String },
    documents: {
      driverLicence: { type: String, default: null },
      trainingDoc: { type: String, default: null },
      pEndorsement: { type: String, default: null },
      hoistManual: { type: String, default: null },
      driverManual: { type: String, default: null },
      healthSafetyPolicy: { type: String, default: null }
    },
    rating: { type: Number },
    key: { type: Number },
    keyStatus: { type: Boolean, default: false },
    nikname: { type: String },
    companyname: { type: String },

    lastloginTime: { type: String },
    firstLoginTime: { type: Date, default: null },
    lastLogoutTime: { type: Date, default: null },
    imagefile: {
      type: String,
      default: 'profile-pic.jpg'
    },
    currentLocation: {
      type: { type: String },
      coordinates: { type: [Number], index: '2dsphere' },
      address: { type: String }
    },
    pickupLocation: {
      type: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },

    },
    dropLocation: {
      type: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },


    favoritePickupLocation: {
      type: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },
    favoriteDropLocation: {
      type: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },

    deviceInfo: [
      {
        deviceType: {
          type: String,
        },

        deviceToken: {
          type: String,
        },
        access_token: {
          type: String,
        },
      },
    ],
    email: { type: String },
    password: { type: String },
    phonenumber: { type: String },
    name: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postcode: { type: String },
    country: { type: String },
    carBrand: { type: String },
    carType: { type: String },
    carModel: { type: String },
    carRegNo: { type: String },
    carFuelType: { type: String },
    licenseValid: { type: String },
    carOwner: { type: String },
    // licenceFront: { type: String },
    // licenceBack: { type: String },
    // rcBcak: { type: String },
    // rcFront: { type: String },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      enum: ["Normal", "Driver", "Company", "Admin", "SubAdmin"],
    },

    status: { type: Boolean, default: false },
    verifyingToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },

    driverlocation: {
      type: { type: String },
      coordinates: { type: [Number] },
    },

    status: { type: Boolean, default: false },
    verifyingToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordExpires: Date,
    resetPasswordToken: String,
    otp: { type: String },
    onlinestatus: { type: String, enum: [0, 1] },
    isAvailable: { type: Boolean, default: true },
    phoneverified: { type: Boolean, default: false },
    permissions: { type: Array, default: [] }
  },
  {
    timestamps: true,
  }
);
customerSchema.pre('validate', function (next) {
  if (!this.key) {
    var randomChars = '0123456789';
    var result = '';
    for (var i = 0; i < 4; i++) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    this.key = result.toUpperCase()
  }
  next();
});

customerSchema.statics.existCheck = function (email, callback) {
  console.log("reached here at emailcheck", email);
  var where = {};
  if (email) {
    where = {
      $and: [
        {
          email: new RegExp("^" + email + "$", "i"),
        },
      ],
      isDeleted: {
        $ne: true,
      },
    };
  }
  customermodel.findOne(where, function (err, userdata) {
    if (err) {
      callback(err);
    } else {
      if (userdata) {
        callback(null, constantsMessages.validationMessages.emailAlreadyExist);
      } else {
        callback(null, true);
      }
    }
  });
};
customerSchema.statics.existPhonenumberCheck = function (phonenumber, callback) {
  var where = {};
  if (phonenumber) {
    where = {
      $and: [
        {
          phonenumber: new RegExp("^" + phonenumber + "$", "i"),
        },
      ],
      isDeleted: {
        $ne: true,
      },
      phoneverified: {
        $eq: true
      }
    };
  }
  console.log(where)
  customermodel.findOne(where, function (err, userdata) {
    console.log('user', userdata)
    if (err) {
      callback(err);
    } else {
      if (userdata) {
        callback(null, constantsMessages.validationMessages.phoneAlreadyExist);
      } else {
        callback(null, true);
      }
    }
  });
};



customerSchema.pre("save", function (next) {
  var user = this;
  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, null, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

customerSchema.methods.comparePassword = function (passw, cb) {
  let user = this;
  console.log("reached here at compare password");
  bcrypt.compare(passw, user.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }

    cb(null, isMatch);
  });
};

let customermodel = mongoose.model("user", customerSchema);

module.exports = customermodel;



