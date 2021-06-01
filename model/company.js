var mongoose = require('mongoose')
var constantsMessages = require('../config/constants')
var bcrypt = require('bcrypt-nodejs');
var companySchema = new mongoose.Schema({

    email:{type:String},
    password:{type:String},
    phonenumber:{type:String},
    imagefile:{type:String,
        default : null},
    name:{type:String},
    lastname:{type:String},
    companyname:{type:String},
    key:{type:String},
    isDeleted: {
        type: Boolean,
        default: false,
    },
    userType: {
        type: String,
        enum: ['Normal']
        
    },
    status:{type:Boolean,default:false},
    verifyingToken:{type:String},
    isEmailVerified:{type:Boolean,default:false},
    resetPasswordExpires: Date,
    resetPasswordToken: String,
    otp:{type:String},
    phoneverified:{type:Boolean,default:false}

},{
    timestamps:true
})

companySchema.statics.existCheck = function (email,callback) {
    console.log("reached here at emailcheck", email)
    var where = {};
    if (email) {
        where = {
            $and: [{
                email: new RegExp('^' + email + '$', "i")
            },
        ],
            isDeleted: {
                $ne: true
            }
        };
    }
    companymodel.findOne(where, function (err, userdata) {
        if (err) {
            callback(err)
        } else {
            if (userdata) {

                callback(null, constantsMessages.validationMessages.emailAlreadyExist);
            } else {
                callback(null, true);
            }
        }
    });
};
companySchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
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


companySchema.methods.comparePassword = function (passw, cb) {
    let user = this;
    console.log('reached here at compare password')
    bcrypt.compare(passw, user.password, function (err, isMatch) {

        if (err) {
            return cb(err);
        }

        cb(null, isMatch);
    });
};
companySchema.pre('validate', function (next) {
    if (!this.key) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for ( var i = 0; i < 6; i++ ) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    this.key = result.toUpperCase()
    }
    next();
    });

let companymodel= mongoose.model('company',companySchema)


module.exports=companymodel