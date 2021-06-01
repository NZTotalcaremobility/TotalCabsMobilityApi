const { Schema, model } = require('mongoose');

const notificationSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    jobid: {
        type: Schema.Types.ObjectId,
        ref: "driverstatus",
        default: null
    },
    message: String,

    isSeen: {
        type: Boolean,
        default: false
    },
    reason: String,

    isSeen: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['system', 'chat'],
        default: null
    }
}, { timestamps: true });

module.exports = model('notification', notificationSchema);