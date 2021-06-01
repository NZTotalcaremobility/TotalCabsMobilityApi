'use strict';
/*
 * Utility - utility.js
 * Author: smartData Enterprises
 * Date: 03 September 2020
 */

var constantsObj = require('./constants');
let client = require('twilio')(constantsObj.twilio.accountSid,constantsObj.twilio.authToken);

var crypto=require('crypto')
var mongoose = require('mongoose');

var nodemailer = require('nodemailer');
var fs = require("fs");
var path = require('path');
var config = require('../config/config.js')
var nodemailer = require('nodemailer');
var drivermodel=require('../model/user')
var async = require('async');
// var FCM = require('fcm-node');
// var apn = require('apn');
// process.env.DEBUG = 'apn';
// var shortid = require('shortid');
let algorithm = constantsObj.config.cryptoAlgorithm
let password = constantsObj.config.cryptoPassword;
// var co = require("co");
var jwt = require('jsonwebtoken');
// var serverKey = constantsObj.config.FCM_KEY;
// var fcm = new FCM(serverKey);
const IV_LENGTH=16;
var utility = {};

utility.errorhandler=(res,message)=>{

 
    return res.json({code:402,message:message})

}

utility.internalerrorhandler=(res)=>{

    return res.json({code:500,message:"Something went wrong,please try again later"})

}

utility.notfoundResponse=(res)=>{

    return res.json({code:404,message:"Not found"})

}

utility.sucesshandler=(res,message,data)=>{
    if(message=="")
    {
        message="Success"
    }

return res.json({code:200,message:message,data})
}
utility.getEncryptText = function(text) {

    var cipher = crypto.createCipher(algorithm, password);
    text = cipher.update(text, 'utf8', 'hex');
    text += cipher.final('hex');
    return text;
}

utility.getDecryptText = function(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var text = decipher.update(text, 'hex', 'utf8')
    text += decipher.final('utf8');
    return text;
}
utility.readTemplateSendMail = function(to, subject, userData, templateFile, callback) {
    console.log(userData,'userData')
     var filePath = path.join(__dirname, '/email_templates/' + templateFile + '.html');
     fs.readFile(filePath, {
         encoding: 'utf-8'
     }, function(err, data) {
         if (!err) {
             var template = data
                 .replace(/{baseUrl}/g, constantsObj.weburl.url)
                 .replace(/{email}/g, userData.email)
                 .replace(/{username}/g,userData.name)
                 .replace(/{verifying_token}/g, userData.verifying_token)
                 .replace(/{date}/g,userData.date)
                 .replace(/{prevtime}/g,userData.prevtime)
                 .replace(/{time}/g,userData.time)
 
                 
           
 // console.log(" subject -------",subject," template ---------", template)
             utility.sendmail(userData.email, subject, template, function(mailErr, resp) {
                 if (mailErr)
                     callback(mailErr);
                 else
                     callback(null, true);
             });
         } else {
             callback(err);
         }
     });
 }

// utility.readTemplateSendMail = function(to, subject, userData, templateFile, callback) {
   
//     var filePath = path.join(__dirname, '/email_templates/' + templateFile + '.html');
//     fs.readFile(filePath, {
//         encoding: 'utf-8'
//     }, function(err, data) {
//         if (!err) {
//             var template = data
//                 .replace(/{baseUrl}/g, config.webUrl)
//                 .replace(/{email}/g, userData.email)
//                 .replace(/{username}/g, utility.capitalize(userData.name))
//                 .replace(/{otp}/g,userData.otp)
//                 .replace(/{verifying_token}/g, userData.verifying_token)
//                 .replace(/{download_token}/g, userData.download_token)
               
// console.log(" subject -------",subject," template ---------", template)
//             utility.sendmail(userData.email, subject, template, function(mailErr, resp) {
//                 if (err)
//                     callback(mailErr);
//                 else
//                     callback(null, true);
//             });
//         } else {
//             callback(err);
//         }
//     });
// }
utility.AdminreadTemplateSendMail = function(to, subject, userData, templateFile, callback) {
    var filePath = path.join(__dirname, '/email_templates/' + templateFile + '.html');
    fs.readFile(filePath, {
        encoding: 'utf-8'
    }, function(err, data) {
        if (!err) {
            var template = data
                .replace(/{baseUrl}/g, config.webUrl)
                .replace(/{email}/g, userData.email)
                .replace(/{username}/g, utility.capitalize(userData.name))
               
                .replace(/{verifying_token}/g, userData.token)
                
               
console.log(" subject -------",subject," template ---------", template)
            utility.sendmail(userData.email, subject, template, function(mailErr, resp) {
                if (err)
                    callback(mailErr);
                else
                    callback(null, true);
            });
        } else {
            callback(err);
        }
    });
}

