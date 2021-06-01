var _ = require("lodash");
var express = require("express");
var jwt = require("jsonwebtoken");
var async = require("async");
var mongoose = require("mongoose");
var axios = require("axios");
var constantmessage = require("../config/constants");
const userModel = require("../model/user");
const transectionModel = require("../model/tansaction");
const areaCode = require("../model/Areacode");
const utility = require("../config/utility");
const commonQuery = require('../config/common_query')
const moment = require("moment");
const formidable = require("formidable");
const jobModel = require("../model/driverstatus");
const transactionmodel = require("../model/tansaction");
var FCM = require("fcm-node");
const jobmodel = require("../model/driverstatus");
const driver = require("./driver");
const constant = require("../config/constants")
const areacodemodel = require("../model/Areacode");
const Notification = require('../model/notification');
const { get } = require("../routes");
const notificationSchema = require("../model/notification");
var emailtemplate = require("../model/emailtemplate");
var handlebars = require("handlebars");
const { isEmpty, result } = require("lodash");
const { findOne } = require("../model/user");
const client = require("twilio")(
  constantmessage.twilio.accountSid,
  constantmessage.twilio.authToken
);
var serverKey =
  "AAAAe2dFb3k:APA91bH1sVSzIm2RcC3TehkXMxTrzlJjATuHvCO4VsM2CyU8azuF_F6n89I9OlAKzRKI15TmlElBIjfznAma4OtlrsJzf3Hs_fSRHvrK7YAyYf2m3R-orykYtD28HnXDaCOQKByJKdLZ";
var fcm = new FCM(serverKey);

module.exports = {
  riderequest: riderequest,
  testriderequest,
  upcomingandcompleteride,
  coverJob: coverJob,
  AcceptandReject,
  coverJobList,
  coverJobStart,
  coverJobEnd,
  adminRiderequest: adminRiderequest,
  adminAddDespatchJobs: adminAddDespatchJobs,
  getDispatchJobByID,
  updateDispatchJob,
  adminGetDespatchJobs: adminGetDespatchJobs,
  adminDeleteDispatchJob: adminDeleteDispatchJob,
  adminGetDispatchJob: adminGetDispatchJob,
  adminGetCoverJob :adminGetCoverJob,
  trackJob: trackJob,
  getJobdetail: getJobdetail,
  dispatchJobStart: dispatchJobStart,
  dispatchJobEnd: dispatchJobEnd,
  pickupdispatchJob: pickupdispatchJob,
  getCoverJobByID:getCoverJobByID,
  updatecoverJob:updatecoverJob
};

async function riderequest(req, res) {
  try {
    var pickupareacode = null;
    var dropareacode = null;
    var eta = "";
    var rating = 0;
    var userimage = "";
    var jobid = "";
    let body = req.body ? req.body : {};
    console.log("body---", body);

    let availabledrivers = await userModel
      .find({
        isDeleted: false,
        status: false,
        userType: "Driver",
        onlinestatus: "1",
        isAvailable: true,
      })
      .select({ _id: 1 });
    console.log("avlaaaa--", availabledrivers);

    let driverIds = availabledrivers.map((x) => {
      return x._id;
    });
    let getLatestjob = await transectionModel
      .findOne()
      .populate("jobid")
      .sort({ _id: -1 });
    console.log("late--", getLatestjob);
    jobid = getLatestjob.jobid._id;
    if (getLatestjob.jobid.duration != null) {
      eta = getLatestjob.jobid.duration;
    }
    let userdetails = await userModel.findOne({
      isDeleted: false,
      userType: "Normal",
      _id: body.riderid,
    });
    console.log("detail--,", userdetails);
    // console.log("userd--",userdetails);
    //  imagefile = null;
    // if (userdetails.imagefile !== null) {
    //   userimage = userdetails.imagefile ? userimage:null ;
    // }
    let getAreaCode = await areacodemodel.findOne({
      areaname: getLatestjob.jobid.pickupLocation.address,
    });
    // console.log("Areaco--",getAreaCode.areacode);
    if (getAreaCode != null) {
      pickupareacode = getAreaCode.areacode;
    }
    let getdropAreaCode = await areacodemodel.findOne({
      areaname: getLatestjob.jobid.dropLocation.address,
    });
    //  console.log("dropAdd--",getdropAreaCode.areacode);
    if (getdropAreaCode != null) {
      dropareacode = getdropAreaCode.areacode;
    }
    console.log(body, userdetails, "body++++");
    let condition = {
      currentlocation: {
        type: "Point",
        coordinates: [
          getLatestjob.jobid.pickupLocation.coordinates[0],
          getLatestjob.jobid.pickupLocation.coordinates[1],
        ],
      },
    };
    console.log(
      "coordinae--",
      parseFloat(getLatestjob.jobid.pickupLocation.coordinates[0]),
      getLatestjob.jobid.pickupLocation.coordinates[1]
    );
    let longitude = getLatestjob.jobid.pickupLocation.coordinates[0];
    let latitude = getLatestjob.jobid.pickupLocation.coordinates[1];
    console.log("latlong--", longitude, latitude);
    let availableDrivers = await userModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          // maxDistance: 50000,
          spherical: true,
        },
      },

      {
        $match: { _id: { $in: driverIds } },
      },

      { $limit: 3 },

      {
        $project: {
          name: 1,
          "currentlocation.address": 1,
          distance: 1,
          deviceInfo: 1,
        },
      },
    ]);

    console.log(availableDrivers, "availableDrivers");

    if (availabledrivers.length > 0) {
      let saveObj = {
        dateOfJournery: new Date(),
        riderdetails: body.riderid,
        pickupTime: new Date(),
        pickupLocation: {
          coordinates: [
            getLatestjob.jobid.pickupLocation.coordinates[0],
            getLatestjob.jobid.pickupLocation.coordinates[1],
          ],
          type: "Point",
          address: getLatestjob.jobid.pickupLocation.address,
        },
        dropLocation: {
          coordinates: [
            getLatestjob.jobid.dropLocation.coordinates[1],
            getLatestjob.jobid.dropLocation.coordinates[0],
          ],
          type: "Point",
          address: getLatestjob.jobid.dropLocation.address,
        },
        requestAction: "Pending",
      };
      var TotalAmount = 0;
      var totalDistance = 0;
      var TotalTrips = 0;
      let sum = await transectionModel
        .find({
          user: req.body.riderid,
        })
        .populate(" jobid user driverdetails review ")
        .lean();
      // console.log("sumdata---",sum);
      sum.forEach((element) => {
        //totalDistance = parseFloat(element.jobid.distance);
        // console.log("id--", element.jobid._id);
        console.log("diss");
        // totalDistance = totalDistance + totalDistance;
        // TotalAmount = TotalAmount + parseFloat(element.Amount);
        // TotalTrips = TotalTrips + 1;
        //      // Name   = element.driverdetails.name
        //       profileImage =element.driverdetails.imagefile
        //      TotalTrips=  TotalTrips +1;
        //        comp =element.createdAt.getDate()
        //        if(comp == tDate)
        //    {
        //        TodayAmount = TodayAmount+parseFloat(element.Amount)
        //    }
      });
      console.log("totalDis--", totalDistance);
      var amount = 0;
      var A = "";
      function ETA(a) {
        A = a;
        console.log("aa", A);
      }

      var lastjob = "";

      console.log("job--", getLatestjob.jobid.pickupLocation.coordinates[0]);
      let getLastjob = await transectionModel
        .findOne()
        .populate("jobid")
        .sort({ _id: 1 });
      // console.log("job--",getLastjob);
      if (getLatestjob.createdAt != null) {
        lastjob = getLastjob.createdAt;
      }
      amount = getLatestjob.Amount;
      console.log("am--###########################################", getLatestjob.jobid._id);
      console.log("eta", saveObj);
      // let createjob = await new jobModel(saveObj).save();

      async.eachSeries(
        availableDrivers,
        (item, callback) => {
          //  console.log(item._id, createjob._id, "+++++++++++");

          //    var checkrequest = await jobModel.findOne({_id:createjob._id})

          //    if(checkrequest.requestAction=='Accepted')
          //    {
          //          callback('Break the loop')
          //    }

          //    else{

          // if (userdetails.rating != null) {
          //   rating = userdetails.rating;
          // }
          // console.log("rating--",rating);

          userModel
            .findOne({
              _id: item._id,
              isDeleted: false,
              status: false,
              onlinestatus: "1",
              userType: "Driver",
            })
            .select({ _id: 1, isAvailable: 1 })
            .lean()
            .exec((err, result) => {
              console.log("ASSS--", A);
              if (result.isAvailable == true) {
                console.log(item._id, "item iddi");
                var arr = item.deviceInfo;
                let deviceToken = arr[arr.length - 1].deviceToken;
                let deviceType = arr[arr.length - 1].deviceType;
                console.log("devictype--", deviceType);
                console.log("devictoken--", deviceToken);
                if (deviceType == "Android") {
                  console.log("in android");
                  var message = {
                    to: deviceToken,
                    data: {
                      message: "Ride request",
                      title: "RideRequest",
                      // "body":`${data.sender} send you a message`,
                      user_id: userdetails._id,
                      user_name: userdetails.name,
                      action: "RideRequest",
                      pickupLocation: {
                        longitude:
                          getLatestjob.jobid.pickupLocation.coordinates[0],
                        latitude:
                          getLatestjob.jobid.pickupLocation.coordinates[1],
                        pickupareacode: pickupareacode,
                        // /type:'Point'
                        address: getLatestjob.jobid.pickupLocation.address,
                      },
                      dropLocation: {
                        longitude:
                          getLatestjob.jobid.dropLocation.coordinates[0],
                        latitude:
                          getLatestjob.jobid.dropLocation.coordinates[1],
                        dropareacode: dropareacode,
                        // coordinates:[body.dropLocation.long,body.dropLocation.lat],
                        // type:'Point',
                        address: getLatestjob.jobid.dropLocation.address,
                      },

                      totaltrips: TotalTrips,
                      totalspent: TotalAmount,
                      jobtype: getLatestjob.jobid.jobtype,
                      lasttrip: lastjob,
                      Eta: eta,
                      riderimage: userdetails.imagefile ? userdetails.imagefile : null,
                      riderrating: userdetails.rating ? userdetails.rating : null,
                      usertype: userdetails.userType,
                      phonenumber: userdetails.phonenumber
                        ? userdetails.phonenumber
                        : "",

                      jobid: jobid,
                      pickuptime: new Date(),

                      fare: amount,
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
                      body: "Ride Reqest",
                      sound: "default",
                      data: {
                        message: "Ride request",
                        title: "RideRequest",
                        // "body":`${data.sender} send you a message`,
                        user_id: userdetails._id,
                        user_name: userdetails.name,
                        action: "RideRequest",
                        pickupLocation: {
                          longitude:
                            getLatestjob.jobid.pickupLocation.coordinates[0],
                          latitude:
                            getLatestjob.jobid.pickupLocation.coordinates[1],
                          pickupareacode: pickupareacode,
                          // /type:'Point'
                          address: getLatestjob.jobid.pickupLocation.address,
                        },
                        dropLocation: {
                          longitude:
                            getLatestjob.jobid.dropLocation.coordinates[0],
                          latitude:
                            getLatestjob.jobid.dropLocation.coordinates[1],
                          dropareacode: dropareacode,
                          // coordinates:[body.dropLocation.long,body.dropLocation.lat],
                          // type:'Point',
                          address: getLatestjob.jobid.dropLocation.address,
                        },

                        totaltrips: TotalTrips,
                        totalspent: TotalAmount,
                        jobtype: getLatestjob.jobid.jobtype,
                        lasttrip: lastjob,
                        Eta: eta,
                        riderimage: userdetails.imagefile ? userdetails.imagefile : null,
                        riderrating: userdetails.rating ? userdetails.rating : null,
                        usertype: userdetails.userType,
                        phonenumber: userdetails.phonenumber
                          ? userdetails.phonenumber
                          : "",

                        jobid: jobid,
                        pickuptime: new Date(),

                        fare: amount,
                      },
                    },
                  };
                  console.log("ios--", message);
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

                setTimeout(async () => {
                  var checkrequest = await jobModel.findOne({
                    _id: getLatestjob.jobid._id
                  });

                  if (checkrequest.requestAction == "Accepted") {
                    callback("Break the loop");
                  } else {
                    callback();
                  }
                }, 34000);
              } else {
                callback();
              }
            });
        },
        async (err, result) => {
          if (err) {
            console.log(err);
          } else {
            let notificationData = {
              message: `${userdetails.name} has ride request`,
              from: `${userdetails._id}`,
              type: 'system'
            };
            await new Notification(notificationData).save();
            console.log(result, "result");
          }
        }
      );
      return res.json({ code: 200, message: "Request successfull" });

      // console.log(availableDrivers, 'availableDrivers')
    } else {
      return res.json({
        code: 400,
        message: "No Nearest Driver Available",
        data: [],
      });
    }
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(e);
  }
}

