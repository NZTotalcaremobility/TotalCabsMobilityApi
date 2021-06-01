var mongoose = require("mongoose");
var _ = require('lodash')
var constant = require('../config/constants')
const utility = require('../config/utility')
const moment = require('moment')
const transactionmodel = require('../model/tansaction');
const driverModal = require('../model/user');
const jobModal = require('../model/driverstatus');
const companynmodel = require('../model/company');
const query = require('../config/common_query')
const { createInvoice, mailToInvoice } = require("../lib/utils");
const { object } = require('underscore');
const { isEmpty, conforms } = require('lodash');
var FCM = require("fcm-node");
const cron = require("node-cron")
var constantmessage = require("../config/constants");
const client = require("twilio")(
    constantmessage.twilio.accountSid,
    constantmessage.twilio.authToken
);



var serverKey =
    "AAAAe2dFb3k:APA91bH1sVSzIm2RcC3TehkXMxTrzlJjATuHvCO4VsM2CyU8azuF_F6n89I9OlAKzRKI15TmlElBIjfznAma4OtlrsJzf3Hs_fSRHvrK7YAyYf2m3R-orykYtD28HnXDaCOQKByJKdLZ";
var fcm = new FCM(serverKey);



const filte = {
    startDate: new Date(moment().subtract(60, 'day')),
    endDate: new Date(moment.now()),
}

