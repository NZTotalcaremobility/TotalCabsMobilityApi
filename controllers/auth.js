'use strict';

var jwt = require('jsonwebtoken'),
    constantsObj = require('../config/constants'),
    drivermodel = require('../model/user'),
    customermodel = require('../model/user');
const { isEmpty } = require('lodash');
const { findoneData, updateOneDocument } = require('../config/common_query');
var constantmessage = require("../config/constants");
const { internalerrorhandler, errorhandler, sucesshandler } = require('../config/utility');
const utility = require("../config/utility");
const moment = require('moment');
const emailtemplate = require('../model/emailtemplate');
var handlebars = require("handlebars");



module.exports = {
    ensureAuthorized: ensureAuthorized,
    login: adminLogin,
    loadCurrentuser: loadCurrentuser,
    register: register
}

function register(req, res) {
    try {
        let body = req.body ? req.body : {};
        customermodel.existCheck(body.email, async function (err, exist) {
            if (err) {
                utility.errorhandler(
                    res,
                    constantmessage.validationMessages.InvalidEmail,
                    ""
                );

            } else if (exist != true) {
                utility.errorhandler(
                    res,
                    constantmessage.validationMessages.emailAlreadyExist,
                    ""
                );
            } else if (exist) {
                var verifyingLink = utility.getEncryptText(
                    Math.random().toString(4).slice(2) + new Date().getTime()
                );

                var userMailData = {
                    email: body.email,
                    name: body.name,
                    verifying_token: verifyingLink,
                };
                emailtemplate
                    .findOne({ findBy: "register_verify" })
                    .exec(async (err, emaildataresult) => {
                        if (err) {
                            throw new Error(err);
                        } else if (emaildataresult) {
                            let selectedSubject = emaildataresult.subject;
                            let selectedContent = emaildataresult.content;
                            const template = handlebars.compile(
                                selectedContent.replace(/\n|\r/g, "")
                            );
                            let url =
                                constantmessage.adminURL.url +
                                "/verifyAccount/" +
                                userMailData.verifying_token;
                            let message = template({ URL: url, USERNAME: userMailData.name });
                            utility.sendmail(
                                userMailData.email,
                                selectedSubject,
                                message,
                                async (err, finalresult) => {
                                    if (err) {
                                        throw new Error(err);
                                    } else if (finalresult) {
                                        let usersave = {
                                            email: body.email,
                                            password: body.password,
                                            verifyingToken: userMailData.verifying_token,
                                            name: body.name,
                                            // lastName: body.lastName,
                                            phonenumber: body.phonenumber,
                                            userType: 'SubAdmin',
                                            permissions: body.permissions
                                        };

                                        let saveobj = new customermodel(usersave);
                                        await saveobj.save()
                                        utility.sucesshandler(res, 'Registered successfully,please verfiy your email to login')
                                        console.log("usersave", saveobj);

                                    }
                                }
                            );
                        }
                    });
            }
        });
    } catch (e) {
        console.log(e, "error");
        utility.internalerrorhandler(res);
    }
}


