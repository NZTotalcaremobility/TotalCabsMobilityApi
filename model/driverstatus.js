const { _ } = require('lodash')
var mongoose = require('mongoose')

var driverStatus = new mongoose.Schema({
    jobid: { type: String, default: 10001 },
    driverdetails: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    distance: { type: String, default: 0 },
    duration: { type: String, default: 0 },
    pickupAreaname: { type: String, default: null },
    dropAreaname: { type: String, default: null },
    TotalTrips: { type: Number, seq: 0 },
    dateOfJourney: { type: Date, default: null },
    dayOfJourney: { type: Array, default: null },
    pickUptime: { type: String, default: null },
    riderrating: { type: Number, default: 0 },
    tripStartTime: { type: Date, default: null },
    tripendtime: { type: Date, default: null },
   fare: { type: Number, default: 0 },
    Amount: { type: Number, default: 0 },
    totalTime: { type: String, default: null },
    carType: { type: String, default: null },
    mailby: { type: String, default: null },
    bookingTime: { type: String },
    // name:{type:String},
    // email:{type:String},
    // phonenumber:{type:String},
    bookingDate: { type: String, default: null },
    pickupLocation: {
        type: { type: String },
        coordinates: { type: [Number] },
        address: { type: String }
    },
    notifiedUser:{
        id:{type:[String]}
    },
    driverAction:[{
        id:{type:String},
        
    
    }],
    tripstarttime: { type: Date, default: null },
    tripendtime: { type: Date, default: null },
    dropLocation: {
        type: { type: String },
        coordinates: { type: [Number] },
        address: { type: String }
    },
    midlocation: [{
        coordinates: { type: [Number] },
        location: { type: String },
    }],
    requestAction: {
        type: String,
        enum: ['Accepted', 'Rejected', 'Pending'],
        default: 'Pending'
    },
    // pickupTime: {
    //     type: Date,
    //     default:null
    // },
    tripstatus: {
        type: String,
        enum: ['Ongoing', 'Completed', "Canceled", "Upcoming"],
        default: 'Upcoming'
    },
    waitingtime: { type: Number },
    jobtype: {
        type: String,
        enum: ['Normal', 'Hailjob', 'Coverjob', 'DispatchJob'],
        default: 'Normal'
    },
    status: [{
        location: {
            type: { type: String },
            coordinates: { type: [Number] },
        },
        status: {
            type: String,
            enum: ['RideApproved', 'Ongoing', 'Reachedtocustomer', 'Tripstarted', 'Endtrip'],
            default: 'Reachedtocustomer'
        },
        triptime: {
            type: Date,
            default: null
        }
    }
    ],
    notifiactionPre15: { type: Boolean, default: false }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })


var incrementalSchema = new mongoose.Schema({
    name: { type: String },
    value: { type: Number, default: 10001 }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })

driverStatus.pre("save", function (next) {
    var job = this;
    if (this.isNew) {
        getSequenceNextValue('jobid').then((value) => {
            job.jobid = `${value}`;
            return next();
        })
    } else {
        return next();
    }
});

let _incremental = mongoose.model('incremental', incrementalSchema)

async function getSequenceNextValue(seqName) {
    let found = await _incremental.find({ name: seqName })
    var seqDoc;
    if (!_.isEmpty(found)) {
        seqDoc = await _incremental.findOneAndUpdate(
            { name: seqName },
            { $inc: { value: 1 } }
        );
        return seqDoc.value;

    } else {
        seqDoc = await _incremental.insertMany({ name: seqName })[0]
        return seqDoc.value;

    }

}

let driverstatus = mongoose.model('driverstatus', driverStatus)
module.exports = driverstatus