utility.readTemplateSendMailSubscribe = function(to, subject, userData, templateFile, callback) {
    var filePath = path.join(__dirname, '/email_templates/' + templateFile + '.html');
    fs.readFile(filePath, {
        encoding: 'utf-8'
    }, function(err, data) {
        if (!err) {
            var template = data
                .replace(/{baseUrl}/g, config.webUrl)
                .replace(/{email}/g, userData.email)

            utility.sendmail(userData.email, subject, template, function(mailErr, resp) {
                if (err)
                    callback(mailErr);
                else
                    callback(null, true);
            });
        } else {
            callback(err);
        }
    });
}

//Feedback
utility.readTemplateSendFeedback = function(to, subject, userData, templateFile, callback) {
    var filePath = path.join(__dirname, '/email_templates/' + templateFile + '.html');
    fs.readFile(filePath, {
        encoding: 'utf-8'
    }, function(err, data) {
        if (!err) {
            var template = data
                .replace(/{baseUrl}/g, config.webUrl)
                .replace(/{email}/g, userData.email)
                .replace(/{firstname}/g, utility.capitalize(userData.firstname))
                .replace(/{lastname}/g, utility.capitalize(userData.lastname))
                .replace(/{message}/g, utility.capitalize(userData.message))
                
            utility.sendFeedbackmail(userData.email, subject, template, function(mailErr, resp) {
                if (err)
                    callback(mailErr);
                else
                    callback(null, true);
            });
        } else {
            callback(err);
        }
    });
}


utility.sendmail = function(to, subject, message, callback) {
    var smtpTransport = nodemailer.createTransport( {
        service: 'GMAIL',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
       
        auth: {
            user: 'sdei.sddns@gmail.com',
            pass: 'ivqozmonmqshhbhs'
        }
    });


    var mailOptions = {
        to: to,
        from: 'sdei.sddns@gmail.com',
        cc: 'sdei.sddns@gmail.com',
        replyTo : 'sdei.sddns@gmail.com',
        subject: subject,
        html: message
    };
    smtpTransport.sendMail(mailOptions, function(err) {
        if (err) {
            console.log(err, 'mail send Error');
            callback(err);
        } else {
            console.log('info', 'An e-mail has been sent to  with further instructions.');
            callback(null, true);
        }
    });
}

//Feedback...................

// utility.sendFeedbackmail = function(to, subject, message, callback) {

//     var smtpTransport = nodemailer.createTransport("SMTP", {
//         service: 'GMAIL',
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//             user: '',
//             pass: 'Smartdata1'
//         }
//     });

//     var mailOptions = {
//         to: to,
//         from: 'info@getmydaily.com',
//         cc: 'info@getmydaily.com',
//         bcc:'admin.ryan@yopmail.com',
//         replyTo : 'info@getmydaily.com.',
//         subject: subject,
//         html: message
//     };
//     smtpTransport.sendMail(mailOptions, function(err) {
//         if (err) {
//             console.log(err, 'mail send Error');
//             callback(err);
//         } else {
//             console.log('info', 'An e-mail has been sent to  with further instructions.');
//             callback(null, true);
//         }
//     });
// }