function adminLogin(req, res) {

    let login = async () => {
        const { body } = req
        console.log("body--", body);
        let email = body.email;
        var checkuser = await customermodel.findOne({ email: email })
        if (checkuser === null) {
            return Promise.reject(constantmessage.messages.Emailnotexist)
        }
        console.log('checkuser', checkuser)
        let startTime = checkuser.lastloginTime ? checkuser.lastloginTime : new Date().toLocaleTimeString()
        let endTime = new Date().toLocaleTimeString();
        console.log("tart--", startTime);
        console.log('enddd--', endTime);
        let type = checkuser.userType
        startTime = moment(startTime, 'hh:mm:ss a')
        endTime = moment(endTime, 'hh:mm:ss a')
        //var duration1 = endTime.diff(startTime, 'hours')

        var duration = (moment(endTime).diff(startTime, 'hours'));
        // var hours = parseInt(duration.asHours());
        console.log("duration--", duration);

        console.log("check--", checkuser);
        if (type !== "Admin" && type !== 'SubAdmin') {
            return Promise.reject(constantmessage.messages.Emailnotexist)
        }

        return new Promise((resolve, reject) => {
            if (isEmpty(body.email) || isEmpty(body.password)) {
                reject(constantmessage.validationMessages.requiredFieldmissing);
            } else {
                var jwtToken = null;
                let email = body.email;
                var userdata = {
                    email: email,
                    isDeleted: false,
                };
                customermodel.findOne(userdata).exec(function (err, userInfo) {
                    if (err) {
                        reject("Error");
                    }
                    userdata = userInfo
                    console.log("data--", userdata);
                    if (userInfo != null) {
                        if (userInfo.status !== true) {
                            reject(constantmessage.messages.accountActivation);
                        }
                        // else if (info.isDeleted == true) {

                        //     reject(constantmessage.messages.accountDeleted)
                        // }
                        else if (userInfo.isEmailVerified == false) {
                            reject(constantmessage.messages.Emailnotverified);
                        } else {
                            userInfo.comparePassword(body.password, async function (
                                err,
                                isMatch
                            ) {
                                if (isMatch && !err) {
                                    var params = {
                                        id: userInfo._id,
                                    };
                                    jwtToken = jwt.sign(
                                        params,
                                        constantmessage.jwtsecret.secret,
                                        {
                                            expiresIn: "4320h",
                                        },

                                    );

                                    const userid = userdata._id
                                    const _id = userid
                                    let lastloginTime = ''

                                    let logindata = await findoneData(customermodel, _id)
                                    let lastlogintime = logindata.data.lastloginTime
                                    let lastupdateloginDate = logindata.data.updatedAt;
                                    lastupdateloginDate = lastupdateloginDate.getDate();
                                    console.log("date---", lastupdateloginDate);
                                    lastloginTime = new Date().toLocaleTimeString();

                                    // console.log("login--",logintime);
                                    var infoData = {};
                                    var dataObj = {}
                                    let condition = {

                                        _id: userInfo._id
                                    }


                                    dataObj.lastloginTime = lastloginTime
                                    let endTime = new Date().toLocaleTimeString();
                                    console.log("endtime--", endTime);
                                    //                  console.log("dataobj---",dataObj);

                                    let update = await updateOneDocument(customermodel, condition, dataObj);
                                    console.log("update---", update);



                                    //  // let logindata = await queryy.findoneData(customermodel,_id)
                                    //   let startTime = logindata.data.lastloginTime
                                    //   let startTime = logindata.data.lastloginTime
                                    //   console.log("login---",startTime);

                                    if (!userInfo.deviceInfo) {
                                        userInfo.deviceInfo = [];
                                    }

                                    var params = {
                                        id: userInfo._id,
                                    };
                                    jwtToken = jwt.sign(
                                        params,
                                        constantmessage.jwtsecret.secret,
                                        {
                                            expiresIn: "4320h",
                                        }
                                    );

                                    var infoData = {};
                                    var index = "index";

                                    if (userInfo.deviceInfo.length > 0) {
                                        for (var i in userInfo.deviceInfo) {
                                            if (
                                                userInfo.deviceInfo[i].deviceToken != body.deviceToken
                                            ) {
                                                index = i;
                                                break;
                                            } else {
                                                index = i;
                                                break;
                                            }
                                        }
                                    }

                                    if (index != "index") {
                                        userInfo.deviceInfo[index].access_token = jwtToken;
                                        userInfo.deviceInfo[index].deviceToken = body.deviceToken;
                                        userInfo.deviceInfo[index].deviceType = body.deviceType;
                                    } else {
                                        // userInfo.deviceInfo[index].access_token = jwtToken;
                                        // userInfo.version = req.body.version
                                        userInfo.deviceInfo.push({
                                            access_token: jwtToken,
                                            deviceType: "IOS",
                                            deviceToken: body.deviceToken,
                                        });
                                    }

                                    customermodel
                                        .findOneAndUpdate(
                                            { _id: userInfo._id },
                                            {
                                                $set: { deviceInfo: userInfo.deviceInfo },
                                            }
                                        )
                                        .exec((err, userInfoResult) => {
                                            if (!err) {
                                                utility.removeExpiredTokenOfUser(userInfo);
                                                resolve(infoData);
                                            }
                                        });
                                    let imagefile = null;
                                    let companyname = null;
                                    let email = null;
                                    let phonenumber = 0;
                                    let key = 0;
                                    let logintime = '';
                                    if (userInfo.lastloginTime != 0) {
                                        logintime = userInfo.lastloginTime
                                    }

                                    if (userInfo.phonenumber != 0) {
                                        phonenumber = userInfo.phonenumbers
                                    }

                                    if (userInfo.email != null) {
                                        email = userInfo.email
                                    }

                                    if (userInfo.companyname != null) {
                                        companyname = userInfo.companyname
                                    }

                                    if (userInfo.imagefile != null) {
                                        imagefile = userInfo.imagefile
                                    }
                                    if (userInfo.key != null) {
                                        key = userInfo.key
                                    }

                                    infoData.token = userInfo.userType + "_Bearer " + jwtToken;
                                    infoData.userType = userInfo.userType;
                                    infoData.userId = userInfo._id;
                                    infoData.email = userInfo.email ? userInfo.email : "";
                                    infoData.name = userInfo.name ? userInfo.name : "";
                                    infoData.phonenumber = userInfo.phonenumber ? userInfo.phonenumber : "";
                                    infoData.imagefile = imagefile ? userInfo.imagefile : "";;
                                    infoData.companyname = userInfo.companyname ? userInfo.companyname : "";
                                    infoData.key = userInfo.key ? userInfo.key : "";
                                    infoData.logintime = userInfo.lastloginTime ? userInfo.lastloginTime : "";
                                    infoData.permissions = userInfo.permissions ? userInfo.permissions : [];
                                    // localStorage.setItem(jwtToken);
                                    resolve(infoData);
                                } else {
                                    reject(constantmessage.validationMessages.wrongPassword);
                                }
                            });
                        }
                    } else {
                        reject(constantmessage.messages.Emailnotexist);
                    }
                });
            }
        });
    };


    let callinglogin = async () => {
        try {
            let userLogin = await login();
            if (userLogin) {
                sucesshandler(
                    res,
                    constantmessage.messages.loginSuccess,
                    userLogin
                );
            }
        } catch (e) {
            console.log('error', e)
            if (e == "Error") {
                internalerrorhandler(
                    res,
                    constantmessage.validationMessages.intenalError
                );
            } else {
                errorhandler(res, e);
            }
        }
    };

    callinglogin();
}

