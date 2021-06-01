'use strict';
var _ = require('underscore');

var mongoose = require('mongoose'),
    User =require('../model/user'),
    Chat =require('../model/chat'),
    formidable = require('formidable'),
    moment = require('moment'),
    path = require('path')

const msgService = require('../services/msgService');
module.exports = {
    uploadimage: uploadimage,
    getUser: getUser,
    saveMesage: saveMesage,
    message_history: message_history,
    message_list: message_list
}

/**
 * Upload function for image in chat
 */
function uploadimage(req, res) {
    const form = new formidable.IncomingForm();
    form.keepExtensions = true; //keep file extension
    form.uploadDir = 'public/post/images';
    const pathSeparator = path.sep;
    let validImage;
    form.onPart = function (part) {
        if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
            validImage = true;
            this.handlePart(part);
        }
        else {
            validImage = false;
        }
    }
    form.parse(req, function (err, fields, files) {
        if (fields.userid == req.user._id) {
            let userid = fields.userid;
            let query = { _id: userid };
            User.findOne(query)
                .exec(function (err, user) {
                    if (err) {
                        return res.send({ code: 402, success: false, message: "Some internal error occured" });
                    }
                    if (!user) {
                        res.json({ code: 400, success: true, message: "User not found" });
                    }
                    else {
                        if (validImage == true) {
                            let newQuery = {};
                            if (files.image) {
                                const fileName = files.image.path.split(pathSeparator)[3];
                                const imagepath = '/post/images/' + fileName;
                                newQuery.imagepath = imagepath
                                return res.json({
                                    code: 200,
                                    status: true,
                                    message: "Image uploaded successfully",
                                    data: newQuery
                                })
                            }
                            else {
                                return res.json({
                                    code: 402,
                                    status: false,
                                    message: "Please enter atleast one image"
                                })
                            }
                        }
                    }
                })
        }
        else {
            return res.json({
                code: 402,
                status: false,
                message: "Invalid userid given"
            })
        }
    })
}

/**
 * Get user for getting the user which is connected with the socket
 * userId will be get from socket when the user connected to socket
 */
function getUser(userId) {
    return new Promise((resolve, reject) => {
        User.find({
            _id: userId
        }, function (err, userdetail) {
            if (err) {
                console.log("Err in getUser function", err)
            } else {
                console.log("userDetails fetched")
            }
        })
    })
}

/**
 * message saving functionality for saving msg while chatting
 * data will come from socket while send msg
 */
function saveMesage(data) {
    console.log("save message", data);
    msgService.saveMesage(data).then(response => {
        console.log("msg saved",response)
    }).catch(error => {
        console.log("chat not saved", error)
    });
}

/**
 * Fetching msg history for 1-o-1 chat
 * After selecting a particular person in chat list -
 * -user will see the previously done chat with that person.
 */
function message_history(req, resp) {
    var body = req.body ? req.body : {};
    console.log("bpdy---",body);
    
    let page =body.page ? parseInt(body.page) : 1
    let limit = body.limit ? parseInt(body.limit):6

    let skip=[parseInt(page)*limit] - limit
    
    msgService.message_history_fun(body,function(err,response){
       
        if(err)
        {
            resp.json({
                message: err.message,
                status: false,
                code: 402
            })

        }
        else   if (response.length == 0) {
            resp.json({
                code: 200,
                status: true,
                data: [],
                message: "No chat history available.",
            });
        } else {
            
            // console.log(new_total,"new_total")
            if(!body.previous_message_id)
            {
                // var total = response[0].chat.length()
           
            response = _.sortBy(response[0].chat, '_id').reverse();
            
            var total = response.length
            response = response.slice(skip, page * limit);
           
            resp.json({
                code: 200,
                status: true,
                total:total,
                data: response
            });
        }
        else{
           
            var new_total=response[0].chat.length
            console.log(new_total,"new_total")
            var msg_response = response[0].chat.filter(function (el) {
               return el._id==body.previous_message_id
                      
            });


            var previous_msg = response[0].chat.filter(function(el)
            {
                return el.created_on < msg_response[0].created_on 
                && el._id != msg_response[0]._id
            })
           
     
            previous_msg.sort(function(a,b) {
            
                return new Date(b.created_on) - new Date(a.created_on)

            })

     
          
            // console.log(previous_msg,"previous_msg")
            var total = previous_msg.length
            previous_msg = previous_msg.slice(skip, page * limit)
            resp.json({
                code: 200,
                status: true,
                total:new_total,
                data: previous_msg
            });


        }
    }

    });

    // return;
    // msgService.message_history_fun(body).then(response => {
    //     if (response.length == 0) {
    //         resp.json({
    //             code: 200,
    //             status: true,
    //             data: [],
    //             message: "No chat history available.",
    //         });
    //     } else {
            
    //         // console.log(new_total,"new_total")
    //         if(!body.previous_message_id)
    //         {
    //             // var total = response[0].chat.length()
           
    //         response = _.sortBy(response[0].chat, '_id').reverse();
    //         var total = response.length
    //         response = response.slice(skip, page * limit);
           
    //         resp.json({
    //             code: 200,
    //             status: true,
    //             total:total,
    //             data: response
    //         });
    //     }
    //     else{
           
    //         var new_total=response[0].chat.length
    //         console.log(new_total,"new_total")
    //         var msg_response = response[0].chat.filter(function (el) {
    //            return el._id==body.previous_message_id
                      
    //         });


    //         var previous_msg = response[0].chat.filter(function(el)
    //         {
    //             return el.created_on < msg_response[0].created_on 
    //             && el._id != msg_response[0]._id
    //         })
           
     

            

    //         previous_msg.sort(function(a,b) {
            
    //             return new Date(b.created_on) - new Date(a.created_on)

    //         })

     
          
    //         // console.log(previous_msg,"previous_msg")
    //         var total = previous_msg.length
    //         previous_msg = previous_msg.slice(skip, page * limit)
    //         resp.json({
    //             code: 200,
    //             status: true,
    //             total:new_total,
    //             data: previous_msg
    //         });


    //     }
    // }
    // }).catch(error => {
    //     resp.json({
    //         message: error.message,
    //         status: false,
    //         code: 400
    //     })
    // });
}

/**
 * Fetching msg list for particular user
 */
function message_list(req, resp) {
    console.log("in msg lit");
    var body = req.body ? req.body : {};
    let page =body.page ? parseInt(body.page) : 1
    let limit = body.limit ? parseInt(body.limit):6

    let skip=[parseInt(page)*limit] - limit
    msgService.message_list(body).then(response => {
        if (response.length == 0) {
            resp.json({
                code: 200,
                status: true,
                data: [],
                message: "No chat available.",
            });
        } else {
            console.log(response,"resp");
            let response2 =[]
           
           response.forEach(function(elem)
           {
               elem.chat.forEach(function(elem1)
               {
                   response2.push(elem1)
               })

           })
           var total = response2.length
           console.log(total,"total")
            // console.log(response2,"result")
            response2 = response2.slice(skip, page * limit)
            resp.json({
                code: 200,
                status: true,
                total:total,
                data: response2
            });
        }
    }).catch(error => {
        resp.json({
            message: error.message,
            status: false,
            code: 400
        })
    });
}