async function testriderequest(req, res) {
  try {
    let body = req.body ? req.body : {};

    console.log(body, "mainbody++++++");
    let availabledrivers = await userModel
      .find({
        isDeleted: false,
        status: false,
        userType: "Driver",
        onlinestatus: "1",
        isAvailable: true,
      })
      .select({ _id: 1 });

    let driverIds = availabledrivers.map((x) => {
      return x._id;
    });

    let userdetails = await userModel
      .findOne({ isDeleted: false, userType: "Normal", _id: body.riderid })
      .select({ name: 1 });

    console.log(body, userdetails, "body++++");
    let condition = {
      currentlocation: {
        type: "Point",
        coordinates: [
          body.pickupLocation.longitude,
          body.pickupLocation.latitude,
        ],
      },
    };
    let availableDrivers = await userModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [
              parseFloat(body.pickupLocation.longitude),
              parseFloat(body.pickupLocation.latitude),
            ],
          },
          distanceField: "distance",
          maxDistance: 500000,
          spherical: true,
        },
      },

      {
        $match: { _id: { $in: driverIds } },
      },

      { $limit: 3 },

      {
        $project: {
          name: 1,
          "currentlocation.address": 1,
          distance: 1,
          deviceInfo: 1,
        },
      },
    ]);

    console.log(availableDrivers, "availableDrivers");

    if (availabledrivers.length > 0) {
      let saveObj = {
        dateOfJournery: new Date(body.dateOfJournery),
        riderdetails: body.riderid,
        pickupTime: new Date(body.pickupTime),
        pickUpLocation: {
          coordinates: [
            body.pickupLocation.longitude,
            body.pickupLocation.latitude,
          ],
          type: "Point",
          address: body.pickupLocation.address,
        },
        dropLocation: {
          coordinates: [
            body.dropLocation.longitude,
            body.dropLocation.latitude,
          ],
          type: "Point",
          address: body.dropLocation.address,
        },
        requestAction: "Pending",
      };

      let createjob = await new jobModel(saveObj).save();

      async.eachSeries(
        availableDrivers,
        (item, callback) => {
          console.log(item._id, createjob._id, "+++++++++++");

          //    var checkrequest = await jobModel.findOne({_id:createjob._id})

          //    if(checkrequest.requestAction=='Accepted')
          //    {
          //          callback('Break the loop')
          //    }

          //    else{
          userModel
            .findOne({
              _id: item._id,
              isDeleted: false,
              status: false,
              onlinestatus: "1",
              userType: "Driver",
            })
            .select({ _id: 1, isAvailable: 1 })
            .lean()
            .exec((err, result) => {
              if (result.isAvailable == true) {
                console.log(item._id, "item iddi");
                var arr = item.deviceInfo;
                let deviceToken = arr[arr.length - 1].deviceToken;
                let deviceType = arr[arr.length - 1].deviceType;
                if (deviceType == "Android") {
                  var message = {
                    to: deviceToken,
                    data: {
                      message: "Ride request",
                      title: "RideRequest",
                      // "body":`${data.sender} send you a message`,
                      user_id: userdetails._id,
                      user_name: userdetails.name,
                      usertype: userdetails.userType,
                      phonenumber: userdetails.phonenumber
                        ? userdetails.phonenumber
                        : "",
                      action: "RideRequest",
                      pickUpLocation: {
                        longitude: body.pickupLocation.longitude,
                        latitude: body.pickupLocation.latitude,
                        // /type:'Point'
                        address: body.pickupLocation.address,
                      },
                      dropLocation: {
                        longitude: body.dropLocation.longitude,
                        latitude: body.dropLocation.latitude,
                        // coordinates:[body.dropLocation.long,body.dropLocation.lat],
                        // type:'Point',
                        address: body.dropLocation.address,
                      },
                      totaltrips: "12",
                      totalspent: "$50",
                      lasttrip: "",
                      jobid: createjob._id,
                      pickuptime: new Date(),
                      riderrating: 0,
                      Eta: "",
                      riderimage: "",
                      fare: "",
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
                } else if (deviceType == "IOS") {
                  console.log(deviceToken, "deviceToken+deviceToken");
                  var message = {
                    to: deviceToken,
                    notification: {
                      badge: "1",
                      // "name": result2.name,
                      body: "Ride Reqest",
                      sound: "default",
                      data: {
                        message: "Ride request",
                        title: "RideRequest",
                        usertype: userdetails.userType,
                        phonenumber: userdetails.phonenumber
                          ? userdetails.phonenumber
                          : "",

                        // "body":`${data.sender} send you a message`,
                        user_id: userdetails._id,
                        user_name: userdetails.name,
                        action: "RideRequest",
                        pickUpLocation: {
                          longitude: body.pickupLocation.longitude,
                          latitude: body.pickupLocation.latitude,
                          // /type:'Point'
                          address: body.pickupLocation.address,
                        },
                        dropLocation: {
                          longitude: body.dropLocation.longitude,
                          latitude: body.dropLocation.latitude,
                          // coordinates:[body.dropLocation.long,body.dropLocation.lat],

                          address: body.dropLocation.address,
                        },
                        totaltrips: "12",
                        totalspent: "$50",
                        lasttrip: "",
                        jobid: createjob._id,
                        pickuptime: new Date(),
                        riderrating: 0,
                        Eta: "",
                        riderimage: "",
                        fare: "",
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
                setTimeout(async () => {
                  var checkrequest = await jobModel.findOne({
                    _id: createjob._id,
                  });

                  if (checkrequest.requestAction == "Accepted") {
                    callback("Break the loop");
                  } else {
                    callback();
                  }
                }, 34000);
              } else {
                callback();
              }
            });
        },
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(result, "result");
          }
        }
      );
      return res.json({ code: 200, message: "Request successfull" });

      // console.log(availableDrivers, 'availableDrivers')
    } else {
      return res.json({ code: 400, message: "Request successfull", data: [] });
    }
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(e);
  }
}

// async function rideaction(req,res)
// {
//     try
//     {
//         let body = req.body ? req.body:{};

//         let acceptedride = await jobModel.findOneAndUpdate({_id:body.jobid},
//             {$set:{driverdetails:body.driverid,requestAction:body.status}})

//             utility.sucesshandler(res,'Ride accepted successfully','')

//     }

//     catch(e)
//     {
//         utility.internalerrorhandler(e)
//     }
// }

async function upcomingandcompleteride(req, res) {
  let A = "";

  try {
    let body = req.body ? req.body : {};

    if (body.ridestatus == "Completed") {
      let jobs = await jobmodel.find({
        tripstatus: "Completed",
        driverdetails: body.driverid,
      });

      let filteredjob = jobs.filter((e) => {
        return e._id;
      });

      let tripdetails = await transactionmodel
        .find({ jobid: { $in: filteredjob } })
        .select({ Amount: 1 })
        .populate(
          "jobid",
          "pickupLocation dropLocation status jobtype tripstatus pickupTime"
        )
        .populate({ path: "user", select: "imagefile name rating" })
        .sort({ _id: -1 });
      console.log(tripdetails.user, "filteredjobs");

      let completedresult = [];

      tripdetails.forEach((element) => {
        console.log("job---", element.jobid.jobtype);
        if (element.jobid.jobtype == "Coverjob" || element.jobid.jobtype == "DispatchJob") {
          console.log("in hail");
          // if(element.jobid.pickupLocation.address !=null){
          // pickupdata =element.jobid.pickupLocation.address
          // }else{
          //   pickupdata =null
          // }
          // let areacode = areaCode.findOne({ areaname: element.jobid.pickupAreaname })
          // console.log({ areacode });
          let obj = {

            pickuplocationaddress: element.jobid.pickupLocation.address ? element.jobid.pickupLocation.address :"",
            dropLocationaddress: element.jobid.dropLocation.address ? element.jobid.dropLocation.address :"",
            tripstatus: element.jobid.tripstatus ? element.jobid.tripstatus : "",
            jobtype: element.jobid.jobtype ? element.jobid.jobtype :"",
            jobid: element.jobid._id,
            fare: element.Amount ? element.Amount :"",
            rating: 0,

            starttime: moment(element.jobid.tripStartTime).format("hh:mm a") ? moment(element.jobid.tripStartTime).format("hh:mm a") :null,
            endtime: moment(element.jobid.tripendtime).format("hh:mm:ss a") ? moment(element.jobid.tripendtime).format("hh:mm:ss a") :null,
            // tripdetails: tripdetails

          };
          completedresult.push(obj);
          console.log("res--", completedresult);


        }
        else {
          // console.log("elem--",element.user.name)
          let obj = {
         
            pickuplocationaddress: element.jobid.pickupLocation.address ? element.jobid.pickupLocation.address :"",
            dropLocationaddress: element.jobid.dropLocation.address ? element.jobid.dropLocation.address :"",
            tripstatus: element.jobid.tripstatus ? element.jobid.tripstatus : "",
            jobtype: element.jobid.jobtype ? element.jobid.jobtype :"",
            jobid: element.jobid._id,
            fare: element.Amount ? element.Amount :"",
            rating: 0,


            starttime: moment(element.jobid.status[1].triptime).format( "hh:mm a" ) ? moment(element.jobid.status[1].triptime).format( "hh:mm a" ):null,
            endtime: moment(
              element.jobid.status[element.jobid.status.length - 1].triptime
            ).format("hh:mm:ss a"),
            // tripdetails: tripdetails
          };
          completedresult.push(obj);
        }

      });

     // console.log(completedresult, "tripdetails");

      if (tripdetails.length > 0) {
        utility.sucesshandler(res, "success", completedresult);
      }
      utility.errorhandler(res, "no Record find", completedresult);
    } else {
      let jobs = await jobmodel.find({
        tripstatus: "Upcoming",
        driverdetails: body.driverid,
      });
      console.log("jobs--", jobs);
      let filteredjob = jobs.filter((e) => {
        return e._id;
      });
      //  console.log("filter---", filteredjob);

      let tripdetails = await transactionmodel
        .find({ jobid: { $in: filteredjob } }).select({ Amount: 1 })
        .populate("jobid")
        .populate({ path: "user", select: "imagefile name rating" });
      console.log(tripdetails, "filteredjobs");
      if (tripdetails.length > 0) {
        let completedresult = [];
        tripdetails.forEach((element) => {
          if(element.jobid.jobtype !== "Hailjob"){
          let obj = {
            pickuplocationaddress: element.jobid.pickupLocation.address ? element.jobid.pickupLocation.address :"",
            dropLocationaddress: element.jobid.dropLocation.address ? element.jobid.dropLocation.address :"",
            tripstatus: element.jobid.tripstatus ? element.jobid.tripstatus : "",
            jobtype: element.jobid.jobtype ? element.jobid.jobtype :"",
            
            fare: element.Amount ? element.Amount :"",
            username: element.user.name ? element.user.name : "",
            image: element.user.imagefile ? element.user.imagefile : "",
            rating: 0,
            jobid: element.jobid._id,
            dateofJournery: element.jobid.dateOfJourney ? element.jobid.dateOfJourney :""

            // let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${pickuplongitude},${pickuplatitude}&destinations=${droplongitude},${droplatitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
            //console.log({ pickUpLocation, dropLocation, link });

            // axios.get(link).then(function (response) {
            // handle successs
            // console.log(
            // "eta---",
            //////  response.data.rows[0].elements[0].duration.text
            //);
            //utility.sucesshandler(res, "", response.data);
            // A = response.data.rows[0].elements[0].duration.text;

            // console.log("AA", A);
            // }
            // let obj = {
            //   pickuplocationaddress: element.jobid.pickupLocation.address,
            //   jobid: element.jobid.id,
            //   pickuplatitude: element.jobid.pickupLocation.coordinates[0],
            //   pickuplongitude: element.jobid.pickupLocation.coordinates[1],
            //   droplatitude: element.jobid.dropLocation.coordinates[0],
            //   droplongitude: element.jobid.dropLocation.coordinates[1],
            //   dateofjourney: moment(element.jobid.dateOfJourney).format(
            //     "MM/DD/YYYY"
            //   ),
            //   dropLocationaddress: element.jobid.dropLocation.address,
            //   tripstatus: element.jobid.tripstatus,
            //   ETA: A,
            //   pickUpTime: element.jobid.pickUptime,
            //   fare: element.fare,
            //   username: element.user.name,
            //   image: element.user.imagefile ? element.user.imagefile : "",
            //   rating: 0,
            //  // tripdetails: tripdetails
          };

            completedresult.push(obj);
            console.log("res-", completedresult);

          }
        });
        utility.sucesshandler(res, "success", completedresult);
      } else {
        utility.errorhandler(res, "No Upcoming Job", filteredjob);
      }
    }
  } catch (e) {
    console.log(e, "error in complete ride");

    utility.internalerrorhandler(res);
  }
}
function coverJob(req, res) {
  async function cover_job() {
    try {

      const { key, loc, id } = req.body;
      const { body } = req;
      const { user } = body;
      console.log("body--", req.body);
      let condition = {};
      
      // if (user.email) {
      //   condition['email'] = user.email
      // }

      // if (user.phonenumber) {
      //   condition['phonenumber'] = user.phonenumber
      // }
      console.log("email", req.body.user.email);
      if(req.body.mailby ==='Email'){
        foundedUser  = await userModel.findOne(
       
           {email:req.body.user.email},{userType:"Normal"}
     
       )
     }
     else{
            
         foundedUser  = await userModel.findOne(
        
            {phonenumber:req.body.user.phonenumber},{userType:"Normal"}
      
        )
      
       console.log("Phone+---",foundedUser);
     }
 

      let userID = ''
      if (!isEmpty(foundedUser)) {
        const { _id } = foundedUser;
        userID = _id;
        if (condition.phonenumber) {
          await userModel.findByIdAndUpdate(_id, { phonenumber: condition.phonenumber })
        }
      } else {
        let usersave = user;
        let saveobj = new userModel(usersave)
        usersave["userType"] = "Normal";
        let res = await saveobj.save()
        userID = res._id
      }

      // console.log({user});
      let dataObj = {};
      let tObj = {};

      dataObj.user = userID;
      dataObj.carType = req.body.carType;
      dataObj.distance = req.body.distance;
      dataObj.duration = req.body.duration;
      dataObj.phonenumber = req.body.phonenumber;
      dataObj.dateOfJourney = req.body.dateOfJourney;
      dataObj.pickUptime = req.body.timeOfJourney;
      dataObj.fare = req.body.price;

      dataObj.carType = req.body.carType;
      dataObj.jobtype = "Coverjob";
      dataObj.pickupLocation = {
        type: "Point",
        coordinates: [
          req.body.pickupLocation.longitude,
          req.body.pickupLocation.latitude,
        ],
        address: req.body.pickupLocation.address,
      };

      dataObj.dropLocation = {
        type: "Point",
        coordinates: [
          req.body.dropLocation.longitude,
          req.body.dropLocation.latitude,
        ],
        address: req.body.dropLocation.address,
      };
      dataObj.riderdetails = mongoose.Types.ObjectId(userID);


      tObj.tax = req.body.tax || 3;
      tObj.fare = req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2);
      tObj.Amount = req.body.price;
      tObj.type = req.body.paymentType;

      let customerObj = await query.uniqueInsertIntoCollection(
        jobmodel,
        dataObj
      );

      tObj.jobid = mongoose.Types.ObjectId(customerObj.userData._id);
      tObj.user = mongoose.Types.ObjectId(userID);
      console.log("customerr---", customerObj);
      let transectionObj = await query.uniqueInsertIntoCollection(
        transectionModel,
        tObj
      );
      if (transectionObj) {

        let customerdata = await userModel.findById({ _id: mongoose.Types.ObjectId(userID) })
        console.log("data--", customerdata);

        var userDetails = {
          email: customerdata.email,
          name: customerdata.name,
          phonenumber: customerdata.phonenumber,
          pickupLocation: dataObj.pickupLocation,
          dropLocation: dataObj.dropLocation,
          dayOfJourney: dataObj.dayOfJourney,
          dateOfJourney: req.body.dateOfJourney,
          pickUptime: req.body.timeOfJourney,
          distance: dataObj.distance,
          fare: dataObj.fare
        };

        const curentBooking = await jobmodel.findOne({ user: mongoose.Types.ObjectId(userID) }).sort({ _id: -1 })
        console.log("cover bookingd--", curentBooking.jobid);
        if (!req.body.mailby || (req.body.mailby && req.body.mailby == 'Email')) {
          // console.log("hit", userDetails);
          emailtemplate
            .findOne({ findBy: "Dispatch_job" })
            .exec(async (err, emaildataresult) => {
              console.log("emaildataresult", emaildataresult);
              if (err) {
                throw new Error(err);
              } else if (emaildataresult) {
                let selectedSubject = emaildataresult.subject;
                let selectedContent = emaildataresult.content;
                const template = handlebars.compile(
                  selectedContent.replace(/\n|\r/g, "")
                );
                let message = "<title>Totalcabsmobility</title><link href=\"https://fonts.googleapis.com/css?family=Open+Sans:400,600,700\" rel=\"stylesheet\"><table width=\"900\" cellpadding=\"100\" cellspacing=\"0\" style=\"background-color:#fffff;margin:0 auto;text-align:center;\"><tbody><tr><td><tablestyle=\"width:100%;background-color:#ffffff;border-radius:3px;box-shadow:0 0 20px 0 rgba(0,0,0,0.15)\"cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td><table style=\"width:100%;border-top-left-radius:5px;border-top-right-radius:5px;\"cellpadding=\"15\" cellspacing=\"0\"><tbody><tr><td style=\"background-color:#08bf6d\"><h2style=\"font-family:'Open Sans', sans-serif;font-weight:400;background:none;color:#ffffff;font-size:22px;margin-bottom:0;margin-top:5px;text-align:left;\">Totalcabsmobility</h2></td></tr><tr><td><h2style=\"font-family: &quot;Open Sans&quot;, sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 0px; margin-top: 5px;\"><font color=\"#08bf6d\">Hi," + userDetails.name + " &nbsp <br> " + " Date Of Journey:" + userDetails.dateOfJourney + " " + " Pickup time :" + userDetails.pickUptime + " " + "Day Of Journey:" + userDetails.dayOfJourney + " " + " Pickup Location:" + userDetails.pickupLocation.address + " " + "Drop Location:" + userDetails.dropLocation.address + ";  " + "  Driver Name:" + userDetails.driverName + " " + "Driver license:" + userDetails.licencenumber + " " + "Fare:" + userDetails.fare + " " + "Distance :" + userDetails.distance + "" + "routerLink:" + constant.weburl.url + "/ride/" + curentBooking.jobid + "  </font></h2><spanstyle=\"border-bottom:1px solid #dfdfdf;width:300px;display:block;margin:0 auto;\">&nbsp;</span></td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#000000;font-size:14px;font-weight:600;\"><span style=\"font-size: 15px;\"></span><spanstyle=\"font-size: 17px;\"></span><spanstyle=\"font-size: 17px;\">Your Dispatch job has been submitted successfully.</span>&nbsp;</td></tr><tr><td>We look forward to give you our best.</td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#adadad;font-size:14px;\"></td></tr><tr><td><pstyle=\"font-family:'Open Sans', sans-serif;color:#818181;font-size:12px;font-weight:400;\">@copyright 2020. All Right Reserved.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
                utility.sendmail(
                  customerdata.email,
                  selectedSubject,
                  message,
                  async (err, finalresult) => {
                    if (err) {
                      throw new Error(err);
                    }
                  }
                );
                let notificationData = {
                  message: `${customerdata.name} has CoverJob request`,
                  from: `${customerdata._id}`,
                  type: 'system'
                };
                let response = await new Notification(notificationData).save();
                console.log(notificationData, "result");
                console.log(response, "response");



                utility.sucesshandler(res, 'Add Cover job successfully', customerdata);
              }
            });
        }
        else if (req.body.mailby == 'Phone') {
          let contentBody = `Hi ${userDetails.name},
                              Date Of Journey: ${userDetails.dateOfJourney} 
                              Pickup Time : ${userDetails.pickUptime} 
                              Pickup Location: ${userDetails.pickupLocation.address} 
                              Drop Location: ${userDetails.pickupLocation.address}
                              Fare: ${userDetails.fare}
                              Distance :${userDetails.distance} KM
                              
                              You can see the route of the journey from the link given below: 
                              ${constant.weburl.url}/ride/${curentBooking.jobid}`

          let message = await client.messages.create({
            body: contentBody,
            from: +12059463843,
            to: `+91${customerdata.phonenumber}`,
          });

          if (message) {
            let notificationData = {
              message: `${customerdata.name} has CoverJob request`,
              from: `${customerdata._id}`,
              type: 'system'

            };
            let response = await new Notification(notificationData).save();
            console.log(notificationData, "result");
            console.log(response, "response");

            console.log("in mess----------------------------------------------------");



            utility.sucesshandler(res, 'Add Cover Job successfully', customerObj);
          }

        }
        else if (data.mailby == '') {
          console.log("in null");
          utility.sucesshandler(res, 'Add Cover job successfully', despatchObj);
        }
        else {
          utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
      } else {
        utility.error(
          res,
          constantmessage.validationMessages.intenalError
        );
      }
    } catch (e) {
      console.log("e", e);
      utility.errorhandler(res, constantmessage.validationMessages.intenalError)
      //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }

  cover_job(function () { });
}
async function AcceptandReject(req, res) {
  let body = req.body ? req.body : {};
  console.log("data--", body);
  try {
    let jobdetail = await jobmodel.findOne({ _id: body.jobid });
    console.log("job--", jobdetail);
    if (jobdetail.requestAction != "Accepted") {
      let jobrequetUpdate = await jobmodel.findOneAndUpdate(
        { _id: body.jobid },
        { $set: { requestAction: "Accepted", driverdetails: body.driver } }
      );

      if (jobrequetUpdate) {
        let jobupdte = await jobmodel.findOneAndUpdate(
          { _id: body.jobid },
          { $set: { tripstatus: "Upcoming" } }
        );
        console.log("job--", jobupdte);

        if (jobupdte) {
          console.log("ok");
          utility.sucesshandler(
            res,
            "Your Request Accepted Successfully",
            jobupdte
          );
        }
      } else {
        utility.errorhandler(
          res,
          "This Rquest Accepted By Another Rider",
          jobdetail
        );
      }
    } else {
      utility.errorhandler(res, "ALready Accept by Another driver");
    }
  } catch (e) {
    console.log("e", e);
    //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
function coverJobList(req, res) {
  console.log("hit body", req.body);
  async function get_list() {
    try {
      let jobs = await jobmodel.find({ jobtype: "Coverjob" ,requestAction:{$eq : "Pending"} });

      let filteredjob = jobs.filter((e) => {
        return e._id;
      });

      // console.log("id--",condition);
      let customerdata = await transectionModel
        .find({ jobid: { $in: filteredjob } }).select({ Amount: 1 })
        .populate({ path: "jobid", match: { jobtype: { $eq: "Coverjob" } } });
      // let customerdata=await transactionmodel.find().select({Amount:1}).populate('jobid',{jobtype:{$eq:'Coverjob'}}).populate({path:'user',select:'imagefile name rating'}).sort({_id:-1})

      console.log("data--", customerdata);
      if (customerdata.length > 0) {
        console.log("1");
        utility.sucesshandler(res, "", customerdata);
      } else {
        console.log("2");
        utility.errorhandler(
          res, " No record Found"
        );
      }
    } catch (e) {
      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_list();
}
async function coverJobStart(req, res) {
  let body = req.body ? req.body : {};
  console.log("data--", body);
  try {
    // let jobdetail = await jobmodel.findOne({_id:body.jobid})
    // console.log("job--",jobdetail);

    let jobrequetUpdate = await jobmodel.findOneAndUpdate(
      { _id: body.jobid },
      { $set: { tripStartTime: new Date(), tripstatus: "Started" } }
    );

    if (jobrequetUpdate) {
      utility.sucesshandler(res, "Trip Started", jobrequetUpdate);
    } else {
      utility.errorhandler(res, "There is some issue to Start the trip");
    }
  } catch (e) {
    console.log("e", e);
    //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
async function coverJobEnd(req, res) {
  let body = req.body ? req.body : {};
  console.log("data--", body);
  try {
    let jobrequetUpdate = await jobmodel.findOneAndUpdate(
      { _id: body.jobid },
      { $set: { tripendtime: new Date(), tripstatus: "Completed" } }
    );
    let jobdetail = await jobmodel.findOne({ _id: body.jobid });
    let transection = await transectionModel.findOne({ jobid: body.jobid });
    console.log("tres--", transection);
    console.log("job--", jobdetail);
    console.log("jobdetail--", jobdetail.tripStartTime);
    let tripstartTime = jobdetail.tripStartTime;
    tripstartTime = tripstartTime.toLocaleTimeString();
    console.log("Time--", tripstartTime);

    let tripEndtime = jobdetail.tripendtime;
    tripEndtime = tripEndtime.toLocaleTimeString();
    console.log("end--", tripEndtime);
    tripstartTime = moment(tripstartTime, "hh:mm:ss a");
    tripEndtime = moment(tripEndtime, "hh:mm:ss a");
    //var duration1 = endTime.diff(startTime, 'hours')

    var duration = moment(tripEndtime).diff(tripstartTime, "minutes");
    // var hours = parseInt(duration.asHours());
    console.log("duration--", duration);
    let totalminutes = duration + "minutes";
    let data = {
      jobid: body.jobid,
      fare: transection.Amount,
      driverid: jobrequetUpdate.driverdetails,
      pickupAddres: jobrequetUpdate.pickupLocation.address,
      dropAddress: jobrequetUpdate.dropLocation.address,
      ETA: totalminutes,
    };

    if (jobrequetUpdate) {
      utility.sucesshandler(res, "Trip End", data);
    } else {
      utility.errorhandler(res, "There is some issue to Start the trip");
    }
  } catch (e) {
    console.log("e", e);
    //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
async function adminRiderequest(req, res) {
  try {
   // console.log("body--",req,body);
    let FinalData={
      pickuptime :"",
fare : 0,
user_name : "",
totalspent : 0,
phonenumber : "",
usertype : "",
dropLocation : "",
lasttrip : "",
pickupLocation : "",
message : "",
title : "",
jobtype : "",
totaltrips : 0,
jobid : "",
riderimage : "",
riderrating :"",
eta : "",
user_id : "",
action : "",
   }

    var pickupareacode = null;
    var dropareacode = null;
    var eta = "";
    var rating = 0;
    var userimage = "";
    var jobid = "";
    let body = req.body ? req.body : {};
    console.log("body---", body);

    let availabledrivers = await userModel
      .find({
        isDeleted: false,
        status: false,
        userType: "Driver",
        onlinestatus: "1",
        isAvailable: true,
      })
      .select({ _id: 1 });
    console.log("avlaaaa--", availabledrivers);

    let driverIds = availabledrivers.map((x) => {
      return x._id;
    });
    const getLatestjob = await jobmodel.findOne({ user:req.body.riderid,jobtype:{$eq:"Coverjob" } }).sort({ _id: -1 })
    //let getLatestjob = await jobModel.findOne({jobtype:"Coverjob"}).sort({ _id: -1 });
    //console.log("late--", getLatestjob);
    
    jobid = getLatestjob._id;
    var tranection = await transactionmodel.findOne({jobid:jobid})
    console.log({tranection});
    if (getLatestjob.duration != null) {
      eta = getLatestjob.duration;
    }
    let userdetails = await userModel.findOne({
      isDeleted: false,
      userType: "Normal",
      _id: body.riderid,
    });
    // console.log("userd--",userdetails);
    // if (userdetails.imagefile != null) {
    //   userimage = userdetails.imagefile;
    // }
    let getAreaCode = await areacodemodel.findOne({
      areaname: getLatestjob.pickupLocation.address,
    });
    // console.log("Areaco--",getAreaCode.areacode);
    if (getAreaCode != null) {
      pickupareacode = getAreaCode.areacode;
    }
    let getdropAreaCode = await areacodemodel.findOne({
      areaname: getLatestjob.dropLocation.address,
    });
    //  console.log("dropAdd--",getdropAreaCode.areacode);
    if (getdropAreaCode != null) {
      dropareacode = getdropAreaCode.areacode;
    }
    console.log(body, userdetails, "body++++");
    let condition = {
      currentlocation: {
        type: "Point",
        coordinates: [
          getLatestjob.pickupLocation.coordinates[0],
          getLatestjob.pickupLocation.coordinates[1],
        ],
      },
    };
    console.log(
      "coordinae--",
      parseFloat(getLatestjob.pickupLocation.coordinates[0]),
      getLatestjob.pickupLocation.coordinates[1]
    );
    let longitude = getLatestjob.pickupLocation.coordinates[0];
    let latitude = getLatestjob.pickupLocation.coordinates[1];
    console.log("latlong--", longitude, latitude);
    let availableDrivers = await userModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          // maxDistance: 50000,
          spherical: true,
        },
      },

      {
        $match: { _id: { $in: driverIds } },
      },

      { $limit: 3 },

      {
        $project: {
          name: 1,
          "currentlocation.address": 1,
          distance: 1,
          deviceInfo: 1,
        },
      },
    ]);

    console.log(availableDrivers, "availableDrivers");

    if (availabledrivers.length > 0) {
      let saveObj = {
        dateOfJournery: new Date(),
        riderdetails: body.riderid,
        pickupTime: new Date(),
        pickupLocation: {
          coordinates: [
            getLatestjob.pickupLocation.coordinates[0],
            getLatestjob.pickupLocation.coordinates[1],
          ],
          type: "Point",
          address: getLatestjob.pickupLocation.address,
        },
        dropLocation: {
          coordinates: [
            getLatestjob.dropLocation.coordinates[1],
            getLatestjob.dropLocation.coordinates[0],
          ],
          type: "Point",
          address: getLatestjob.dropLocation.address,
        },
        requestAction: "Pending",
      };
      var TotalAmount = 0;
      var totalDistance = 0;
      var TotalTrips = 0;
      let sum = await transectionModel
        .find({
          user: req.body.riderid,
        })
        .populate(" jobid user driverdetails review ")
        .lean();
      // console.log("sumdata---",sum);
      sum.forEach((element) => {
        //totalDistance = parseFloat(element.jobid.distance);
        // console.log("id--", element.jobid._id);
        console.log("diss");
        // totalDistance = totalDistance + totalDistance;
        // TotalAmount = TotalAmount + parseFloat(element.Amount);
        // TotalTrips = TotalTrips + 1;
        //      // Name   = element.driverdetails.name
        //       profileImage =element.driverdetails.imagefile
        //      TotalTrips=  TotalTrips +1;
        //        comp =element.createdAt.getDate()
        //        if(comp == tDate)
        //    {
        //        TodayAmount = TodayAmount+parseFloat(element.Amount)
        //    }
      });
      console.log("totalDis--", totalDistance);
      var amount = 0;
      var A = "";
      function ETA(a) {
        A = a;
        console.log("aa", A);
      }

      var lastjob = "";

      console.log("job--", getLatestjob.pickupLocation.coordinates[0]);
      let getLastjob = await transectionModel
        .findOne()
        .populate("jobid")
        .sort({ _id: 1 });
      // console.log("job--",getLastjob);
      if (getLatestjob.createdAt != null) {
        lastjob = getLastjob.createdAt;
      }
      //amount = getLatestjob.Amount;
      console.log("am--###########################################", getLatestjob._id);
      console.log("eta", saveObj);
      // let createjob = await new jobModel(saveObj).save();

      async.eachSeries(
        availableDrivers,
        (item, callback) => {
          //  console.log(item._id, createjob._id, "+++++++++++");

          //    var checkrequest = await jobModel.findOne({_id:createjob._id})

          //    if(checkrequest.requestAction=='Accepted')
          //    {
          //          callback('Break the loop')
          //    }

          //    else{

          // if (userdetails.rating != null) {
          //   rating = userdetails.rating;
          // }
          // console.log("rating--",rating);

          userModel
            .findOne({
              _id: item._id,
              isDeleted: false,
              status: false,
              onlinestatus: "1",
              userType: "Driver",
            })
            .select({ _id: 1, isAvailable: 1 })
            .lean()
            .exec((err, result) => {
              console.log("ASSS--", A);
              if (result.isAvailable == true) {
                console.log(item._id, "item iddi");
                var arr = item.deviceInfo;
                let deviceToken = arr[arr.length - 1].deviceToken;
                let deviceType = arr[arr.length - 1].deviceType;
                console.log("devictype--", deviceType);
                console.log("devictoken--", deviceToken);
                if (deviceType == "Android") {
                  console.log("in android");
                  var message = {
                    to: deviceToken,
                    data: {
                      message: "Cover Job",
                      title: "RideRequest",
                      // "body":`${data.sender} send you a message`,
                      user_id: userdetails._id ? userdetails._id :"",
                      user_name: userdetails.name ? userdetails.name :"",
                    
                      action: "RideRequest",
                      pickupLocation: {
                        longitude:
                          getLatestjob.pickupLocation.coordinates[0],
                        latitude:
                          getLatestjob.pickupLocation.coordinates[1],
                        pickupareacode: 23,
                        // /type:'Point'
                        address: getLatestjob.pickupLocation.address,
                      },
                      dropLocation: {
                        longitude:
                          getLatestjob.dropLocation.coordinates[0],
                        latitude:
                          getLatestjob.dropLocation.coordinates[1],
                        dropareacode: 24,
                        // coordinates:[body.dropLocation.long,body.dropLocation.lat],
                        // type:'Point',
                        address: getLatestjob.dropLocation.address,
                      },

                      totaltrips: TotalTrips ? TotalTrips :"",
                      totalspent: TotalAmount ? TotalAmount :"",
                      jobtype: getLatestjob.jobtype ? getLatestjob.jobtype :"",
                      dateOfJourney:getLatestjob.dateOfJourney ? getLatestjob.dateOfJourney : "",
                      lasttrip: lastjob ? lastjob :"",
                      Eta: eta ? eta :"",
                      riderimage: userdetails.imagefile ? userdetails.imagefile : "",
                      riderrating: userdetails.rating ? userdetails.rating : "",
                      usertype: userdetails.userType,
                      phonenumber: userdetails.phonenumber
                        ? userdetails.phonenumber
                        : "",

                      jobid: jobid ? jobid :"",
                      pickuptime: getLatestjob.pickUptime ? getLatestjob.pickUptime :"",

                      fare: tranection.Amount ? tranection.Amount :"",
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
                      body: "Ride Reqest",
                      sound: "default",
                      data: {
                        message: "Cover Job",
                        title: "RideRequest",
                        // "body":`${data.sender} send you a message`,
                        user_id: userdetails._id ? userdetails._id :"",
                        user_name: userdetails.name ? userdetails.name :"",
                      
                        action: "RideRequest",
                        pickupLocation: {
                          longitude:
                            getLatestjob.pickupLocation.coordinates[0],
                          latitude:
                            getLatestjob.pickupLocation.coordinates[1],
                          pickupareacode: 23,
                          // /type:'Point'
                          address: getLatestjob.pickupLocation.address,
                        },
                        dropLocation: {
                          longitude:
                            getLatestjob.dropLocation.coordinates[0],
                          latitude:
                            getLatestjob.dropLocation.coordinates[1],
                          dropareacode: 24,
                          // coordinates:[body.dropLocation.long,body.dropLocation.lat],
                          // type:'Point',
                          address: getLatestjob.dropLocation.address,
                        },
  
                        totaltrips: TotalTrips ? TotalTrips :"",
                        totalspent: TotalAmount ? TotalAmount :"",
                        jobtype: getLatestjob.jobtype ? getLatestjob.jobtype :"",
                        dateOfJourney:getLatestjob.dateOfJourney ? getLatestjob.dateOfJourney : "",
                        lasttrip: lastjob ? lastjob :"",
                        Eta: eta ? eta :"",
                        riderimage: userdetails.imagefile ? userdetails.imagefile : "",
                        riderrating: userdetails.rating ? userdetails.rating : "",
                        usertype: userdetails.userType,
                        phonenumber: userdetails.phonenumber
                          ? userdetails.phonenumber
                          : "",
  
                        jobid: jobid ? jobid :"",
                        pickuptime: getLatestjob.pickUptime ? getLatestjob.pickUptime :"",
  
                        fare: tranection.Amount ? tranection.Amount :"",
                      },
                    },
                  };
                  console.log("ios--", message);
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

                setTimeout(async () => {
                  var checkrequest = await jobModel.findOne({
                    _id: getLatestjob.jobid._id
                  });

                  if (checkrequest.requestAction == "Accepted") {
                    callback("Break the loop");
                  } else {
                    callback();
                  }
                }, 34000);
              } else {
                callback();
              }
            });
        },
        async (err, result) => {
          if (err) {
            console.log(err);
          } else {
            let notificationData = {
              message: `${userdetails.name} has ride request`,
              from: `${userdetails._id}`,
              type: 'system'
            };
            await new Notification(notificationData).save();
            console.log(result, "result");
          }
        }
      );
      return res.json({ code: 200, message: "Request successfull" });

      // console.log(availableDrivers, 'availableDrivers')
    } else {
      return res.json({
        code: 400,
        message: "No Nearest Driver Available",
        data: [],
      });
    }
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(e);
  }
}

// function adminAddDespatchJobs(req, res) {
//   async function despatch_job() {
//     try {
//       let midlocations = [];
//       let mid = req.body.midlocation;
//       for (i in mid) {
//         console.log(mid[i].location);
//         midlocations.push({
//           location: mid[i].location,
//           coordinates: [
//             mid[i].latitude,
//             mid[i].longitude
//           ]
//         })

//       }
//       // console.log("midlocation",midlocations);
//       let dataObj = {};
//       dataObj.dateOfJourney = req.body.dateOfJourney;
//       dataObj.pickUptime = req.body.timeOfJourney;
//       dataObj.jobtype = "DespatchJob";
//       dataObj.pickupLocation = {
//         coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
//         address: req.body.pickupLocation.address,
//       };
//       dataObj.dropLocation = {
//         coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
//         address: req.body.dropLocation.address,
//       }
//       dataObj.midlocation = midlocations
//       dataObj.driverdetails = req.body.driverdetails;
//       console.log("dataObj", dataObj);
//       let despatchObj = new jobmodel(dataObj)
//       let data = await despatchObj.save()
//       console.log("despatchObj", data);
//       if (data) {
//         utility.sucesshandler(res, 'Add despatch job successfully', despatchObj);

//       } else {
//         utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
//       }
//     }
//     catch (e) {
//       console.log("e", e)
//     }
//   }
//   despatch_job(function () { });
// }


function adminGetDespatchJobs(req, res) {
  async function asy_init() {
    try {
      // console.log("in all");
      let condition = {
        jobtype: "DispatchJob",

      };
      let driverlist = await jobModel.find(condition).populate("user driverdetails", "name phonenumber email imagefile userType carRegNo").sort({ created_at: -1 });
      // let driverlist = driverstatusmodel.find();
      // console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.despatchJobDataFetched,
          driverlist
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      return Response(
        res,
        constant.statusCode.internalservererror,
        constant.messages.SOMETHING_WENT_WRONG,
        e
      );
    }
  }
  asy_init();
}

// function adminAddDespatchJobs(req, res) {
//   console.log("req", req.body.pickupLocation.longitude)
//   async function despatch_job() {
//     try {
//       let midlocations = [];
//       let dayOfJourney = [];
//       let doj = req.body.dayOfJourney
//       let mid = req.body.midlocation;
//       for (i in mid) {
//         console.log("dfdf", mid[i].loc);
//         midlocations.push({
//           location: mid[i].loc,
//           coordinates: [
//             mid[i].lat,
//             mid[i].lng
//           ]
//         })
//       }


//       for (i in doj) {
//         dayOfJourney.push(doj[i].day)
//       }
//       // console.log("midlocation",midlocations);
//       let dataObj = {};
//       dataObj.user=req.body.user;
//       dataObj.email=req.body.email;
//       dataObj.phonenumber=req.body.phonenumber;
//       dataObj.dateOfJourney = req.body.dateOfJourney;
//       dataObj.pickUptime = req.body.timeOfJourney;
//       dataObj.cabnub = req.body.cabNumber;
//       dataObj.jobtype = "DespatchJob";
//       dataObj.distance = req.body.totaldistance;
//       dataObj.fare = req.body.price;
//       dataObj.pickupLocation = {
//         coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
//         address: req.body.pickupLocation.address,
//       };
//       dataObj.dropLocation = {
//         coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
//         address: req.body.dropLocation.address,
//       }
//       dataObj.midlocation = midlocations;
//       dataObj.dayOfJourney = dayOfJourney;
//       dataObj.driverdetails = req.body.driverdetails;
//       console.log("dataObj", dataObj);
//       let despatchObj = new jobmodel(dataObj)
//       let data = await despatchObj.save()
//       console.log("despatchObj", data);
//       if (data) {
//         utility.sucesshandler(res, 'Add despatch job successfully', despatchObj);

//       } else {
//         utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
//       }
//     }
//     catch (e) {
//       console.log("e", e)
//     }
//   }
//   despatch_job(function () { });
// }
function adminAddDespatchJobs(req, res) {
  async function despatch_job() {
    try {
      let FinalData={
        pickuptime :"",
  fare : 0,
  user_name : "",
  totalspent : 0,
  phonenumber : "",
  usertype : "",
  dropLocation : "",
  lasttrip : "",
  pickupLocation : "",
  message : "",
  title : "",
  jobtype : "",
  totaltrips : 0,
  jobid : "",
  riderimage : "",
  riderrating :"",
  eta : "",
  user_id : "",
  action : "",
     }

      const { body } = req;
      const { user } = body;
      var foundedUser
      console.log("body--", req.body);
      let condition = {};

      if (user.email) {
        condition['email'] = req.body.user.email
      }

      if (user.phonenumber) {
        condition['phonenumber'] = req.body.user.phonenumber
      }
      console.log("email---",req.body.user.email);
      if(req.body.mailby ==='Email'){
       foundedUser  = await userModel.findOne(
      
          {email:req.body.user.email},{userType:"Normal"}
    
      )
    }
    else{
           
        foundedUser  = await userModel.findOne(
       
           {phonenumber:req.body.user.phonenumber},{userType:"Normal"}
     
       )
     
      console.log("Phone+---",foundedUser);
    }

      // let foundedUser = await userModel.findOne({
      //   $or: [
      //     { email: "rahul11@gmail.com" },
      //     { phonenumber: req.body.user.phonenumber }
      //   ],
      //   $and: [{
      //     userType: "Normal"
      //   }]
      // });
      console.log("use------------------------",foundedUser);

      let userID = ''
      if (!isEmpty(foundedUser)) {
        const { _id } = foundedUser;
        userID = _id;
        if (req.body.user.phonenumber) {
          await userModel.findByIdAndUpdate(_id, { phonenumber: req.body.user.phonenumber })
        }
      } else {
        let usersave = user;
        usersave["userType"] = "Normal";
        let saveobj = new userModel(usersave)
        let res = await saveobj.save()
        userID = res._id
      }
  //let existingDriver = await jobModel.findOne()

      let midlocations = [];
      let dayOfJourney = [];
      let doj = req.body.dayOfJourney
      let mid = req.body.midlocation;
      for (i in mid) {
        // console.log("dfdf", mid[i].loc);
        midlocations.push({
          location: mid[i].loc,
          coordinates: [
            mid[i].lat,
            mid[i].lng
          ]
        })
      }

      for (i in doj) {
        dayOfJourney.push(doj[i].day)
      }
      let dataObj = {};
      let transObj = {};
      dataObj.user = mongoose.Types.ObjectId(userID);
      dataObj.dateOfJourney = req.body.dateOfJourney;
      dataObj.pickUptime = req.body.timeOfJourney;
      dataObj.mailby = req.body.mailby
      dataObj.jobtype = "DispatchJob";
      // dataObj.distance = req.body.totaldistance;
      dataObj.tripstatus = "Upcoming"
      dataObj.distance = req.body.totaldistance;
      dataObj.duration = req.body.duration;
      dataObj.fare = req.body.fare;
      dataObj.pickupLocation = {
        coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
        address: req.body.pickupLocation.address,
      };
      dataObj.dropLocation = {
        coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
        address: req.body.dropLocation.address,
      }
      dataObj.midlocation = midlocations;
      dataObj.dayOfJourney = dayOfJourney;
      dataObj.driverdetails = mongoose.Types.ObjectId(req.body.driverdetails);


      transObj.Amount = req.body.price;
      transObj.fare = req.body.fare;
      transObj.tax = 3;
      // let joobid = await jobmodel.findOne({user:req.body.userID}).sort({_id:-1})
      let despatchObj = new jobmodel(dataObj)
      let data = await despatchObj.save()
      console.log("jobid--", data._id)
      transObj.user = dataObj.user
      transObj.jobid = data._id

      let transectionobj = new transactionmodel(transObj)

      let data1 = await transectionobj.save();
      if (data) {
        let customerdata = await userModel.findById(userID);
        let DriverData = await userModel.findById(data.driverdetails);

        var userDetails = {
          email: customerdata.email,
          name: customerdata.name,
          phonenumber: customerdata.phonenumber,
          pickupLocation: data.pickupLocation,
          dropLocation: data.dropLocation,
          dayOfJourney: data.dayOfJourney,
          dateOfJourney: req.body.dateOfJourney,
          pickUptime: req.body.timeOfJourney,

          distance: data.distance,
          fare: data.fare,
          midlocation: data.midlocation,
          driverName: DriverData.name,
          licencenumber: DriverData.licencenumber,

        };
        const driverDetails = await userModel.findOne({ userType: 'Driver', _id: mongoose.Types.ObjectId(req.body.driverdetails) });
        const userDetails1 = await userModel.findOne({ _id: mongoose.Types.ObjectId(userID) });
<<<<<<< HEAD
        const curentBooking = await jobmodel.findOne({ user: mongoose.Types.ObjectId(userID) }).sort({ _id: -1 })
        
      
      
      
=======
        const curentBooking = await jobmodel.findOne({ user: mongoose.Types.ObjectId(userID),jobtype:{$eq:"DispatchJob" } }).sort({ _id: -1 })
>>>>>>> sanjay
        console.log("bookingd--", curentBooking.jobid);
        var arr = driverDetails.deviceInfo;
        if (!isEmpty(arr)) {
          let deviceToken = arr[arr.length - 1].deviceToken;
          let deviceType = arr[arr.length - 1].deviceType;
          if (deviceType == "Android") {
            console.log("in android edit and add???????????????????????????");
            var message = {
              to: deviceToken,
              data: {
                message: "Dispatch Job",
                title: "DispatchJob",
                user_id: userDetails1._id ? userDetails1._id :"",
                user_name: userDetails1.name ? userDetails1.name :"",
                usertype:userDetails1.userType ? userDetails1.userType :"",
                action: "DispatchJob",
                pickupLocation: {
                  longitude:
                    dataObj.pickupLocation.coordinates[0],
                  latitude:
                    dataObj.pickupLocation.coordinates[1],
                  riderLink: constant.weburl.url + "/ride" + curentBooking._id,
                  //pickupareacode: pickupareacode,
                  address: dataObj.pickupLocation.address,
                },
                dropLocation: {
                  longitude:
                    dataObj.dropLocation.coordinates[0],
                  latitude:
                    dataObj.dropLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: dataObj.dropLocation.address,
                },
                // usertype: driverDetails.userType,
                phonenumber: userDetails1.phonenumber ? userDetails1.phonenumber :'',
                jobid: curentBooking._id ? curentBooking._id :"",
                jobtype :curentBooking.jobtype ,
                fare : req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2) ,
                pickuptime: dataObj.pickUpTime,
                dateOfJourney: req.body.dateOfJourney ? req.body.dateOfJourney : "",
                pickuptime: req.body.timeOfJourney ? req.body.timeOfJourney :FinalData.pickuptime,
            
                Eta: "",
                lasttrip: "",
                totalspent: "",
                riderimage: userDetails1.imagefile ? userDetails1.imagefile : FinalData.riderimage,
                riderrating:userDetails1.riderrating ? userDetails1.riderrating :FinalData.riderrating,
                totaltrips: "",


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
          } else if (deviceType == "IOS") {
            console.log("in android edit and add???????????????????????????");
            var message = {
              to: deviceToken,
              notification: {
                badge: "1",
                body: "Dispatch Job",
                sound: "default",
                data: {
                  user_id: userDetails1._id ? userDetails1._id :"",
                user_name: userDetails1.name ? userDetails1.name :"",
                usertype:userDetails1.userType ? userDetails1.userType :"",
                action: "DispatchJob",
                pickupLocation: {
                  longitude:
                    dataObj.pickupLocation.coordinates[0],
                  latitude:
                    dataObj.pickupLocation.coordinates[1],
                  riderLink: constant.weburl.url + "/ride" + curentBooking._id,
                  //pickupareacode: pickupareacode,
                  address: dataObj.pickupLocation.address,
                },
                dropLocation: {
                  longitude:
                    dataObj.dropLocation.coordinates[0],
                  latitude:
                    dataObj.dropLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: dataObj.dropLocation.address,
                },
                // usertype: driverDetails.userType,
                phonenumber: userDetails1.phonenumber ? userDetails1.phonenumber :'',
                jobid: curentBooking._id ? curentBooking._id :"",
                jobtype :curentBooking.jobtype ,
                fare : req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2) ,
                pickuptime: dataObj.pickUpTime,
                dateOfJourney: req.body.dateOfJourney ? req.body.dateOfJourney : "",
                pickuptime: req.body.timeOfJourney ? req.body.timeOfJourney :FinalData.pickuptime,
            
                Eta: "",
                lasttrip: "",
                totalspent: "",
                riderimage: userDetails1.imagefile ? userDetails1.imagefile : FinalData.riderimage,
                riderrating:userDetails1.riderrating ? userDetails1.riderrating :FinalData.riderrating,
                totaltrips: "",

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
                async (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    let notificationData = {
                      message: `${userDetails1.name} has ride request`,
                      from: `${userDetails1._id}`,
                      type: 'system'
                    };
                    await new Notification(notificationData).save();
                    console.log(result, "result");
                  }
                }
              }
            });
          } else {
            console.log("Device not found");
          }

        }
        if (data.mailby == 'Email') {
          console.log("hit", userDetails);
          emailtemplate
            .findOne({ findBy: "Dispatch_job" })
            .exec(async (err, emaildataresult) => {
              console.log("emaildataresult", emaildataresult);
              if (err) {
                throw new Error(err);
              } else if (emaildataresult) {
                let selectedSubject = emaildataresult.subject;
                let selectedContent = emaildataresult.content;
                const template = handlebars.compile(
                  selectedContent.replace(/\n|\r/g, "")
                );
                let message = "<title>Totalcabsmobility</title><link href=\"https://fonts.googleapis.com/css?family=Open+Sans:400,600,700\" rel=\"stylesheet\"><table width=\"900\" cellpadding=\"100\" cellspacing=\"0\" style=\"background-color:#fffff;margin:0 auto;text-align:center;\"><tbody><tr><td><tablestyle=\"width:100%;background-color:#ffffff;border-radius:3px;box-shadow:0 0 20px 0 rgba(0,0,0,0.15)\"cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td><table style=\"width:100%;border-top-left-radius:5px;border-top-right-radius:5px;\"cellpadding=\"15\" cellspacing=\"0\"><tbody><tr><td style=\"background-color:#08bf6d\"><h2style=\"font-family:'Open Sans', sans-serif;font-weight:400;background:none;color:#ffffff;font-size:22px;margin-bottom:0;margin-top:5px;text-align:left;\">Totalcabsmobility</h2></td></tr><tr><td><h2style=\"font-family: &quot;Open Sans&quot;, sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 0px; margin-top: 5px;\"><font color=\"#08bf6d\">Hi," + userDetails.name + " &nbsp <br> " + " Date Of Journey:" + userDetails.dateOfJourney + " " + " Pickup time :" + userDetails.pickUptime + " " + "Day Of Journey:" + userDetails.dayOfJourney + " " + " Pickup Location:" + userDetails.pickupLocation.address + " " + "Drop Location:" + userDetails.dropLocation.address + ";  " + "  Driver Name:" + userDetails.driverName + " " + "Driver license:" + userDetails.licencenumber + " " + "Fare:" + userDetails.fare + " " + "Distance :" + userDetails.distance + "" + "routerLink:" + constant.weburl.url + "/ride/" + curentBooking.jobid + "  </font></h2><spanstyle=\"border-bottom:1px solid #dfdfdf;width:300px;display:block;margin:0 auto;\">&nbsp;</span></td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#000000;font-size:14px;font-weight:600;\"><span style=\"font-size: 15px;\"></span><spanstyle=\"font-size: 17px;\"></span><spanstyle=\"font-size: 17px;\">Your Dispatch job has been submitted successfully.</span>&nbsp;</td></tr><tr><td>We look forward to give you our best.</td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#adadad;font-size:14px;\"></td></tr><tr><td><pstyle=\"font-family:'Open Sans', sans-serif;color:#818181;font-size:12px;font-weight:400;\">@copyright 2020. All Right Reserved.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
                utility.sendmail(
                  userDetails.email,
                  selectedSubject,
                  message,
                  async (err, finalresult) => {
                    if (err) {
                      throw new Error(err);
                    }
                  }
                );
                let notificationData = {
                  message: `${userDetails1.name} has dispatchJob request`,
                  from: `${userDetails1._id}`,
                  type: 'system'
                };
                let response = await new Notification(notificationData).save();
                console.log(notificationData, "result");
                console.log(response, "response");


                utility.sucesshandler(res, 'Add despatch job successfully', despatchObj);
              }
            });
        } else if (data.mailby == 'Phone') {
          let contentBody = `Hi ${userDetails.name},

                              Date Of Journey: ${userDetails.dateOfJourney} 
                              Pickup Time : ${userDetails.pickUptime} 
                              Pickup Location: ${userDetails.pickupLocation.address} 
                              Drop Location: ${userDetails.pickupLocation.address}
                              Driver Name: ${userDetails.driverName} 
                              Driver license: ${userDetails.licencenumber} 
                              Fare: ${userDetails.fare}
                              Distance :${userDetails.distance} KM
                              
                              You can see the route of the journey from the link given below: 
                              ${constant.weburl.url}/ride/${curentBooking.jobid}`

          let message = client.messages.create({
            body: contentBody,
            from: +12059463843,
            to: `+64${userDetails.phonenumber}`,
          });
          console.log("message body--", message);
          let notificationData = {
            message: `${userDetails1.name} has dispatchJob request`,
            from: `${userDetails1._id}`,
            type: 'system'
          };
          let response = await new Notification(notificationData).save();
          console.log(notificationData, "result");
          console.log(response, "response");


          utility.sucesshandler(res, 'Add despatch job successfully', despatchObj);


        } else if (data.mailby == '') {
          console.log("in null");
          utility.sucesshandler(res, 'Add despatch job successfully', despatchObj);
        }
        else {
          utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
      }
    }

    catch (e) {
      console.log("e", e)
      utility.errorhandler(res, "Someting Went Wrong!");
    }
  }
  despatch_job(function () { });
}
function updatecoverJob(req, res) {
  async function cover_job() {
    try {

      const { key, loc, id } = req.body;
      const { body } = req;
      const { user } = body;
      console.log("body--", req.body);
      let condition = {};
      
      // if (user.email) {
      //   condition['email'] = user.email
      // }

      // if (user.phonenumber) {
      //   condition['phonenumber'] = user.phonenumber
      // }
      console.log("email", req.body.user.email);
      if(req.body.mailby ==='Email'){
        foundedUser  = await userModel.findOne(
       
           {email:req.body.user.email},{userType:"Normal"}
     
       )
     }
     else{
            
         foundedUser  = await userModel.findOne(
        
            {phonenumber:req.body.user.phonenumber},{userType:"Normal"}
      
        )
      
       console.log("Phone+---",foundedUser);
     }
 

      let userID = ''
      if (!isEmpty(foundedUser)) {
        const { _id } = foundedUser;
        userID = _id;
        if (condition.phonenumber) {
          await userModel.findByIdAndUpdate(_id, { phonenumber: condition.phonenumber })
        }
      } else {
        let usersave = user;
        let saveobj = new userModel(usersave)
        usersave["userType"] = "Normal";
        let res = await saveobj.save()
        userID = res._id
      }

      // console.log({user});
      let dataObj = {};
      let tObj = {};

      dataObj.user = userID;
      dataObj.carType = req.body.carType;
      dataObj.distance = req.body.distance;
      dataObj.duration = req.body.duration;
      dataObj.phonenumber = req.body.phonenumber;
      dataObj.dateOfJourney = req.body.dateOfJourney;
      dataObj.pickUptime = req.body.timeOfJourney;
      dataObj.fare = req.body.price;

      dataObj.carType = req.body.carType;
      dataObj.jobtype = "Coverjob";
      dataObj.pickupLocation = {
        type: "Point",
        coordinates: [
          req.body.pickupLocation.longitude,
          req.body.pickupLocation.latitude,
        ],
        address: req.body.pickupLocation.address,
      };

      dataObj.dropLocation = {
        type: "Point",
        coordinates: [
          req.body.dropLocation.longitude,
          req.body.dropLocation.latitude,
        ],
        address: req.body.dropLocation.address,
      };
      dataObj.riderdetails = mongoose.Types.ObjectId(userID);


      tObj.tax = req.body.tax || 3;
      tObj.fare = req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2);
      tObj.Amount = req.body.price;
      tObj.type = req.body.paymentType;

      let customerObj = await jobmodel.findOneAndUpdate(({_id:req.body._id}) ,dataObj );

     // tObj.jobid = mongoose.Types.ObjectId(customerObj.userData._id);
     // tObj.user = mongoose.Types.ObjectId(userID);
      console.log("customerr---", customerObj);
      let transectionObj = await transectionModel( ({jobid:req.body._id}),tObj
      );
      if (transectionObj) {

        let customerdata = await userModel.findById({ _id: mongoose.Types.ObjectId(userID) })
        console.log("data--", customerdata);

        var userDetails = {
          email: customerdata.email,
          name: customerdata.name,
          phonenumber: customerdata.phonenumber,
          pickupLocation: dataObj.pickupLocation,
          dropLocation: dataObj.dropLocation,
          dayOfJourney: dataObj.dayOfJourney,
          dateOfJourney: req.body.dateOfJourney,
          pickUptime: req.body.timeOfJourney,
          distance: dataObj.distance,
          fare: dataObj.fare
        };

        const curentBooking = await jobmodel.findOne({ user: mongoose.Types.ObjectId(userID) }).sort({ _id: -1 })
        console.log("cover bookingd--", curentBooking.jobid);
        if (!req.body.mailby || (req.body.mailby && req.body.mailby == 'Email')) {
          // console.log("hit", userDetails);
          emailtemplate
            .findOne({ findBy: "Dispatch_job" })
            .exec(async (err, emaildataresult) => {
              console.log("emaildataresult", emaildataresult);
              if (err) {
                throw new Error(err);
              } else if (emaildataresult) {
                let selectedSubject = emaildataresult.subject;
                let selectedContent = emaildataresult.content;
                const template = handlebars.compile(
                  selectedContent.replace(/\n|\r/g, "")
                );
                let message = "<title>Totalcabsmobility</title><link href=\"https://fonts.googleapis.com/css?family=Open+Sans:400,600,700\" rel=\"stylesheet\"><table width=\"900\" cellpadding=\"100\" cellspacing=\"0\" style=\"background-color:#fffff;margin:0 auto;text-align:center;\"><tbody><tr><td><tablestyle=\"width:100%;background-color:#ffffff;border-radius:3px;box-shadow:0 0 20px 0 rgba(0,0,0,0.15)\"cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td><table style=\"width:100%;border-top-left-radius:5px;border-top-right-radius:5px;\"cellpadding=\"15\" cellspacing=\"0\"><tbody><tr><td style=\"background-color:#08bf6d\"><h2style=\"font-family:'Open Sans', sans-serif;font-weight:400;background:none;color:#ffffff;font-size:22px;margin-bottom:0;margin-top:5px;text-align:left;\">Totalcabsmobility</h2></td></tr><tr><td><h2style=\"font-family: &quot;Open Sans&quot;, sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 0px; margin-top: 5px;\"><font color=\"#08bf6d\">Hi," + userDetails.name + " &nbsp <br> " + " Date Of Journey:" + userDetails.dateOfJourney + " " + " Pickup time :" + userDetails.pickUptime + " " + "Day Of Journey:" + userDetails.dayOfJourney + " " + " Pickup Location:" + userDetails.pickupLocation.address + " " + "Drop Location:" + userDetails.dropLocation.address + ";  " + "  Driver Name:" + userDetails.driverName + " " + "Driver license:" + userDetails.licencenumber + " " + "Fare:" + userDetails.fare + " " + "Distance :" + userDetails.distance + "" + "routerLink:" + constant.weburl.url + "/ride/" + curentBooking.jobid + "  </font></h2><spanstyle=\"border-bottom:1px solid #dfdfdf;width:300px;display:block;margin:0 auto;\">&nbsp;</span></td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#000000;font-size:14px;font-weight:600;\"><span style=\"font-size: 15px;\"></span><spanstyle=\"font-size: 17px;\"></span><spanstyle=\"font-size: 17px;\">Your Dispatch job has been submitted successfully.</span>&nbsp;</td></tr><tr><td>We look forward to give you our best.</td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#adadad;font-size:14px;\"></td></tr><tr><td><pstyle=\"font-family:'Open Sans', sans-serif;color:#818181;font-size:12px;font-weight:400;\">@copyright 2020. All Right Reserved.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
                utility.sendmail(
                  customerdata.email,
                  selectedSubject,
                  message,
                  async (err, finalresult) => {
                    if (err) {
                      throw new Error(err);
                    }
                  }
                );
                let notificationData = {
                  message: `${customerdata.name} has CoverJob request`,
                  from: `${customerdata._id}`,
                  type: 'system'
                };
                let response = await new Notification(notificationData).save();
                console.log(notificationData, "result");
                console.log(response, "response");



                utility.sucesshandler(res, 'Add Cover job update successfully', customerdata);
              }
            });
        }
        else if (req.body.mailby == 'Phone') {
          let contentBody = `Hi ${userDetails.name},
                              Date Of Journey: ${userDetails.dateOfJourney} 
                              Pickup Time : ${userDetails.pickUptime} 
                              Pickup Location: ${userDetails.pickupLocation.address} 
                              Drop Location: ${userDetails.pickupLocation.address}
                              Fare: ${userDetails.fare}
                              Distance :${userDetails.distance} KM
                              
                              You can see the route of the journey from the link given below: 
                              ${constant.weburl.url}/ride/${curentBooking.jobid}`

          let message = await client.messages.create({
            body: contentBody,
            from: +12059463843,
            to: `+91${customerdata.phonenumber}`,
          });

          if (message) {
            let notificationData = {
              message: `${customerdata.name} has update CoverJob request`,
              from: `${customerdata._id}`,
              type: 'system'

            };
            let response = await new Notification(notificationData).save();
            console.log(notificationData, "result");
            console.log(response, "response");

            console.log("in mess----------------------------------------------------");



            utility.sucesshandler(res, 'Add Cover Job update successfully', customerObj);
          }

        }
        else if (data.mailby == '') {
          console.log("in null");
          utility.sucesshandler(res, 'Add Cover job successfully', customerObj);
        }
        else {
          utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
      } else {
        utility.error(
          res,
          constantmessage.validationMessages.intenalError
        );
      }
    } catch (e) {
      console.log("e", e);
      utility.errorhandler(res, constantmessage.validationMessages.intenalError)
      //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }

  cover_job(function () { });
}
function updateDispatchJob(req, res) {
  async function _updateDispatchJob() {
    try {
      let FinalData={
        pickuptime :"",
  fare : 0,
  user_name : "",
  totalspent : 0,
  phonenumber : "",
  usertype : "",
  dropLocation : "",
  lasttrip : "",
  pickupLocation : "",
  message : "",
  title : "",
  jobtype : "",
  totaltrips : 0,
  jobid : "",
  riderimage : "",
  riderrating :"",
  eta : "",
  user_id : "",
  action : "",
     }

      const { body } = req;
      const { user } = body;

      let condition = {};

      if (user.email) {
        condition['email'] = user.email
      }

      if (user.phonenumber) {
        condition['phonenumber'] = user.phonenumber
      }

      let foundedUser = await userModel.findOne({
        $or: [
          { email: condition.email },
          { phonenumber: condition.phonenumber }
        ],
        $and: [{
          userType: "Normal"
        }]
      });


      let userID = ''
      if (!isEmpty(foundedUser)) {
        const { _id } = foundedUser;
        userID = _id;
        if (condition.phonenumber) {
          await userModel.findByIdAndUpdate(_id, { phonenumber: condition.phonenumber })
        }
      } else {
        let usersave = user;
        usersave["userType"] = "Normal";
        let saveobj = new userModel(usersave)
        let res = await saveobj.save()
        userID = res._id
      }


      let midlocations = [];
      let mid = req.body.midlocation;
      for (i in mid) {
        midlocations.push({
          location: mid[i].loc,
          coordinates: [
            mid[i].lat,
            mid[i].lng
          ]
        })
      }

      let dataObj = {};
      let transObj = {};
      dataObj.user = mongoose.Types.ObjectId(userID);
      dataObj.dateOfJourney = req.body.dateOfJourney;
      dataObj.pickUptime = req.body.timeOfJourney;
      dataObj.mailby = req.body.mailby
      dataObj.jobtype = "DispatchJob";
      dataObj.distance = req.body.totaldistance;
      dataObj.pickupLocation = {
        coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
        address: req.body.pickupLocation.address,
      };
      dataObj.dropLocation = {
        coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
        address: req.body.dropLocation.address,
      }
      dataObj.midlocation = midlocations;
      // dataObj.dayOfJourney = dayOfJourney;
      dataObj.driverdetails = mongoose.Types.ObjectId(req.body.driverdetails);

      transObj.Amount = req.body.price;
      transObj.fare = req.body.fare;
      transObj.tax = 3;
  
      let existingDriver = await jobModel.findOne({_id:req.body._id},select='driverdetails').populate('driverdetails')
      console.log("existDriver--",existingDriver.driverdetails._id);
  var oldDriver=existingDriver.driverdetails._id
      let result = await commonQuery.updateOneDocument(jobmodel, { _id: mongoose.Types.ObjectId(req.body._id) }, dataObj)
      if (result.error) throw { message: 'Uncought Error!' }
      if (result.status) {
        const { data } = result
        if (data) {
          let customerdata = await userModel.findById(userID);
          let DriverData = await userModel.findById(data.driverdetails);

          var userDetails = {
            email: customerdata.email,
            name: customerdata.name,
            phonenumber: customerdata.phonenumber,
            pickupLocation: data.pickupLocation,
            dropLocation: data.dropLocation,
            dayOfJourney: data.dayOfJourney,
            dateOfJourney: data.dateOfJourney,
            pickUptime: data.pickUptime,
            distance: data.distance,
            fare: data.fare,
            midlocation: data.midlocation,
            driverName: DriverData.name,
            licencenumber: DriverData.licencenumber,

          };
          
          const driverDetails = await userModel.findOne({ userType: 'Driver', _id: mongoose.Types.ObjectId(req.body.driverdetails) });
         console.log("currentdriverid--",driverDetails._id);
         console.log("olddriverid--,",oldDriver);
          if(oldDriver === driverDetails._id)
          {
            let arr = oldDriver.deviceInfo;
            let deviceToken = arr[arr.length - 1].deviceToken;
            let deviceType = arr[arr.length - 1].deviceType;
  
            if (deviceType == "Android") {
              var message = {
                to: deviceToken,
                data: {
                    message: " Your Dispatch Job Has been Canceled",
                  
                  title: "DispatchJob",
                  user_id: userDetails1._id,
                  user_name: userDetails1.name,
                  action: "DispatchJob",
                  pickupLocation: {
                    longitude:
                      dataObj.pickupLocation.coordinates[0],
                    latitude:
                      dataObj.pickupLocation.coordinates[1],
                    //pickupareacode: pickupareacode,
                    address: dataObj.pickupLocation.address,
                  },
                  dropLocation: {
                    longitude:
                      dataObj.dropLocation.coordinates[0],
                    latitude:
                      dataObj.dropLocation.coordinates[1],
                    // dropareacode: dropareacode,
                    address: dataObj.dropLocation.address,
                  },
                  // usertype: driverDetails.userType,
                  phonenumber: userDetails1.phonenumber || "",
                  //jobid: jobid,
                  pickuptime: dataObj.pickUpTime,
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
            }
            else if (deviceType == "IOS") {
              var message = {
                to: deviceToken,
                notification: {
                  badge: "1",
                  body: "Dispatch Job",
                  sound: "default",
                  data: {
                    message: " Your Dispatch Job Has been Canceled",
                    title: "DispatchJob",
                    // "body":`${data.sender} send you a message`,
                    user_id: userDetails._id,
                    user_name: userDetails.name,
                    action: "DispatchJob",
                    pickupLocation: {
                      longitude:
                        dataObj.pickupLocation.coordinates[0],
                      latitude:
                        dataObj.pickupLocation.coordinates[1],
                      // pickupareacode: pickupareacode,
                      address: dataObj.pickupLocation.address,
                    },
                    dropLocation: {
                      longitude:
                        dataObj.dropLocation.coordinates[0],
                      latitude:
                        dataObj.dropLocation.coordinates[1],
                      //dropareacode: dropareacode,
                      address: dataObj.dropLocation.address,
                    },

                    usertype: userDetails.userType,
                    phonenumber: userDetails.phonenumber || "",
                    // jobid: jobid,
                    pickuptime: dataObj.pickUptime,
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
            }
          
          }
         
          const userDetails1 = await userModel.findOne({ _id: mongoose.Types.ObjectId(userID) });
          const curentBooking = await jobmodel.findOne({ user: mongoose.Types.ObjectId(userID),jobtype:{$eq:"DispatchJob" }}).sort({ _id: -1 })
          console.log("book",curentBooking);
          await commonQuery.updateOneDocument(transactionmodel, { jobid: mongoose.Types.ObjectId(req.body._id) }, transObj)
             if(! (oldDriver.equals(driverDetails._id)) ){
              let arr = oldriverinfo;
              console.log({oldriverinfo});
              if (!isEmpty(arr)) {
                let deviceToken = arr[arr.length - 1].deviceToken;
                let deviceType = arr[arr.length - 1].deviceType;
                if (deviceType == "Android") {
                  var message = {
                    to: deviceToken,
                    data: {
                      message: "Dispatch Job",
                title: "DispatchJob",
                user_id: userDetails1._id ? userDetails1._id :"",
                user_name: userDetails1.name ? userDetails1.name :"",
                usertype:userDetails1.userType ? userDetails1.userType :"",
                action: "DispatchJob",
                pickupLocation: {
                  longitude:
                    dataObj.pickupLocation.coordinates[0],
                  latitude:
                    dataObj.pickupLocation.coordinates[1],
                  riderLink: constant.weburl.url + "/ride" + curentBooking._id,
                  //pickupareacode: pickupareacode,
                  address: dataObj.pickupLocation.address,
                },
                dropLocation: {
                  longitude:
                    dataObj.dropLocation.coordinates[0],
                  latitude:
                    dataObj.dropLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: dataObj.dropLocation.address,
                },
                // usertype: driverDetails.userType,
                phonenumber: userDetails1.phonenumber ? userDetails1.phonenumber :'',
                jobid: curentBooking._id ? curentBooking._id :"",
                jobtype :"jobCancelled" ,
                fare : req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2) ,
                pickuptime: dataObj.pickUpTime,
                dateOfJourney: req.body.dateOfJourney ? req.body.dateOfJourney : "",
                pickuptime: req.body.timeOfJourney ? req.body.timeOfJourney :FinalData.pickuptime,
            
                Eta: "",
                lasttrip: "",
                totalspent: "",
                riderimage: userDetails1.imagefile ? userDetails1.imagefile : FinalData.riderimage,
                riderrating:userDetails1.riderrating ? userDetails1.riderrating :FinalData.riderrating,
                totaltrips: "",

                    },
                  };
                  console.log({message});
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
                  var message = {
                    to: deviceToken,
                    notification: {
                      badge: "1",
                      body: "Dispatch Job",
                      sound: "default",
                      data: {
                        message: "Dispatch Job",
                        title: "DispatchJob",
                        user_id: userDetails1._id ? userDetails1._id :"",
                        user_name: userDetails1.name ? userDetails1.name :"",
                        usertype:userDetails1.userType ? userDetails1.userType :"",
                        action: "DispatchJob",
                        pickupLocation: {
                          longitude:
                            dataObj.pickupLocation.coordinates[0],
                          latitude:
                            dataObj.pickupLocation.coordinates[1],
                          riderLink: constant.weburl.url + "/ride" + curentBooking._id,
                          //pickupareacode: pickupareacode,
                          address: dataObj.pickupLocation.address,
                        },
                        dropLocation: {
                          longitude:
                            dataObj.dropLocation.coordinates[0],
                          latitude:
                            dataObj.dropLocation.coordinates[1],
                          // dropareacode: dropareacode,
                          address: dataObj.dropLocation.address,
                        },
                        // usertype: driverDetails.userType,
                        phonenumber: userDetails1.phonenumber ? userDetails1.phonenumber :'',
                        jobid: curentBooking._id ? curentBooking._id :"",
                        jobtype :"jobCancelled" ,
                        fare : req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2) ,
                        pickuptime: dataObj.pickUpTime,
                        dateOfJourney: req.body.dateOfJourney ? req.body.dateOfJourney : "",
                        pickuptime: req.body.timeOfJourney ? req.body.timeOfJourney :FinalData.pickuptime,
                    
                        Eta: "",
                        lasttrip: "",
                        totalspent: "",
                        riderimage: userDetails1.imagefile ? userDetails1.imagefile : FinalData.riderimage,
                        riderrating:userDetails1.riderrating ? userDetails1.riderrating :FinalData.riderrating,
                        totaltrips: "",
        
                      },
                    },
                  };
                  console.log({message});
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
                }
              }
         }
          var arr = driverDetails.deviceInfo;
          if (!isEmpty(arr)) {
            let deviceToken = arr[arr.length - 1].deviceToken;
            let deviceType = arr[arr.length - 1].deviceType;
            if (deviceType == "Android") {
              var message = {
                to: deviceToken,
                data: {
                  message: "Dispatch Job",
                title: "DispatchJob",
                user_id: userDetails1._id ? userDetails1._id :"",
                user_name: userDetails1.name ? userDetails1.name :"",
                usertype:userDetails1.userType ? userDetails1.userType :"",
                action: "DispatchJob",
                pickupLocation: {
                  longitude:
                    dataObj.pickupLocation.coordinates[0],
                  latitude:
                    dataObj.pickupLocation.coordinates[1],
                  riderLink: constant.weburl.url + "/ride" + curentBooking._id,
                  //pickupareacode: pickupareacode,
                  address: dataObj.pickupLocation.address,
                },
                dropLocation: {
                  longitude:
                    dataObj.dropLocation.coordinates[0],
                  latitude:
                    dataObj.dropLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: dataObj.dropLocation.address,
                },
                // usertype: driverDetails.userType,
                phonenumber: userDetails1.phonenumber ? userDetails1.phonenumber :'',
                jobid: curentBooking._id ? curentBooking._id :"",
                jobtype :curentBooking.jobtype ,
                fare : req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2) ,
                pickuptime: dataObj.pickUpTime,
                dateOfJourney: req.body.dateOfJourney ? req.body.dateOfJourney : "",
                pickuptime: req.body.timeOfJourney ? req.body.timeOfJourney :FinalData.pickuptime,
            
                Eta: "",
                lasttrip: "",
                totalspent: "",
                riderimage: userDetails1.imagefile ? userDetails1.imagefile : FinalData.riderimage,
                riderrating:userDetails1.riderrating ? userDetails1.riderrating :FinalData.riderrating,
                totaltrips: "",

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
            } else if (deviceType == "IOS") {
              var message = {
                to: deviceToken,
                notification: {
                  badge: "1",
                  body: "Dispatch Job",
                  sound: "default",
                  data: {
                    message: "Dispatch Job",
                    title: "DispatchJob",
                    user_id: userDetails1._id ? userDetails1._id :"",
                    user_name: userDetails1.name ? userDetails1.name :"",
                    usertype:userDetails1.userType ? userDetails1.userType :"",
                    action: "DispatchJob",
                    pickupLocation: {
                      longitude:
                        dataObj.pickupLocation.coordinates[0],
                      latitude:
                        dataObj.pickupLocation.coordinates[1],
                      riderLink: constant.weburl.url + "/ride" + curentBooking._id,
                      //pickupareacode: pickupareacode,
                      address: dataObj.pickupLocation.address,
                    },
                    dropLocation: {
                      longitude:
                        dataObj.dropLocation.coordinates[0],
                      latitude:
                        dataObj.dropLocation.coordinates[1],
                      // dropareacode: dropareacode,
                      address: dataObj.dropLocation.address,
                    },
                    // usertype: driverDetails.userType,
                    phonenumber: userDetails1.phonenumber ? userDetails1.phonenumber :'',
                    jobid: curentBooking._id ? curentBooking._id :"",
                    jobtype :curentBooking.jobtype ? curentBooking.jobtype :"",
                    fare : req.body.fare ? req.body.fare : (Number(req.body.price) - 3).toFixed(2) ,
                    pickuptime: dataObj.pickUpTime,
                    dateOfJourney: req.body.dateOfJourney ? req.body.dateOfJourney : "",
                    pickuptime: req.body.timeOfJourney ? req.body.timeOfJourney :FinalData.pickuptime,
                
                    Eta: "",
                    lasttrip: "",
                    totalspent: "",
                    riderimage: userDetails1.imagefile ? userDetails1.imagefile : FinalData.riderimage,
                    riderrating:userDetails1.riderrating ? userDetails1.riderrating :FinalData.riderrating,
                    totaltrips: "",
    
                  },
                },
              };
              console.log({message});
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
            }
          }
          if (data.mailby == 'Email') {
            emailtemplate
              .findOne({ findBy: "Dispatch_job" })
              .exec(async (err, emaildataresult) => {
                if (err) {
                  throw new Error(err);
                } else if (emaildataresult) {
                  let selectedSubject = emaildataresult.subject;
                  let selectedContent = emaildataresult.content;
                  const template = handlebars.compile(
                    selectedContent.replace(/\n|\r/g, "")
                  );
                  let message = "<title>Totalcabsmobility</title><link href=\"https://fonts.googleapis.com/css?family=Open+Sans:400,600,700\" rel=\"stylesheet\"><table width=\"900\" cellpadding=\"100\" cellspacing=\"0\" style=\"background-color:#fffff;margin:0 auto;text-align:center;\"><tbody><tr><td><tablestyle=\"width:100%;background-color:#ffffff;border-radius:3px;box-shadow:0 0 20px 0 rgba(0,0,0,0.15)\"cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td><table style=\"width:100%;border-top-left-radius:5px;border-top-right-radius:5px;\"cellpadding=\"15\" cellspacing=\"0\"><tbody><tr><td style=\"background-color:#08bf6d\"><h2style=\"font-family:'Open Sans', sans-serif;font-weight:400;background:none;color:#ffffff;font-size:22px;margin-bottom:0;margin-top:5px;text-align:left;\">Totalcabsmobility</h2></td></tr><tr><td><h2style=\"font-family: &quot;Open Sans&quot;, sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 0px; margin-top: 5px;\"><font color=\"#08bf6d\">Hi," + userDetails.name + " &nbsp <br> " + " Date Of Journey:" + userDetails.dateOfJourney + " " + " Pickup time :" + userDetails.pickUptime + " " + "Day Of Journey:" + userDetails.dayOfJourney + " " + " Pickup Location:" + userDetails.pickupLocation.address + " " + "Drop Location:" + userDetails.dropLocation.address + ";  " + "  Driver Name:" + userDetails.driverName + " " + "Driver license:" + userDetails.licencenumber + " " + "Fare:" + userDetails.fare + " " + "Distance :" + userDetails.distance + "  </font></h2><spanstyle=\"border-bottom:1px solid #dfdfdf;width:300px;display:block;margin:0 auto;\">&nbsp;</span></td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#000000;font-size:14px;font-weight:600;\"><span style=\"font-size: 15px;\"></span><spanstyle=\"font-size: 17px;\"></span><spanstyle=\"font-size: 17px;\">Your Dispatch job has been submitted successfully.</span>&nbsp;</td></tr><tr><td>We look forward to give you our best.</td></tr><tr><tdstyle=\"font-family:'Open Sans', sans-serif;color:#adadad;font-size:14px;\"></td></tr><tr><td><pstyle=\"font-family:'Open Sans', sans-serif;color:#818181;font-size:12px;font-weight:400;\">@copyright 2020. All Right Reserved.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
                  utility.sendmail(
                    userDetails.email,
                    selectedSubject,
                    message,
                    async (err, finalresult) => {
                      if (err) {
                        throw new Error(err);
                      }
                    }
                  );
                  utility.sucesshandler(res, 'Add despatch job successfully Updated');
                }
              });
          } else if (data.mailby == 'Phone') {
            let contentBody = `Hi ${userDetails.name},

                              Date Of Journey: ${userDetails.dateOfJourney} 
                              Pickup Time : ${userDetails.pickUptime} 
                              Pickup Location: ${userDetails.pickupLocation.address} 
                              Drop Location: ${userDetails.pickupLocation.address}
                              Driver Name: ${userDetails.driverName} 
                              Driver license: ${userDetails.licencenumber} 
                              Fare: ${userDetails.fare}
                              Distance :${userDetails.distance} KM
                              
                              You can see the route of the journey from the link given below: 
                              ${constant.weburl.url}/ride/${data._id}`

            let message = client.messages.create({
              body: contentBody,
              from: +12059463843,
              to: `+64${userDetails.phonenumber}`,
            });
            console.log('d', contentBody)
            utility.sucesshandler(res, 'Add dispatch job successfully Updated');

          } else {
            utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
          }
        }
      }
    }
    catch (e) {
      console.log("e", e)
      utility.errorhandler(res, "Someting Went Wrong!");
    }
  }
  _updateDispatchJob(function () { });
}



function getDispatchJobByID(req, res) {
  async function _getDispatchJob() {
    try {
      const { params } = req;
      if (!params._id) throw { error: 'Job not Found!' }

      let jobdetails = await jobModel.findById(mongoose.Types.ObjectId(params._id)).populate("user driverdetails", "name phonenumber email imagefile userType carRegNo, carType");

      console.log('job details', jobdetails)
      // let driverlist = driverstatusmodel.find();
      // console.log("feed--", driverlist);

      if (jobdetails) {
        utility.sucesshandler(
          res,
          "Job Details Fetched!",
          jobdetails
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    }
    catch (e) {
      console.log("e", e)
      utility.errorhandler(res, e.error || "Someting Went Wrong!");
    }
  }
  _getDispatchJob();
}
function getCoverJobByID(req, res) {
  async function _getCoverJob() {
    try {
      const { params } = req;
      if (!params._id) throw { error: 'Job not Found!' }

      let jobdetails = await jobModel.findById(mongoose.Types.ObjectId(params._id)).populate("user driverdetails", "name phonenumber email imagefile userType carRegNo, carType");

      console.log('job details', jobdetails)
      // let driverlist = driverstatusmodel.find();
      // console.log("feed--", driverlist);

      if (jobdetails) {
        utility.sucesshandler(
          res,
          "Job Details Fetched!",
          jobdetails
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    }
    catch (e) {
      console.log("e", e)
      utility.errorhandler(res, e.error || "Someting Went Wrong!");
    }
  }
  _getCoverJob();
}


async function adminDeleteDispatchJob(req, res) {
  console.log(7777777777)
  console.log("id", req.body._id)
  // var body = req.body ? req.body : {}
  try {
    let condition = {
      _id: mongoose.Types.ObjectId(req.body._id),

    }
    await jobModel.findByIdAndRemove(condition).exec((err, resp) => {
      if (err) {
        return res.json({
          status: 404,
          msg: "somthing went wrong !",
          error: err
        })
      }
      else {
        return res.json({
          status: 200,
          msg: "Dispatch Job deleted successfully",
          data: resp
        });
      }

    })
  } catch (e) {
    console.log("e", e)
    return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
async function adminGetDispatchJob(req, res) {
  console.log(7777777777)
  console.log("id", req.body._id)
  // var body = req.body ? req.body : {}
  try {
    let condition = {
      _id: mongoose.Types.ObjectId(req.body._id),

    }
    await jobModel.findByIdAndUpdate(condition).exec((err, resp) => {
      if (err) {
        return res.json({
          status: 404,
          msg: "somthing went wrong !",
          error: err
        })
      }
      else {
        return res.json({
          status: 200,
          msg: "Dispatch Job updated successfully",
          data: resp
        });
      }

    })
  } catch (e) {
    console.log("e", e)
    return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}

async function adminGetCoverJob(req, res) {
  console.log("coverjob")
  console.log("id", req.body._id)
  // var body = req.body ? req.body : {}
  try {
    let condition = {
      _id: mongoose.Types.ObjectId(req.body._id),

    }
    await jobModel.findByIdAndUpdate(condition).exec((err, resp) => {
      if (err) {
        return res.json({
          status: 404,
          msg: "somthing went wrong !",
          error: err
        })
      }
      else {
        return res.json({
          status: 200,
          msg: "Dispatch Job updated successfully",
          data: resp
        });
      }

    })
  } catch (e) {
    console.log("e", e)
    return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}

function trackJob(req, res) {
  console.log("in track");
  const _trackJob = async () => {
    const { params } = req;
    const { _id } = params
    try {
      let condition = {
        jobid: req.body._id
      };
      let driverlist = await jobModel.findOne(condition).populate("driverdetails", "name phonenumber email imagefile currentLocation");

      if (driverlist) {
        utility.sucesshandler(
          res,
          'success',
          driverlist
        );
      } else {
        utility.errorhandler(
          res, "No job found"
        );
      }
    } catch (e) {
      console.log("e", e);
      return Response(
        res,
        constant.statusCode.internalservererror,
        constant.messages.SOMETHING_WENT_WRONG,
        e
      );
    }

  }
  _trackJob()
}
function getJobdetail(req, res) {
  const _getJobdetail = async () => {
    const { params } = req;
    const { _id } = params
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(_id)
      };
      let driverlist = await jobModel.findOne({ _id: req.body._id });
      console.log("jobdetail--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          'success',
          driverlist
        );
      } else {
        utility.errorhandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      return Response(
        res,
        constant.statusCode.internalservererror,
        constant.messages.SOMETHING_WENT_WRONG,
        e
      );
    }

  }
  _getJobdetail()
}
async function dispatchJobStart(req, res) {
  let body = req.body ? req.body : {};
  console.log("data--", body);
  try {
    // let jobdetail = await jobmodel.findOne({_id:body.jobid})
    // console.log("job--",jobdetail);

    let jobrequetUpdate = await jobmodel.findOneAndUpdate(
      { _id: body.jobid, jobtype: "DispatchJob" },
      { $set: { tripStartTime: new Date(), tripstatus: "Started" } }
    );

    if (jobrequetUpdate) {
      utility.sucesshandler(res, "Trip Started", jobrequetUpdate);
    } else {
      utility.errorhandler(res, "There is some issue to Start the trip");
    }
  } catch (e) {
    console.log("e", e);
    //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
async function dispatchJobEnd(req, res) {
  let body = req.body ? req.body : {};
  console.log("data--", body);
  try {
    let jobrequetUpdate = await jobmodel.findOneAndUpdate(
      { _id: body.jobid, jobtype: "DispatchJob" },
      { $set: { tripendtime: new Date(), tripstatus: "Completed" } }
    );
    let jobdetail = await jobmodel.findOne({ _id: body.jobid });
    let transection = await transectionModel.findOne({ jobid: body.jobid });
    // console.log("tres--",transection);
    console.log("job--", jobdetail);
    console.log("jobdetail--", jobdetail.tripStartTime);
    let tripstartTime = jobdetail.tripStartTime;
    tripstartTime = tripstartTime.toLocaleTimeString();
    console.log("Time--", tripstartTime);

    let tripEndtime = jobdetail.tripendtime;
    tripEndtime = tripEndtime.toLocaleTimeString();
    console.log("end--", tripEndtime);
    tripstartTime = moment(tripstartTime, "hh:mm:ss a");
    tripEndtime = moment(tripEndtime, "hh:mm:ss a");
    //var duration1 = endTime.diff(startTime, 'hours')

    var duration = moment(tripEndtime).diff(tripstartTime, "minutes");
    // var hours = parseInt(duration.asHours());
    console.log("duration--", duration);
    let totalminutes = duration + "minutes";
    let data = {
      jobid: body.jobid,
      fare: jobrequetUpdate.fare,
      driverid: jobrequetUpdate.driverdetails,
      pickupAddres: jobrequetUpdate.pickupLocation.address,
      dropAddress: jobrequetUpdate.dropLocation.address,
      ETA: totalminutes,
    };

    if (jobrequetUpdate) {
      utility.sucesshandler(res, "Trip End", data);
    } else {
      utility.errorhandler(res, "There is some issue to Start the trip");
    }
  } catch (e) {
    console.log("e", e);
    //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
async function pickupdispatchJob(req, res) {
  let body = req.body ? req.body : {};
  console.log("data--", body);
  try {
    // let jobdetail = await jobmodel.findOne({_id:body.jobid})
    // console.log("job--",jobdetail);

    let jobrequetUpdate = await jobmodel.findOneAndUpdate(
      { _id: body.jobid, jobtype: "DispatchJob" },
      { $set: { tripStartTime: new Date(), tripstatus: "picked customer" } }
    );

    if (jobrequetUpdate) {
      utility.sucesshandler(res, "customer picked successfully", jobrequetUpdate);
    } else {
      utility.errorhandler(res, "There is some issue to picked the customer");
    }
  } catch (e) {
    console.log("e", e);
    //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
  }
}