utility.uploadImage = function(imageBase64, imageName, callback) {
    if (imageBase64 && imageName) {
    
        var timestamp = Number(new Date()); // current time as number
        var filename = +timestamp + '_' + imageName;
        var imagePath = "./public/assets/uploads/" + filename;
        fs.writeFile(path.resolve(imagePath), imageBase64, 'base64', function(err) {
            if (!err) {
                callback(config.webUrl + "/assets/uploads/" + filename);
            } else {
                callback(config.webUrl + "/assets/images/default-image.png");
            }
        });
    } else {
        callback(false);
    }
}
utility.fileExistCheck = function(path, callback) {
    fs.exists(path, function(err) {
        if (err) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

utility.validationErrorHandler = function(err) {
    //console.log(JSON.stringify(err),"dads")
    var errMessage = constantsObj.validationMessages.internalError;
    if (err.errors) {
        //console.log(errors,"sdaaaaaaaaaaaaaaaa")
        for (var i in err.errors) {
            errMessage = err.errors[i].message;
            //console.log(err.errors[i].message,"error!!!!!!!!!!!!!!!!!!")
        }
    }
    return errMessage;
}




utility.sendPushNotification = function (message) {

    sendFcm(message);
}
function sendFcm(message) {
    
    fcm.send(message, function (err, response) {
        if (err) {
           console.log("Something has gone wrong!",err)
        } else {
            console.log(response)
            console.log("Successfully sent with response");
        }
    });

}



var apnError = function(err) {
    console.log("APN Error:", err);
}

try{
    var options = {
        // "cert": path.resolve(__dirname + "/../../config/pem/prod/NeoBookCertR.pem"),//Production
        // "key": path.resolve(__dirname + "/../../config/pem/prod/NeoBookKeyR.pem"),//Production
        "cert": path.resolve(__dirname + "/../../config/pem/dev/NeoBookCertR.pem"),//Development
        "key": path.resolve(__dirname + "/../../config/pem/dev/NeoBookKeyR.pem"),//Development
        "passphrase": "123456",
        "gateway": "gateway.sandbox.push.apple.com",//Development
        // "gateway": "gateway.push.apple.com",//Production
        "port": 2195,
        "enhanced": true,
        "cacheLength": 5
    };
    options.errorCallback = apnError;
} catch(e){
    console.log('error', e);
}
  




utility.sendSms = function (mobile, smsText, cb) {
   
      client.messages.create({
          body: smsText,
          
          to: mobile,
          from: "+17206056274",
        }).then(function(result) {
          console.log('User notified');
          cb(null, result);
        }).catch(function(err) {
          console.error('Could not notify User');
          console.error(err);
          cb(err, null);
        });
    // });
  // });
}





utility.fileUpload = function(imagePath, buffer) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path.resolve(imagePath), buffer, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}





utility.removeExpiredTokenOfUser = function(user) {
    if (user.deviceInfo.length > 0) {
        var deviceArr = [];
        async.eachSeries(user.deviceInfo, function(result, callback) {
            try {
                var decoded = jwt.verify(result.access_token, constantsObj.config.secret);
                deviceArr.push(result);
                callback(null);
            } catch (err) {
                callback(null);
            }
        }, function(err) {
            user.deviceInfo = deviceArr;

            drivermodel.findByIdAndUpdate(user._id,{$set:{deviceInfo:deviceArr}});
        });
    }
}

utility.capitalize = function(input){
    return input.charAt(0).toUpperCase() + input.substr(1).toLowerCase();
}


utility.markAsReaded = function(req) {
    try{
            Chat.find({ 
                deleted: false, 
                status: 'Pending', 
                '$or': [{'buyer_id': mongoose.Types.ObjectId(req.user._id)}, {'seller_id': mongoose.Types.ObjectId(req.user._id)}] 
            })
            .then(function(data) {
                if (data.length > 0) {
                    async.eachSeries(data, function(result, callback) {
                        if (!result.readedBy) {
                            result.readedBy = [];
                        }
                        if (result.readedBy.length > 0 && result.readedBy.length < 2) {
                            var exist = false;
                            for (var i = 0; i < result.readedBy.length; i++) {
                                if (result.readedBy[i].toString() == req.user._id.toString()) {
                                    exist = true;
                                }
                                if (!exist) {
                                    result.readedBy.push(req.user._id.toString());
                                    result.save();
                                }
                            }
                        } else {
                            if (result.readedBy.length == 0) {
                                result.readedBy.push(req.user._id.toString());
                                result.save();
                            }
                        }
                        callback(null);
                    }, function(err) {

                    });
                }
            }).catch(function(err){

            });
    } catch(e) {
        console.log('Error', e);
    }
}


// sendmail with attachment

utility.sendmailWithAttachment = function(to, subject, message, attachment, callback) {
    var smtpTransport = nodemailer.createTransport( {
        service: 'GMAIL',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'sdei.sddns@gmail.com',
            pass: 'ivqozmonmqshhbhs'
        }
    });

    var mailOptions = {
        to: to,
        from: 'sdei.sddns@gmail.com',
        cc: 'sdei.sddns@gmail.com',
        replyTo : 'sdei.sddns@gmail.com',
        subject: subject,
        html: message,
        attachments: attachment
    };

    smtpTransport.sendMail(mailOptions, function(err) {
        if (err) {
            console.log(err, 'mail send Error');
            callback(err);
        } else {
            console.log('info', 'An e-mail has been sent to  with further instructions.');
            callback(null, true);
        }
    });
}


module.exports = utility;