const sendScheduledInvoice = (req, res) => {
    const sendScheduled_Invoice = async () => {
        try {
            const { params } = req;

            let result = await transactionmodel.aggregate([
                {
                    $match: {
                        type: 'Pin',
                        createdAt: { $gte: filte.startDate, $lt: filte.endDate }
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $lookup: {
                        from: "driverstatuses",
                        localField: "jobid",
                        foreignField: "_id",
                        as: "jobid"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "jobid.driverdetails",
                        foreignField: "_id",
                        as: "driverdetails"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "jobid.riderdetails",
                        foreignField: "_id",
                        as: "riderdetails"
                    }
                },
                {
                    $lookup: {
                        from: "companies",
                        localField: "pin",
                        foreignField: "key",
                        as: "company"
                    }
                },
                {
                    $group: {
                        "_id": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        "data": { "$push": "$$ROOT" },
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ])

            if (!isEmpty(result)) {
                let count = 0;

                let final = {};

                result.forEach(element => {
                    const { _id: date, data } = element;
                    final = { ...final, [date]: {} };
                    let selectedCompany = '';
                    let invoiceArray = {};
                    console.log('sdfsd', element)

                    data.forEach((e) => {
                        const { type, status, fare, tax, Amount, jobid, _id: transactionID, user, driverdetails, company } = e;
                        const { pickupLocation, dropLocation, distance, dateOfJourney, pickUptime } = jobid[0]

                        if (invoiceArray[company[0]._id]) {
                            invoiceArray[company[0]._id].items.push({
                                driverName: driverdetails[0].name ? driverdetails[0].name : '',
                                userName: user[0].name ? user[0].name : '',
                                pickupLocation: pickupLocation.address ? pickupLocation.address : '',
                                dropLocation: dropLocation.address ? dropLocation.address : '',
                                distance: distance ? distance : 0,
                                Amount: fare ? fare : 0,
                            });

                            invoiceArray[company[0]._id].subtotal += fare ? Number(fare) : 0;
                            invoiceArray[company[0]._id].tax += tax ? Number(tax) : 0;
                            invoiceArray[company[0]._id].total += Amount ? Number(Amount) : 0;
                            invoiceArray[company[0]._id].paid += status === 'completed' ? Number(Amount) : 0;
                            invoiceArray[company[0]._id].due += status !== 'completed' ? Number(Amount) : 0;

                        } else {
                            selectedCompany = e.company[0]._id;

                            invoiceArray[company[0]._id] = {
                                items: [{
                                    driverName: driverdetails[0].name ? driverdetails[0].name : '',
                                    userName: user[0].name ? user[0].name : '',
                                    pickupLocation: pickupLocation.address ? pickupLocation.address : '',
                                    dropLocation: dropLocation.address ? dropLocation.address : '',
                                    distance: distance ? distance : 0,
                                    Amount: fare ? Number(fare) : 0,

                                }]
                            };

                            invoiceArray[company[0]._id].user = {
                                name: company[0].name ? company[0].name : '',
                                address: `${company[0].city ? company[0].city + ',' : ''} ${company[0].state ? company[0].state + ',' : ''} ${company[0].postcode ? company[0].postcode + ',' : ''}`,
                                postal_code: company[0].postalcode ? company[0].postalcode : '',
                                city: company[0].city ? company[0].city : '',
                                state: company[0].state ? company[0].state : '',
                                county: company[0].county ? company[0].county : ''
                            }

                            invoiceArray[company[0]._id].inVoiceDate = dateOfJourney ? dateOfJourney : '';
                            invoiceArray[company[0]._id].paymentType = type ? type : '';
                            invoiceArray[company[0]._id].subtotal = fare ? fare : 0;
                            invoiceArray[company[0]._id].tax = tax ? tax : 0;
                            invoiceArray[company[0]._id].total = Amount ? Amount : 0;
                            invoiceArray[company[0]._id].paid = status === 'completed' ? Number(Amount) : 0;
                            invoiceArray[company[0]._id].due = status !== 'completed' ? Number(Amount) : 0;
                            invoiceArray[company[0]._id].invoice_nr = transactionID;
                            invoiceArray[company[0]._id].email = company[0].email;
                        }
                    })

                    Object.keys(invoiceArray).forEach((invoice) => {
                        const location = createInvoice(invoiceArray[invoice], invoice);
                        console.log('file', location, invoiceArray[invoice])
                        mailToInvoice(invoiceArray[invoice].email, location, (err, response) => {
                            if (err) console.error("error", response);
                            console.log("success", constant.messages.invoiceMailSent, {});
                        })
                    })


                    mailToInvoice(userEmail, location, (err, response) => {
                        if (err) console.error("error", response);
                        console.log("success", constant.messages.invoiceMailSent, {});
                    })
                });
            }
        }
        catch (e) {
            console.log('hherhee sis issue --   -  -', e)
        }
    }
    sendScheduled_Invoice()
}


const checkLoggedStatus = (req, res) => {
    const _checkLoggedStatus = async () => {
        try {
            var driverList = await query.findData(driverModal, { userType: 'Driver', onlinestatus: 1 })
            console.log('direvrwe', driverList)
            if (driverList.error) throw { message: "somthing Went Wrong!" }
            else if (driverList.status) {
                const { data } = driverList;
                const totalIds = []
                let count = 0;
                if (!isEmpty(data)) {
                    data.forEach(element => {
                        const { deviceInfo, _id, name } = element;

                        const [{ deviceType, deviceToken }] = deviceInfo
                        // if (!deviceType || !deviceToken) return false

                        let firstLoginTime = element.firstLoginTime ? element.firstLoginTime : null
                        let duration = moment.duration(moment(firstLoginTime).diff()).asHours();
                        if (Math.abs(duration) > 13 && Math.abs(duration) <= 23) {

                            totalIds.push(mongoose.Types.ObjectId(_id));
                            count++;
                            if (deviceType == "Android") {
                                console.log("in android");
                                var message = {
                                    to: deviceToken,
                                    data: {
                                        message: "Driver has Crossd time limit! logouting...",
                                        title: "Logged Status",
                                        driverId: _id,
                                        driverName: name,
                                        firstLoginTime: firstLoginTime,
                                        action: "logout",
                                    },
                                };
                                console.log("mess--", message);
                                fcm.send(message, function (err, pushresponse) {
                                    if (err) {
                                        console.log("notifications not send", err);
                                    } else {
                                        console.log(
                                            "notifications sent to devices",
                                            pushresponse
                                        );
                                    }
                                });
                            } else if (deviceType == "IOS") {
                                // console.log(deviceToken, "deviceToken+deviceToken");
                                console.log(deviceToken, "deviceToken+deviceToken");
                                var message = {
                                    to: deviceToken,
                                    notification: {
                                        badge: "1",
                                        // "name": result2.name,
                                        body: "Logged Status",
                                        sound: "default",
                                        data: {
                                            message: "Driver has Crossd time limit! logouting...",
                                            title: "Logged Status",
                                            // "body":`${data.sender} send you a message`,
                                            driverId: _id,
                                            driverName: name,
                                            firstLoginTime: firstLoginTime,
                                            action: "RideRequest",
                                        },
                                    },
                                };
                                fcm.send(message, function (err, pushresponse) {
                                    if (err) {
                                        console.log("notifications not send", err);
                                    } else {
                                        console.log(
                                            "notifications sent to devices",
                                            pushresponse
                                        );
                                    }
                                });
                            } else {
                                console.log("Device not found");
                            }
                        }
                    });
                    await query.updateAllDocument(driverModal, { _id: { $in: totalIds } }, { deviceInfo: [], onlinestatus: "0" })
                    console.log("notification send success", { count: count })
                }
            } else {
                console.log("notification failed count", { count: count })
            }

        } catch (error) {
            console.log("something went wrong")
            console.log(error)

        }
    }
    _checkLoggedStatus()
}

function notificationBefore15(req, res) {
    console.log("in notifi-----------------------?");
    _notificationBefore15 = async () => {
        try {
            let condition = {};
            condition = {
                $or: [
                    { tripstatus: 'Upcoming' },
                    { tripstatus: null }],

                $and: [{
                    $or: [{
                        notifiactionPre15: false
                    },
                    {
                        notifiactionPre15: null
                    }]
                }]
            }

            var response = await query.findData(jobModal, condition, {}, { created_at: 1 }, 'user driverdetails');
           // console.log("resp log--",response);
            if (response.error) { }
            else if (response.status) {
                if (!isEmpty(response.data)) {
                    let count = 0;
 
                    response.data.forEach(element => {
                       // console.log("in element");
                        if (element.dateOfJourney && element.pickUptime) {
                            // format date into DD-MM-YYYY
                            let date = moment(element.dateOfJourney).format('DD-MM-yyyy');
                            //console.log("date",date);
                            // count the time diffenrciete
                            let picktime =element.pickUptime
                           // console.log({picktime});
                            let curre= new Date()
                            curre =curre.toLocaleTimeString()
                            // curre =curre.split(':')
                            // curre =curre[0]+":"+curre[1]
                            //console.log({curre});
                          //  curre = curre.minutes();
                          picktime= moment(picktime,'hh:mm').format('hh:mm')
                          //console.log({picktime});
                          curre = moment(curre,'hh:mm').format('hh:mm')
                           //console.log({curre});
                          // var finalTime = curre.diff(picktime, 'hours')
                          // var finalTime = moment(picktime).diff(curre, "minutes");
                         // var finalTime=(moment(curre).diff(picktime, 'hours'));
            
                        // var hours = parseInt(finalTime.asHours());
                        // console.log({hours});
                            let finalTime = moment.duration(moment(picktime,'hh:mm').diff(moment(curre,'hh:mm'))).asMinutes()
                            // convert time diff into minutes
                            //console.log({finalTime});
                            //finalTime = finalTime.minutes();
                           // console.log("time---",finalTime);
                            if (Number(finalTime) >= 0 && Number(finalTime) <= 15) {
                                console.log("in final time");
                                const { user, driverdetails,response, ...rest } = element;
                                console.log({rest});
                                if (user && driverdetails) {

                                    const { deviceInfo: userDeviceInfo } = user;

                                    const { deviceInfo: driverDeviceInfo } = driverdetails;

                                    // making notification for user
                                    if (!isEmpty(userDeviceInfo)) {
                                        console.log("in device info-------------------");
                                        var [{ deviceType: userDeviceType, deviceToken: userDeviceToken }] = userDeviceInfo;
                                        console.log("deviceToken--"+userDeviceToken);
                                        if (userDeviceType == "Android") {
                                            var message = {
                                                to: userDeviceToken,
                                                data: {
                                                    message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                    title: "Ride Information",
                                                    pickuptime:element.pickUptime,
                                                    fare:element.fare,
                                                    user_name:user.name,
                                                    totalspent:"",
                                                    phonenumber:user.phonenumber,
                                                    usertype:user.userType,
                                                    dropLocation: {
                                                        longitude:
                                                        element.dropLocation.coordinates[0],
                                               latitude:
                                               element.dropLocation.coordinates[1],
                                               address: element.dropLocation.address,
                                                      },
                                                    lasttrip:"",
                                                    pickupLocation:{
                                                        longitude:
                                                                 element.pickupLocation.coordinates[0],
                                                        latitude:
                                                        element.pickupLocation.coordinates[1],
                                                        address: element.pickupLocation.address,
                                                    },
                                                    jobtype:"DispatchJob",
                                                    jobid:element._id,
                                                    totaltrips:"",
                                                    riderimage:user.imagefile,
                                                    riderrating:"",
                                                    Eta:"",
                                                    user_id:user._id,
                                                    dateOfJourney:element.dateOfJourney,
                                                    action:"DispatchJob"
                                                },
                                            };
                                            console.log("message",message.pickuptime);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                            console.log("deviceType---",userDeviceType);
                                        } else if (userDeviceType == "IOS") {
                                            var message = {
                                                to: userDeviceToken,
                                                notification: {
                                                    badge: "1",
                                                    // "name": result2.name,
                                                    body: "Ride Information",
                                                    sound: "default",
                                                    data: {
                                                        message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                        title: "Ride Information",
                                                        pickuptime:element.pickUptime,
                                                        fare:element.fare,
                                                        user_name:user.name,
                                                        totalspent:"",
                                                        phonenumber:user.phonenumber,
                                                        usertype:user.userType,
                                                        dropLocation: {
                                                            longitude:
                                                            element.dropLocation.coordinates[0],
                                                   latitude:
                                                   element.dropLocation.coordinates[1],
                                                   address: element.dropLocation.address,
                                                          },
                                                        lasttrip:"",
                                                        pickupLocation:{
                                                            longitude:
                                                                     element.pickupLocation.coordinates[0],
                                                            latitude:
                                                            element.pickupLocation.coordinates[1],
                                                            address: element.pickupLocation.address,
                                                        },
                                                        jobtype:"DispatchJob",
                                                        jobid:element._id,
                                                        totaltrips:"",
                                                        riderimage:user.imagefile,
                                                        riderrating:"",
                                                        Eta:"",
                                                        user_id:user._id,
                                                        dateOfJourney:element.dateOfJourney,
                                                        action:"DispatchJob"
                                                    },
                                                },
                                            };
                                            console.log("mess--",message);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                        } else {
                                            client.messages.create({
                                                body: "Welcome to totalcare mobility Hello" + "  " + user.name + ",  " + "Your Ride Is going be start in next " + finalTime + "mins. From" + user.pickupLocation.address + " " + " To " + user.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + user.pickUptime + " " + "Distance :" + user.distance + " " + " Fare" + user.fare + "",
                                                from: +12059463843,
                                                to: +91 + user.phonenumber,
                                            });
                                        }
                                    } else {
                                        client.messages.create({
                                            body: "Welcome to totalcare mobility Hello" + "  " + user.name + ",  " + "Your Ride Is going be start in next " + finalTime + "mins. From" + user.pickupLocation.address + " " + " To " + user.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + user.pickUptime + " " + "Distance :" + user.distance + " " + " Fare" + user.fare + "",
                                            from: +12059463843,
                                            to: +91 + user.phonenumber,
                                        });
                                    }


                                    // making notificatoin for driver 

                                    if (!isEmpty(driverDeviceInfo)) {
                                        var [{ deviceType: driverDeviceType, deviceToken: driverDeviceToken }] = driverDeviceInfo;
                                        console.log("in android");
                                        if (driverDeviceType == "Android") {
                                            var message = {
                                                to: driverDeviceToken,
                                                data: {
                                                    message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                    title: "Ride Information",
                                                    pickuptime:element.pickUptime,
                                                    fare:element.fare,
                                                    user_name:user.name,
                                                    totalspent:"",
                                                    phonenumber:user.phonenumber,
                                                    usertype:user.userType,
                                                    dropLocation: {
                                                        longitude:
                                                        element.dropLocation.coordinates[0],
                                               latitude:
                                               element.dropLocation.coordinates[1],
                                               address: element.dropLocation.address,
                                                      },
                                                    lasttrip:"",
                                                    pickupLocation:{
                                                        longitude:
                                                                 element.pickupLocation.coordinates[0],
                                                        latitude:
                                                        element.pickupLocation.coordinates[1],
                                                        address: element.pickupLocation.address,
                                                    },
                                                    jobtype:"DispatchJob",
                                                    jobid:element._id,
                                                    totaltrips:"",
                                                    riderimage:user.imagefile,
                                                    riderrating:"",
                                                    Eta:"",
                                                    user_id:user._id,
                                                    dateOfJourney:element.dateOfJourney,
                                                    action:"DispatchJob"
                                                    // user: { name: user.name, email: user.email,pickuptime:element.pickUptime },
                                                    // driverdetails: { name: driverdetails.name, email: driverdetails.email },
                                                    // ...rest,
                                                    // driverId: driverdetails._id,
                                                    // driverName: driverdetails.name,
                                                },
                                            };
                                            console.log("mess",message);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                           
                                        } else if (driverDeviceType == "IOS") {
                                            // console.log(deviceToken, "deviceToken+deviceToken");
                                            var message = {
                                                to: driverDeviceToken,
                                                notification: {
                                                    badge: "1",
                                                    // "name": result2.name,
                                                    body: "Logged Status",
                                                    sound: "default",
                                                    data: {
                                                        message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                    title: "Ride Information",
                                                    pickuptime:element.pickUptime,
                                                    fare:element.fare,
                                                    user_name:user.name,
                                                    totalspent:"",
                                                    phonenumber:user.phonenumber,
                                                    usertype:user.userType,
                                                    dropLocation: {
                                                        longitude:
                                                        element.dropLocation.coordinates[0],
                                               latitude:
                                               element.dropLocation.coordinates[1],
                                               address: element.dropLocation.address,
                                                      },
                                                    lasttrip:"",
                                                    pickupLocation:{
                                                        longitude:
                                                                 element.pickupLocation.coordinates[0],
                                                        latitude:
                                                        element.pickupLocation.coordinates[1],
                                                        address: element.pickupLocation.address,
                                                    },
                                                    jobtype:"DispatchJob",
                                                    jobid:element._id,
                                                    totaltrips:"",
                                                    riderimage:user.imagefile,
                                                    riderrating:"",
                                                    Eta:"",
                                                    user_id:user._id,
                                                    dateOfJourney:element.dateOfJourney,
                                                    action:"DispatchJob"
                                                    },
                                                },
                                            };
                                           // console.log("tie--",message.data.pickuptime);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                        } else {
                                            client.messages.create({
                                                body: "Welcome to totalcare mobility Hello" + "  " + driverdetails.name + ",  " + "Your Job Is going be start in next " + finalTime + "mins. From" + driverdetails.pickupLocation.address + " " + " To " + driverdetails.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + driverdetails.pickUptime + " " + "Distance :" + driverdetails.distance + " " + " Fare" + driverdetails.fare + "",
                                                from: +12059463843,
                                                to: +91 + driverdetails.phonenumber,
                                            });
                                        }
                                    } else {
                                        client.messages.create({
                                            body: "Welcome to totalcare mobility Hello" + "  " + driverdetails.name + ",  " + "Your Job Is going be start in next " + finalTime + "mins. From" + driverdetails.pickupLocation.address + " " + " To " + driverdetails.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + driverdetails.pickUptime + " " + "Distance :" + driverdetails.distance + " " + " Fare" + driverdetails.fare + "",
                                            from: +12059463843,
                                            to: +91 + driverdetails.phonenumber,
                                        });
                                    }
                                    query.updateAllDocument(jobModal, { _id: mongoose.Types.ObjectId(element._id) }, { notifiactionPre15: true })
                                    count++;
                                }
                            }
                        }
                    });
                    console.log("notification send success", { count: count })
                }
            } else {
                console.log('not found')
            }
        } catch (error) {
            console.log('sometihng wet wrong', error)
            // console.error("error", "something went wrong")
        }
    }
    _notificationBefore15();
}
function coverJobBefore15(req, res) {
    console.log("in notifi-----------------------?");
    coverJobBefore15 = async () => {
        try {
            let condition = {};
            condition = {
                $or: [
                    { tripstatus: 'Upcoming' },
                    { tripstatus: null }],

                $and: [{
                    $or: [{
                        notifiactionPre15: false
                    },
                    {
                        notifiactionPre15: null
                    }]
                }]
            }

            var response = await query.findData(jobModal, condition, {}, { created_at: 1 }, 'user driverdetails');
           // console.log("resp log--",response);
            if (response.error) { }
            else if (response.status) {
                if (!isEmpty(response.data)) {
                    let count = 0;
 
                    response.data.forEach(element => {
                       // console.log("in element");
                        if (element.dateOfJourney && element.pickUptime) {
                            // format date into DD-MM-YYYY
                            let date = moment(element.dateOfJourney).format('DD-MM-yyyy');
                            //console.log("date",date);
                            // count the time diffenrciete
                            let picktime =element.pickUptime
                           // console.log({picktime});
                            let curre= new Date()
                            curre =curre.toLocaleTimeString()
                            // curre =curre.split(':')
                            // curre =curre[0]+":"+curre[1]
                            //console.log({curre});
                          //  curre = curre.minutes();
                          picktime= moment(picktime,'hh:mm').format('hh:mm')
                          //console.log({picktime});
                          curre = moment(curre,'hh:mm').format('hh:mm')
                           //console.log({curre});
                          // var finalTime = curre.diff(picktime, 'hours')
                          // var finalTime = moment(picktime).diff(curre, "minutes");
                         // var finalTime=(moment(curre).diff(picktime, 'hours'));
            
                        // var hours = parseInt(finalTime.asHours());
                        // console.log({hours});
                            let finalTime = moment.duration(moment(picktime,'hh:mm').diff(moment(curre,'hh:mm'))).asMinutes()
                            // convert time diff into minutes
                            //console.log({finalTime});
                            //finalTime = finalTime.minutes();
                           // console.log("time---",finalTime);
                            if (Number(finalTime) >= 0 && Number(finalTime) <= 15) {
                                console.log("in final time");
                                const { user, driverdetails,response, ...rest } = element;
                                console.log({rest});
                                if (user && driverdetails) {

                                    const { deviceInfo: userDeviceInfo } = user;

                                    const { deviceInfo: driverDeviceInfo } = driverdetails;

                                    // making notification for user
                                    if (!isEmpty(userDeviceInfo)) {
                                        console.log("in device info-------------------");
                                        var [{ deviceType: userDeviceType, deviceToken: userDeviceToken }] = userDeviceInfo;
                                        console.log("deviceToken--"+userDeviceToken);
                                        if (userDeviceType == "Android") {
                                            var message = {
                                                to: userDeviceToken,
                                                data: {
                                                    message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                    title: "Ride Information",
                                                    pickuptime:element.pickUptime,
                                                    fare:element.fare,
                                                    user_name:user.name,
                                                    totalspent:"",
                                                    phonenumber:user.phonenumber,
                                                    usertype:user.userType,
                                                    dropLocation: {
                                                        longitude:
                                                        element.dropLocation.coordinates[0],
                                               latitude:
                                               element.dropLocation.coordinates[1],
                                               address: element.dropLocation.address,
                                                      },
                                                    lasttrip:"",
                                                    pickupLocation:{
                                                        longitude:
                                                                 element.pickupLocation.coordinates[0],
                                                        latitude:
                                                        element.pickupLocation.coordinates[1],
                                                        address: element.pickupLocation.address,
                                                    },
                                                    jobtype:"CoberJob",
                                                    jobid:element._id,
                                                    totaltrips:"",
                                                    riderimage:user.imagefile,
                                                    riderrating:"",
                                                    Eta:"",
                                                    user_id:user._id,
                                                    dateOfJourney:element.dateOfJourney,
                                                    action:"CoverJob"
                                                },
                                            };
                                            console.log("message",message.pickuptime);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                            console.log("deviceType---",userDeviceType);
                                        } else if (userDeviceType == "IOS") {
                                            var message = {
                                                to: userDeviceToken,
                                                notification: {
                                                    badge: "1",
                                                    // "name": result2.name,
                                                    body: "Ride Information",
                                                    sound: "default",
                                                    data: {
                                                        message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                        title: "Ride Information",
                                                        pickuptime:element.pickUptime,
                                                        fare:element.fare,
                                                        user_name:user.name,
                                                        totalspent:"",
                                                        phonenumber:user.phonenumber,
                                                        usertype:user.userType,
                                                        dropLocation: {
                                                            longitude:
                                                            element.dropLocation.coordinates[0],
                                                   latitude:
                                                   element.dropLocation.coordinates[1],
                                                   address: element.dropLocation.address,
                                                          },
                                                        lasttrip:"",
                                                        pickupLocation:{
                                                            longitude:
                                                                     element.pickupLocation.coordinates[0],
                                                            latitude:
                                                            element.pickupLocation.coordinates[1],
                                                            address: element.pickupLocation.address,
                                                        },
                                                        jobtype:"CoverJob",
                                                        jobid:element._id,
                                                        totaltrips:"",
                                                        riderimage:user.imagefile,
                                                        riderrating:"",
                                                        Eta:"",
                                                        user_id:user._id,
                                                        dateOfJourney:element.dateOfJourney,
                                                        action:"CoverJob"
                                                    },
                                                },
                                            };
                                            console.log("mess--",message);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                        } else {
                                            client.messages.create({
                                                body: "Welcome to totalcare mobility Hello" + "  " + user.name + ",  " + "Your Ride Is going be start in next " + finalTime + "mins. From" + user.pickupLocation.address + " " + " To " + user.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + user.pickUptime + " " + "Distance :" + user.distance + " " + " Fare" + user.fare + "",
                                                from: +12059463843,
                                                to: +91 + user.phonenumber,
                                            });
                                        }
                                    } else {
                                        client.messages.create({
                                            body: "Welcome to totalcare mobility Hello" + "  " + user.name + ",  " + "Your Ride Is going be start in next " + finalTime + "mins. From" + user.pickupLocation.address + " " + " To " + user.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + user.pickUptime + " " + "Distance :" + user.distance + " " + " Fare" + user.fare + "",
                                            from: +12059463843,
                                            to: +91 + user.phonenumber,
                                        });
                                    }


                                    // making notificatoin for driver 

                                    if (!isEmpty(driverDeviceInfo)) {
                                        var [{ deviceType: driverDeviceType, deviceToken: driverDeviceToken }] = driverDeviceInfo;
                                        console.log("in android");
                                        if (driverDeviceType == "Android") {
                                            var message = {
                                                to: driverDeviceToken,
                                                data: {
                                                    message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                    title: "Ride Information",
                                                    pickuptime:element.pickUptime,
                                                    fare:element.fare,
                                                    user_name:user.name,
                                                    totalspent:"",
                                                    phonenumber:user.phonenumber,
                                                    usertype:user.userType,
                                                    dropLocation: {
                                                        longitude:
                                                        element.dropLocation.coordinates[0],
                                               latitude:
                                               element.dropLocation.coordinates[1],
                                               address: element.dropLocation.address,
                                                      },
                                                    lasttrip:"",
                                                    pickupLocation:{
                                                        longitude:
                                                                 element.pickupLocation.coordinates[0],
                                                        latitude:
                                                        element.pickupLocation.coordinates[1],
                                                        address: element.pickupLocation.address,
                                                    },
                                                    jobtype:"CoverJob",
                                                    jobid:element._id,
                                                    totaltrips:"",
                                                    riderimage:user.imagefile,
                                                    riderrating:"",
                                                    Eta:"",
                                                    user_id:user._id,
                                                    dateOfJourney:element.dateOfJourney,
                                                    action:"CoverJob"
                                                    // user: { name: user.name, email: user.email,pickuptime:element.pickUptime },
                                                    // driverdetails: { name: driverdetails.name, email: driverdetails.email },
                                                    // ...rest,
                                                    // driverId: driverdetails._id,
                                                    // driverName: driverdetails.name,
                                                },
                                            };
                                            console.log("mess",message);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                           
                                        } else if (driverDeviceType == "IOS") {
                                            // console.log(deviceToken, "deviceToken+deviceToken");
                                            var message = {
                                                to: driverDeviceToken,
                                                notification: {
                                                    badge: "1",
                                                    // "name": result2.name,
                                                    body: "Logged Status",
                                                    sound: "default",
                                                    data: {
                                                        message: `Hello ${driverdetails.name}, Your Job is going to start with in ${finalTime} mins!`,
                                                    title: "Ride Information",
                                                    pickuptime:element.pickUptime,
                                                    fare:element.fare,
                                                    user_name:user.name,
                                                    totalspent:"",
                                                    phonenumber:user.phonenumber,
                                                    usertype:user.userType,
                                                    dropLocation: {
                                                        longitude:
                                                        element.dropLocation.coordinates[0],
                                               latitude:
                                               element.dropLocation.coordinates[1],
                                               address: element.dropLocation.address,
                                                      },
                                                    lasttrip:"",
                                                    pickupLocation:{
                                                        longitude:
                                                                 element.pickupLocation.coordinates[0],
                                                        latitude:
                                                        element.pickupLocation.coordinates[1],
                                                        address: element.pickupLocation.address,
                                                    },
                                                    jobtype:"CoverJob",
                                                    jobid:element._id,
                                                    totaltrips:"",
                                                    riderimage:user.imagefile,
                                                    riderrating:"",
                                                    Eta:"",
                                                    user_id:user._id,
                                                    dateOfJourney:element.dateOfJourney,
                                                    action:"CoverJob"
                                                    },
                                                },
                                            };
                                           // console.log("tie--",message.data.pickuptime);
                                            fcm.send(message, function (err, pushresponse) {
                                                if (err) {
                                                    console.log("notifications not send", err);
                                                } else {
                                                    console.log(
                                                        "notifications sent to devices",
                                                        pushresponse
                                                    );
                                                }
                                            });
                                        } else {
                                            client.messages.create({
                                                body: "Welcome to totalcare mobility Hello" + "  " + driverdetails.name + ",  " + "Your Job Is going be start in next " + finalTime + "mins. From" + driverdetails.pickupLocation.address + " " + " To " + driverdetails.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + driverdetails.pickUptime + " " + "Distance :" + driverdetails.distance + " " + " Fare" + driverdetails.fare + "",
                                                from: +12059463843,
                                                to: +91 + driverdetails.phonenumber,
                                            });
                                        }
                                    } else {
                                        client.messages.create({
                                            body: "Welcome to totalcare mobility Hello" + "  " + driverdetails.name + ",  " + "Your Job Is going be start in next " + finalTime + "mins. From" + driverdetails.pickupLocation.address + " " + " To " + driverdetails.dropLocation.address + "  " + "Date Of Journey :" + date + "  " + "At " + driverdetails.pickUptime + " " + "Distance :" + driverdetails.distance + " " + " Fare" + driverdetails.fare + "",
                                            from: +12059463843,
                                            to: +91 + driverdetails.phonenumber,
                                        });
                                    }
                                    query.updateAllDocument(jobModal, { _id: mongoose.Types.ObjectId(element._id) }, { notifiactionPre15: true })
                                    count++;
                                }
                            }
                        }
                    });
                    console.log("notification send success", { count: count })
                }
            } else {
                console.log('not found')
            }
        } catch (error) {
            console.log('sometihng wet wrong', error)
            // console.error("error", "something went wrong")
        }
    }
    coverJobBefore15();
}

module.exports = {
    sendScheduledInvoice,
    checkLoggedStatus,
    notificationBefore15,
    coverJobBefore15
}