function loadCurrentuser(req, res) {
    const userInfo = req.user
    let infoData = {}
    infoData.userType = userInfo.userType;
    infoData.userId = userInfo._id;
    infoData.email = userInfo.email ? userInfo.email : "";
    infoData.name = userInfo.name ? userInfo.name : "";
    infoData.phonenumber = userInfo.phonenumber ? userInfo.phonenumber : "";
    infoData.imagefile = userInfo.imagefile ? userInfo.imagefile : "";
    if (userInfo.companyname) infoData.companyname;
    infoData.permissions = userInfo.permissions;

    sucesshandler(
        res,
        "success",
        infoData
    );
}

function ensureAuthorized(req, res, next) {

    var unauthorizedJson = { code: 403, status: false, message: 'Unauthorized User or session expired' };
    console.log(req.headers);
    if (req.headers.authorization) {
        console.log("in if",req.headers.authorization);
        var token = req.headers.authorization;

        var splitToken = token.split(' ');

        try {
            token = splitToken[1];
            // console.log(splitToken[0],"splitToken[0]")

            var decoded = jwt.verify(token, constantsObj.jwtsecret.secret);
            console.log(decoded, 'decoded')
            if (splitToken[0] == 'Admin_Bearer') {
                console.log(req.headers.authorization)
                req.user = decoded;
                customermodel.findById(req.user.id).exec(function (err, admin) {
                    if (err) {
                        res.json(unauthorizedJson);
                    }

                    else if (admin) {
                        req.user = admin
                        next();

                    }

                });
            }
            else if (splitToken[0] == 'SubAdmin_Bearer') {
                console.log(req.headers.authorization)
                req.user = decoded;
                customermodel.findById(req.user.id).exec(function (err, admin) {

                    if (err) {
                        res.json(unauthorizedJson);
                    }

                    else if (admin) {
                        req.user = admin
                        next();

                    }

                });
            }
            else if (splitToken[0] == 'Driver_Bearer') {

                console.log('its reached at driver')
                console.log({ deviceInfo: { $elemMatch: { access_token: token } }, isDeleted: false, status: false }, 'name');
                drivermodel.findOne({ deviceInfo: { $elemMatch: { access_token: token } }, isDeleted: false, status: false }, "name").exec(function (err, user) {
                    console.log({ err, user });
                    if (err || !user) {

                        res.json(unauthorizedJson);
                    } else {
                        req.user = user;
                        next();
                    }
                });
            } else if (splitToken[0] == 'User_Bearer') {
                req.user = decoded;
                console.log(req.user, "req.user")
                customermodel.findById(req.user.id).exec(function (err, user) {

                    if (err) {
                        res.json(unauthorizedJson);
                    }

                    else {

                        req.user = user
                        next();

                    }
                    console.log('its reached at driver')

                })
            }

            else {

                res.json(unauthorizedJson);
            }
        } catch (err) {

            console.log('err', err);
            res.json(unauthorizedJson);
        }
    } else {
        res.json(unauthorizedJson);
    }
}
