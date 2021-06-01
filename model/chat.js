const mongoose = require('mongoose')

const chatEmbedded = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    message: {
        type: String,
    },
    image: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_on: {
        type: Date,
        default: Date.now()
    },
    modified_on: {
        type: Date,
        default: Date.now()
    },
    senderStatus: {
        type: Boolean,
        default: false
    },
    receiverStatus: {
        type: Boolean,
        default: false
    },
    type: {
        type: String
    },
    
});


const Chatschema = new mongoose.Schema({
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    chat: [chatEmbedded],
    created_on: { type: Date, default: Date.now() }
})

var Chat = mongoose.model('chat', Chatschema);

module.exports = Chat;
