var mongoose = require('mongoose'),
    User = require('../model/user'),
    Chat = require('../model/chat'),
    formidable = require('formidable'),
    
    moment = require('moment'),
    path = require('path')
const msgctrl = require('../controllers/Messaging_ctrl');
var _ = require('underscore');
var async = require('async');
exports.saveMesage = data => {
    const members = [data.sender, data.receiver];
    return new Promise((resolve, reject) => {
        Chat.findOne({
            members: { $all: members }
        }, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    }).then(chat => {
        let chatObj = {
            sender: data.sender,
            receiver: data.receiver,
            message: data.message,
            senderStatus: data.senderStatus,
            receiverStatus: data.receiverStatus,
            image: data.image ? data.image : '',
            type: data.type ? data.type : '',
            created_on: moment.utc().format()
        }
        return new Promise((resolve, reject) => {
            if (chat == null) { // no previous chat between users
                let objChat = {
                    members: members,
                    chat: [chatObj]
                }
                Chat(objChat).save(objChat, function (err, res) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res);
                    }
                })
            } else { // already chat
                let objChat = {
                    $push: {
                        chat: chatObj
                    }
                }
                Chat.update({ _id: chat._id }, objChat, function (err, res) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res);
                    }
                })
            }
        });
    }).catch(error => Promise.reject(error));
}

// exports.message_history_fun = (payload, cb) => {


//     var members = [mongoose.Types.ObjectId(payload.sender), mongoose.Types.ObjectId(payload.receiver)];
//     async.waterfall([
//         function (callback) {
//             Chat.findOne({
//                 members:
//                     { $all: members },

//             })
//                 .exec(function (err, res) {
//                     if (err) {
//                         console.log(err, "err")
//                     }
//                     else {

//                         res.chat.forEach(function (j) {
//                             if (!j.receiverStatus) {
//                                 j.receiverStatus = true;
//                             }
//                         })


//                         res.save(function (err, resp) {
//                             if (err) {
//                                 callback(err)
//                             }
//                             else {
//                                 callback(null, true)
//                             }
//                         });

//                     }
//                 })
//         }
//     ], function (err, result) {
//         if (err) {
//             callback(err)
//         }
//         else {
//             Chat.find({
//                 members: { $all: members }

//             })
//                 .populate({
//                     path: 'chat.receiver',
//                     select: 'name profile_image'
//                 })
//                 .populate({
//                     path: 'chat.sender',
//                     select: 'name profile_image'
//                 })
//                 .select({

//                     "chat.modified_on": 0,
//                     "chat.status": 0,
//                     "chat.is_deleted": 0
//                 }).exec(cb);
//         }
//     });
// }

exports.message_history_fun = (payload, cb) => {


    var members = [mongoose.Types.ObjectId(payload.sender), mongoose.Types.ObjectId(payload.receiver)];
    async.waterfall([
        function (callback) {
            Chat.findOne({
                members:
                    { $all: members },


            })
                .exec(function (err, res) {
                    if (err) {
                        console.log(err, "err")
                    }
                    else 
                    {
                        if (res !=null){

                             
                            res.chat.forEach(function(j){
                                if(!j.receiverStatus)
                                {
                                    j.receiverStatus=true;
                                }
                            })
                        
                     
                       res.save(function(err,resp){
                           if(err)
                           {
                               callback(err)
                           }
                           else{
                           callback(null,true)
                           }
                       });
                        }
                    else{
                         var json =({
                            
                                code: 200,
                                data: [],
                                status: true,
                                total: 0
                            });
                            callback(null, json);
                        }

                    }
                })
        }
    ], function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            Chat.find({
                members: { $all: members }

            })
                .populate({
                    path: 'chat.receiver',
                    select: 'name imagefile'
                })
                .populate({
                    path: 'chat.sender',
                    select: 'name imagefile'
                })
                .select({

                    "chat.modified_on": 0,
                    "chat.status": 0,
                    "chat.is_deleted": 0
                }).exec(cb);
        }
    });
}

exports.message_list = payload => {

    var members = [payload.userid];
    return Chat.find({
        members: { $all: members }
    })
        .select({
            "chat": { "$slice": -1 },
            "members": 0,
            "_id": 0,
            "__v": 0,
            "created_on": 0

        })
        .populate({
            path: 'chat.receiver',
            select: 'name imagefile'
        })
        .populate({
            path: 'chat.sender',
            select: 'name imagefile'
        })
        .sort({ 'chat.created_on': -1 })
        .select({

            "chat.modified_on": 0,
            "chat.status": 0,
            "chat.is_deleted": 0
        })
}