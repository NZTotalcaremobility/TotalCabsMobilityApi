var mongoose = require("mongoose");
var FCM = require("fcm-node");

var serverKey =
  "AAAAe2dFb3k:APA91bH1sVSzIm2RcC3TehkXMxTrzlJjATuHvCO4VsM2CyU8azuF_F6n89I9OlAKzRKI15TmlElBIjfznAma4OtlrsJzf3Hs_fSRHvrK7YAyYf2m3R-orykYtD28HnXDaCOQKByJKdLZ";
var fcm = new FCM(serverKey);
var moment = require("moment");
var distancedata = require("../controllers/customer");
const axios = require("axios");
const driverstatusmodel = require("../model/driverstatus");
const Transection = require("../model/tansaction");
const query = require("../config/common_query");
const booking = require("../controllers/booking");
const { driverdetails } = require("../controllers/driver");
const driver = require("../controllers/driver");
const rider = require("../controllers/rider");
const message = require('./../controllers/Messaging_ctrl');
const utility = require("../config/utility");
const { isNull } = require("lodash");

module.exports = (io) => {
  User = require("../model/user");
  Booking = require("../model/booking");
  DriverStatus = require("../model/driverstatus");
  Transcetion = require("../model/tansaction");
  Chat = require("../model/chat");
  job = require("../model/driverstatus");
  Notification = require('../model/notification');
  const Ongoingjob = require("../controllers/booking");
  const msgCtrl = require("../controllers/Messaging_ctrl.js");
  let sockets = [];

  io.on("connection", (socket) => {
    // when user connected, get its id.
    // console.log(socket.handshake.query,"socket.handshake.query")
    const userId = socket.handshake.query.userId;
    // const userId="5c3481a64ef9a85101bc0b60"
    console.log("userId which join the socket", userId);
    socket.emit("isConnected", { message: "You are connected to socket" });

    /**
     * new user connected, add it to sockets array
     * check if userId is already in array
     */
    let isAlreadyInSockets = sockets.findIndex(
      (socket) => socket.userId == userId
    );
    if (isAlreadyInSockets == -1) {
      // not found, add the socket
      sockets.push({
        userId: userId,
        socketId: socket.id,
        socket: socket,
      });
    } else {
      // socket found, update socket instance and it's id
      sockets[isAlreadyInSockets].socket = socket;
      sockets[isAlreadyInSockets].socketId = socket.id;
    }

    /**
     * new user connected, broadcast it to all connected sockets.
     */
    msgCtrl
      .getUser(userId)
      .then(function (data) {
        io.emit("userConnected", {
          userId: data[0]._id,
          userName: data.name,
          // userEmail: data.email
        });
      })
      .catch((error) => console.log("error", error));

    socket.on("SendMessage", (data) => {
      console.log("send message----",data);
      message.saveMesage(data);
      io.emit('newMessage', data);
    });

    socket.on("AcceptandReject", (data) => {
      console.log("I am in Accept and reject request", data);

      let customer = data["customer"];
      let jobid = data["jobid"];
      let status = data["status"];
      let driver = data["driver"];
      let latitude = data["latitude"];
      let longitude = data["longitude"];
      var jobiddata = "";
      var bookingdata = "";
      var distancedata = "";
      var durationdata = "";
      var requestAction ='';
      var totalAmount = "";
      var pickupAddress = "";
      var dropAddress = "";
      var driversatatus = "Not Accepted";
      // if(driversatatus !== '' ){
      //   status =status
      // }else{
      //   status = driversatatus
      // }
      console.log("driverid++++++++",driver);
      let obj  = {

            _id:driver
            
          
      };
      var customerrating = 0;
      User.findOne({
        _id: customer,
      }).exec((err, result) => {
        console.log("in res", result);

        customerrating = result.customerrating
        if (result) {
          Transection.findOneAndUpdate(
            {
              jobid: jobid,
            },
            {
              
              $set: {
              driverdetails:driver,
                user: customer,
                requestAction: status,
            
                
              },
            },
            { new: true }
          ).exec((err, jobidUpdate) => {
            if (jobidUpdate) {
              console.log("jobidres--++++++->", jobidUpdate);
              User.findOne({
                _id: driver,
              }).exec((err, driverresult) => {
                console.log("driv--", driverresult);
                if (driverresult) {
                  console.log(driver, "driver");
                  DriverStatus.find({
                    riderdetails: customer,

                    tripstatus: { $eq: "Ongoing" },
                    jobtype: { $ne: "Hailjob" },
                  }).exec((err, driverstatusresult) => {
                    // console.log ("booking result",driverstatusresult)

                    if (driverstatusresult) {
                      Transection.findOne({ user: customer })
                        .populate("jobid")
                        .sort({ _id: -1 })
                        .exec((err, bookingresult) => {
                           console.log("transection++++--",bookingresult.jobid.requestAction);
                           requestAction= bookingresult.jobid.requestAction
                          bookingdata = bookingresult;
                          distancedata = bookingdata.jobid.distance;
                          durationdata = bookingdata.jobid.duration;
                          totalAmount = bookingdata.Amount;
                          jobidata = bookingdata.jobid._id;
                     
                          (pickupAddress = bookingdata.jobid.pickupLocation),
                            (dropAddress = bookingdata.jobid.dropLocation);
                          // console.log("booking-++++-", distancedata);
                          console.log("booking-++++-", durationdata);
                          console.log("booking-++++-", totalAmount);
                          console.log("booking-++++-", requestAction);
                          console.log(
                            "pickupadd--",
                            bookingdata.jobid.pickupLocation.address
                          );

                          User.findOneAndUpdate(
                            {
                              _id: mongoose.Types.ObjectId(driver),
                            },
                            { $set: { isAvailable: true } },
                            { new: true }
                          ).exec((err, userresult) => {
                            console.log(userresult, "userresult+++");
                           let dataObj ={
                             _id:driver
                           }
                            if (userresult) {
                              job
                                .findOneAndUpdate(
                                  {
                                    _id: jobid,
                                  },
                                  
                                  {
                                    $push: {
                                      driverAction: dataObj
                                    },
                                    $set: {
                                      // driverAction: {
                                      //       id:driver
                                      //    },
                                      tripstatus :"Upcoming",
                                      driverdetails: driver,
                                      requestAction: status,
                                    },
                                  },
                                  { new: true }
                                )
                                .exec((err, jobresult) => {
                                  if (jobresult.requestAction == "Accepted") {
                                    let isdriverAlreadyInSockets = sockets.findIndex(
                                      (socket) =>
                                        socket.userId.toString() ==
                                        driver.toString()
                                    );
                                    let iscustomerAlreadyInSockets = sockets.findIndex(
                                      (socket) =>
                                        socket.userId.toString() ==
                                        customer.toString()
                                    );
                                    if (isdriverAlreadyInSockets != -1) {
                                      driverevent =
                                        sockets[isdriverAlreadyInSockets]
                                          .socketId;

                                      io.to(driverevent).emit(
                                        "rideRequestStatus",
                                        {
                                          status: true,
                                          driver: driver,
                                          jobid: jobidata,
                                          customer: customer,
                                          customername: result.name,
                                          customerrating: (result.customerrating > 0) ? result.customerrating : "0",
                                          latitude: latitude,
                                          longitude: longitude,
                                          pickupadd: pickupAddress,
                                          dropadd: dropAddress,
                                          image: result.imagefile
                                            ? result.imagefile
                                            : "",
                                          phonenumber: result.phonenumber
                                            ? result.phonenumber
                                            : "",

                                          distance: distancedata,
                                          duration: durationdata,
                                          fare: totalAmount,
                                          requestAction:requestAction
                                        }
                                      );
                                    }

                                    if (iscustomerAlreadyInSockets != -1) {
                                      customerevent =
                                        sockets[iscustomerAlreadyInSockets]
                                          .socketId;

                                      io.to(customerevent).emit(
                                        "rideRequestStatus",
                                        {
                                          status: true,
                                          driver: driver,
                                          customer: customer,
                                          customerrating: customerrating,
                                          jobid: jobidata,
                                          latitude: latitude,
                                          longitude: longitude,
                                          pickupadd: pickupAddress,
                                          dropadd: dropAddress,

                                          image: userresult.imagefile
                                            ? result.imagefile
                                            : "",
                                          phonenumber: userresult.phonenumber,
                                          distance: distancedata,
                                          duration: durationdata,
                                          fare: totalAmount,
                                          requestAction:requestAction
                                        }
                                      );
                                    }
                                  } else {
                                    job
                                      .findOneAndUpdate(
                                        {
                                          _id: jobid,
                                        },
                                        {
                                          $set: { tripstatus: "Canceled" },
                                        },
                                        { new: true }
                                      )
                                      .exec((err, jobresult1) => {
                                        if(jobresult1.requestAction == ""){
                                        let isdriverAlreadyInSockets = sockets.findIndex(
                                          (socket) =>
                                            socket.userId.toString() ==
                                            driver.toString()
                                        );
                                        let iscustomerAlreadyInSockets = sockets.findIndex(
                                          (socket) =>
                                            socket.userId.toString() ==
                                            customer.toString()
                                        );
                                        if (isdriverAlreadyInSockets != -1) {
                                          driverevent =
                                            sockets[isdriverAlreadyInSockets]
                                              .socketId;
                                                console.log("ridecancelled--");
                                          io.to(driverevent).emit(
                                            "rideRequestStatus",
                                            {
                                              status: true,
                                              driver: null,
                                              customer: customer,
                                              customerrating: customerrating,
                                              jobid: jobidata,
                                              latitude: latitude,
                                              longitude: longitude,
                                              pickupadd: pickupAddress,
                                              dropadd: dropAddress,

                                              image: userresult.imagefile
                                                ? result.imagefile
                                                : "",
                                              phonenumber: userresult.phonenumber,
                                              distance: distancedata,
                                              duration: durationdata,
                                              fare: totalAmount,
                                              requestAction:requestAction
                                            }
                                          );
                                        }
                                        if (iscustomerAlreadyInSockets != -1) {
                                          customerevent =
                                            sockets[iscustomerAlreadyInSockets]
                                              .socketId;
    
                                          io.to(customerevent).emit(
                                            "rideRequestStatus",
                                            {
                                              status: true,
                                              driver: null,
                                              customer: customer,
                                              customerrating: customerrating,
                                              jobid: jobidata,
                                              latitude: latitude,
                                              longitude: longitude,
                                              pickupadd: pickupAddress,
                                              dropadd: dropAddress,
    
                                              image: userresult.imagefile
                                                ? result.imagefile
                                                : "",
                                              phonenumber: userresult.phonenumber,
                                              distance: distancedata,
                                              duration: durationdata,
                                              fare: totalAmount,
                                              requestAction:requestAction
                                            }
                                          );
                                        }
                                        }
                                      });
                                  }
                                });
                            }
                          });
                        });
                    }
                  });
                }
              });
            }
          });
        } else if (err) {
          let iscustomerAlreadyInSockets = sockets.findIndex(
            (socket) => socket.userId.toString() == customer.toString()
          );
          if (iscustomerAlreadyInSockets != -1) {
            customerevent = sockets[iscustomerAlreadyInSockets].socketId;

            io.to(customerevent).emit("rideRequestStatus", "Error");
          }
        }
      });
    });

    socket.on("driverLocation", (data) => {
      console.log(data.lat, "data");
      let latitude = data.lat;
      let longitude = data.long;
      let driver = data.driver;
      let customer = data.customer;
      let address = data.address;

      let currentLocation = {
        type: "Point",
        coordinates: [longitude, latitude],
        address: address,
      };

      User.findOneAndUpdate(
        { _id: driver, userType: "Driver" },
        { $set: { currentLocation: currentLocation } },
        { new: true }
      )
        .select({ currentLocation: 1 })
        .exec((err, result) => {
          if (result) {
            let data = {
              latitude: latitude,
              longitude: longitude,
              customer: customer,
              driver: driver
            };
            let iscustomerAlreadyInSockets = sockets.findIndex(
              (socket) => socket.userId.toString() == customer.toString()
            );
            let isdriverAlreadyInSockets = sockets.findIndex(
              (socket) => socket.userId.toString() == driver.toString()
            );
            if (isdriverAlreadyInSockets != -1) {
              driverevent = sockets[isdriverAlreadyInSockets].socketId;

              io.to(driverevent).emit(
                "driverCurrentLocation",
    
                data,

              );
            }

            if (iscustomerAlreadyInSockets != -1) {
              customerevent = sockets[iscustomerAlreadyInSockets].socketId;
              console.log("driverstatus in socket");
              io.to(customerevent).emit("driverCurrentLocation", data);
            }
          }
        });
    });

    socket.on("ridestatus", (data) => {
      console.log("driverid--", data);
      console.log("in ridestatu--->");

      let jobid = data["jobid"];
      let triptime = data["triptime"];
      let driverstatus = data["driverstatus"];
      let tripstatus = data["tripstatus"];
      let latitude = data["latitude"];
      let longitude = data["longitude"];
      let driverid = data["driverid"];
      let customerid = data["customer"];
      console.log("cutomerifd--", customerid);
      let obj = {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        driverid: driverid,
        triptime: new Date(triptime),
        status: driverstatus,
      };

      driverstatusmodel
        .findOneAndUpdate(
          { _id: jobid },
          {
            $push: {
              status: obj,
            },
            $set: { tripstatus: tripstatus },
          }
        )
        .exec((err, result) => {
          if (err) {
            console.log(err);
          } else {
            User.findOne({ _id: customerid, userType: "Normal" }).exec(
              (err, customerresult) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log({ customerresult });
                  let isAlreadyInSockets = sockets.findIndex(
                    (socket) => socket.userId.toString() == driverid.toString()
                  );
                  console.log({ isAlreadyInSockets });
                  if (isAlreadyInSockets != -1) {
                    driverevent = sockets[isAlreadyInSockets].socketId;
                    console.log({ driverevent, driverid, msg: "Driver  id" });

                    //io.to(driverevent).emit("driverStatus",'Location updated successfully');
                    io.to(driverevent).emit("tripstatus", {
                      status: true,
                      jobid: jobid,
                      driver: driverid,
                      customer: customerid,
                      customername: customerresult.name,
                      customerrating: (customerresult.rating > 0) ? customerresult.rating : "0",
                      image: customerresult.imagefile
                        ? customerresult.imagefile
                        : "",
                      phonenumber: customerresult.phonenumber
                        ? customerresult.phonenumber
                        : "",
                      driverstatus: driverstatus,
                      tripstatus: tripstatus,
                      droplocation: result.dropLocation,
                    });
                  }

                  let isAlreadyInSockets3 = sockets.findIndex(
                    (socket) =>
                      socket.userId.toString() == customerid.toString()
                  );

                  if (isAlreadyInSockets3 != -1) {
                    customerevent = sockets[isAlreadyInSockets3].socketId;

                    io.to(customerevent).emit("tripstatus", {
                      status: true,
                      jobid: jobid,
                      driver: driverid,
                      customer: customerid,
                      customername: customerresult.name,
                      customerrating: (customerresult.rating > 0) ? customerresult.rating : "0",
                      image: customerresult.imagefile
                        ? customerresult.imagefile
                        : "",
                      phonenumber: customerresult.phonenumber
                        ? customerresult.phonenumber
                        : "",
                      driverstatus: driverstatus,
                      tripstatus: tripstatus,
                      pickuplocation: result.pickUpLocation,
                      droplocation: result.dropLocation,
                    });
                  }

                  //     let isAlreadyInSockets = sockets.findIndex(socket => socket.userId.toString() == cuss.toString());

                  //     if(isAlreadyInSockets2!=-1)
                  //     {

                  //      senderevent =sockets[isAlreadyInSockets2].socketId
                  //      data.receiverStatus = true;
                  //      io.to(senderevent).emit("readUnread", obj);
                  //    }
                }
              }
            );
          }
        });
    });

    /**
     * when user sends message to another user
     */
    socket.on("sendMessage", async (data) => {
      console.log("######################### SEND MESSAGE START $$$$$$$$$$$$$", { data }, { sockets });

      let receiver = data["receiver"];
      let sender = data["sender"];
      //  let senderType =  data["senderType"]; // User /Driver  / Admin
      // let reciverType =  data["reciverType"]; // User /Driver  / Admin
      // console.log('receiver Type', reciverType);
      //    data["created_on"]=moment.utc().format()
      let socketObj = sockets.find((socket) => {
        data.senderStatus = true;
        // socket.userId
        console.log("sender---", sender);
        console.log("recive---", receiver);
        if (socket.userId.toString() == receiver.toString()) {
          console.log("hello");
          data.receiverStatus = true;
          return socket;
        } else {
          data.receiverStatus = false;
          return socket;
        }
      });

      // socketObj.socket.emit("readUnread",data)

      if (data.length != 0) {
        // data["created_on"]=moment.utc().format()
        console.log(sender, "sender");
        //if senderType is ADMIN please use ADMIN model for serach if(senderType === "Admin") {Admin.findOne} else {User.findOne}
        User.findOne(
          {
            _id: sender,
          },
          function (err, result1) {
            //if senderType is ADMIN please use ADMIN model for serach if(reciverType === "Admin") {Admin.findOne} else {User.findOne}

            User.findOne(
              {
                _id: receiver,
              },
              function (err, result2) {
                if (!result2) {
                  console.log("result not found", err);
                } else {
                  if (err) {
                    console.log("err in notifications", err);
                  } else {
                    console.log("its reached here at notificarion");
                    var arr = result2.deviceInfo;
                    console.log("deviceinfo--",arr);
                    if (arr.length > 0) {
                      let deviceToken = arr[arr.length - 1].deviceToken;
                      let deviceType = arr[arr.length - 1].deviceType;
                      if (deviceType == "Android") {
                        var message = {
                          to: deviceToken,
                          data: {
                            // message: data.message,
                            // title: "Chat",
                            // // "body":`${data.sender} send you a message`,
                            // sender_id: data.sender,
                            // sender_name: result1.name,
                            // sender_image: result1.imagefile,
                            // receiver_id: result2._id,
                            // receiver_image: result2.imagefile,
                            // receiver_name: result2.name,
                            // action: "chat",
                            // usertype: result2.userType,
                            message: data.message,
                            title :"Chat",
                            jobtype:"Chat",
                            sender_id :result1._id,
                            sender_name : result1.name,
                            sender_image : result1.imagefile,
                            receiver_id: result2._id,
                            receiver_name : result2.name,
                            action:"Chat",
                            usertype:result2.userType 
                          },
                        };
                        console.log("android--",message);
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
                            // badge: "1",
                            // name: result2.name,
                            // body: data.message,
                            // sound: "default",
                            data: {
                              message: data.message,
                              title: "Chat",
                              // "body":`${data.sender} send you a message`,
                              sender_id: data.sender,
                              sender_name: result1.name,
                              sender_image: result1.imagefile,
                              receiver_id: result2._id,
                              receiver_image: result2.imagefile,
                              receiver_name: result2.name,
                              action: "chat",
                              usertype: result2.userType,
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
                  }
                }
              }
            );
          }
        );
      } else {
        console.log("data from send message is not found");
      }
      if (typeof socketObj !== "undefined") {
        console.log("sender", sender);
        //if senderType is ADMIN please use ADMIN model for serach if(senderType === "Admin") {Admin.findOne} else {User.findOne}

        User.find({
          _id: mongoose.Types.ObjectId(sender),
        }).exec(function (err, thisUserData) {
          if (err) {
            console.log("err", err);
          } else {
            //if senderType is ADMIN please use ADMIN model for serach if(reciverType === "Admin") {Admin.findOne} else {User.findOne}

            User.findOne(
              {
                _id: receiver,
              },
              function (err, receiverresult) {
                console.log(thisUserData, "thisUserData");
                (data.senderName = thisUserData[0].name),
                  (data.senderImage = thisUserData[0].imagefile
                    ? thisUserData[0].imagefile
                    : "");

                data.created_on = moment.utc().format();

                console.log("sockets of", sockets);

                let obj = {
                  senderName: thisUserData[0].name,
                  senderImage: thisUserData[0].imagefile
                    ? thisUserData[0].imagefile
                    : "",
                  usertype: receiverresult.userType,
                  created_on: moment.utc().format(),
                  message: data["message"],
                  senderid: sender,
                  receiverid: receiver,
                  receivername: receiverresult.name ? receiverresult.name : "",
                  receiverImage: receiverresult.imagefile
                    ? receiverresult.imagefile
                    : "",
                };
                let isAlreadyInSockets = sockets.findIndex(
                  (socket) => socket.userId.toString() == receiver.toString()
                );
                console.log("isAlreadyInSockets", isAlreadyInSockets, { sockets, receiver });

                if (isAlreadyInSockets != -1) {
                  receiverevent = sockets[isAlreadyInSockets].socketId;
                  console.log(receiverevent.toString(), "receiverevent");
                  io.to(receiverevent).emit("getMessage", obj);

                  let isAlreadyInSockets2 = sockets.findIndex(
                    (socket) => socket.userId.toString() == sender.toString()
                  );

                  if (isAlreadyInSockets2 != -1) {
                    senderevent = sockets[isAlreadyInSockets2].socketId;
                    data.receiverStatus = true;
                    io.to(senderevent).emit("readUnread", obj);
                  }
                }

                let isAlreadyInSockets2 = sockets.findIndex(
                  (socket) => socket.userId.toString() == sender.toString()
                );

                if (isAlreadyInSockets2 != -1) {
                  senderevent = sockets[isAlreadyInSockets2].socketId;

                  io.to(senderevent).emit("getMessage", obj);
                }
                // else{
                //     let isAlreadyInSockets3= sockets.findIndex(socket => socket.userId.toString() == sender.toString());

                //     if(isAlreadyInSockets3!=-1)
                //     {

                //      senderevent =sockets[isAlreadyInSockets3].socketId

                //      io.to(senderevent).emit("readUnread", data);
                //    }

                // }
                console.log(
                  "i am after getmsg=============>>>>>>>>>>>>>",
                  data
                );
              }
            );
          }
        });
      }
      const { userType } = await User.findOne({ _id: receiver }, { userType: 1 });
      if (userType == 'Admin' || userType == 'SubAdmin') {
        const payload = {
          from: sender,
          message: data.message,
          type: 'chat'
        }
        await new Notification(payload).save();
      }
      msgCtrl.saveMesage(data);
      console.log("saaaaaaaaaaaaaaaaa", data);
    });

    /**
     * when user start typing
     */
    socket.on("onTyping", (data) => {
      let receiver = data["receiver"];
      let socketObj = sockets.find((socket) => {
        if (socket.userId.toString() == receiver.toString()) {
          return socket;
        }
      });
      if (typeof socketObj !== "undefined") {
        socketObj.socket.emit("getOnTyping", data);
      }
    });

    socket.on("getOngoingBooking", (data) => {
      var rider = "";
      var driver = "";
      var status = "";
      var pickuplocation = "";
      var dropLocation = "";
      var riderName = "";
      var phonenumber = "";
      var driverstatus ='';
      var rating = "";
      var jobtype= "";
      var count = 0;
      var ETA = "";
      var pickuptime = "";
      var driverstatus = [];
      var TotalAmount = 0;
      var currentDate ='';
      var todayDate ='';
      let deriverdetail = data["driverdetails"];
      // console.log("data",deriverdetail);
      Transcetion.find({
        driverdetails: deriverdetail,
      })
        .populate("jobid user driverdetails ")
      
        .exec((err, Result) => {
          if (Result) {
            // let pickup = Result.user.pickupLocation
            //console.log("pik",Result);

            Result.forEach((element) => {
              TotalAmount = TotalAmount + parseFloat(element.Amount);
              count = count + 1;
              console.log("jobid--",element.jobid.jobtype)
              jobtype =element.jobid.jobtype
            });

            console.log("Resul+++++++++++++++++++t--->",jobtype);
            driverstatusmodel
              .findOne({
                driverdetails: deriverdetail,

               requestAction: { $eq: "Accepted" },
            
                tripstatus: {$ne: "Completed"},
              
                jobtype: { $ne: "Hailjob" },
              })
              .populate("user driverdetails").sort({pickUptime: -1})

              .exec((err, result) => {

                console.log("resui----", result);
                currentDate = result.dateOfJourney
                currentDate=  currentDate.getDate()
                console.log("currentd--",currentDate);
                todayDate = new Date()
                todayDate = todayDate.getDate()
                console.log("today--",todayDate);
                console.log("pick----",result.pickUptime);
                var startTime =result.pickUptime
                startTime= moment(startTime,'hh:mm').format('hh:mm')
               /// console.log("st882",startTime);
                date = new Date(currentDate +" "+startTime);
                console.log("dte-------------",date);
                if(todayDate === currentDate ){
                if(result.tripstatus != "Cancelled"){
              console.log("in 892");
              
                var currentTime= new Date()
                currentTime = currentTime.toLocaleTimeString()
                currentTime = moment(currentTime,'hh:mm').format('hh:mm')
              
              console.log("startend--",startTime,currentTime);
           //  var duration=(moment(currentTime).diff(startTime, 'minutes')).asMinutes()
           let finalTime = moment.duration(moment(startTime,'hh:mm').diff(moment(currentTime,'hh:mm'))).asMinutes()
                console.log("locale time---->"+finalTime);
                if(Number(finalTime) >= 0 && Number(finalTime) <= 15){
                let jobid = result._id;
                Transcetion.findOne({
                  jobid: result._id,
                }).exec((err, Tressult) => {
                  console.log("transection---", result.status);
                 
                  fare = Tressult.Amount;
                    if(result.status.length !=[]){
                  
                    
                  driverstatus = result.status.slice(-1) ?result.status.slice(-1) : '';
                  driverstatus = driverstatus[0].status ? driverstatus[0].status:'' ;
                    }
                  console.log("drivr---", driverstatus);
                  let driverlocation = result.driverdetails.currentLocation;
                  console.log(
                    "driverlocation--",
                    driverlocation.coordinates[0]
                  );
                  driverlatitude = driverlocation.coordinates[0];
                  driverlongitude = driverlocation.coordinates[1];
                  console.table({ driverlatitude, driverlongitude, result });

                  let riderlocation = result.pickupLocation;
                  let riderdroplocation = result.dropLocation;

                  riderlatitude = riderlocation.coordinates[0];
                  riderlongitude = riderlocation.coordinates[1];
                  riderdroplatitude = riderdroplocation.coordinates[0];
                  riderdroplongitude = riderdroplocation.coordinates[1];
                  console.log({ riderlatitude, riderlongitude });
                  console.log("riderlocation--", riderlocation.coordinates[0]);
                  let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${riderlongitude},${riderlatitude}&destinations=${riderdroplongitude},${riderdroplatitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
                  //  console.log({ pickupLocation, dropLocation, link });

                  axios.get(link).then(function (response) {
                    // handle success
                    //  console.log("ETAA--",response.data.rows[0].elements);
                    // console.log("ETAA2--",response.data.rows[0].elements[0].duration.text);
                    ETA = response.data.rows[0].elements[0].duration.text;
                    let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${driverlongitude},${driverlatitude}&destinations=${riderlongitude},${riderlatitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
                    //  console.log({ pickupLocation, dropLocation, link });

                    axios.get(link).then(function (response) {
                      console.log(
                        "resss--",
                       // response.data.rows[0].elements[0].duration.text
                      );
                     // pickuptime =
                        //response.data.rows[0].elements[0].duration.text;

                      if (result) {
                        let rider = result.user._id;
                        let driver = result.driverdetails._id;
                        let status = result.tripstatus;
                        let pickuplocation = result.pickupLocation;
                        let dropLocation = result.dropLocation;
                        let riderName = result.user.name;
                        let phonenumber = result.user.phonenumber;
                        let rating = result.user.rating;
                        let image = result.user.imagefile;
                        let userType = result.user.userType;
                        console.log("pickup", pickuplocation);
                        driverstatusmodel
                          .findOne({ driverdetails: deriverdetail })
                          .sort({ id: 1 })
                          .exec((err, lastTrip) => {
                            if (lastTrip) {
                              console.log("LastTrip--->", lastTrip._id);
                              let LastTrip = lastTrip._id;
                              Transcetion.findOne({ user: rider })
                                .populate("jobid")
                                .sort({ _id: -1 })
                                .exec((err, userResult) => {
                                  if (result) {
                                    console.log(
                                      "result--->",
                                      userResult.jobid._id
                                    );

                                    User.findOne(
                                      {
                                        _id: rider,
                                      },
                                      function (err, result1) {
                                        if (!result) {
                                          console.log("result not found", err);
                                        } else {
                                          if (err) {
                                            console.log(
                                              "err in notification ",
                                              err
                                            );
                                          } else {
                                            console.log(
                                              "its reached here at notiication"
                                            );
                                          }
                                          var arr = result.driverdetails.deviceInfo;
                                          console.log(result)
                                          if (arr.length > 0) {
                                            let deviceToken =
                                              arr[arr.length - 1].deviceToken;
                                            let deviceType =
                                              arr[arr.length - 1].deviceType;
                                            console.log(
                                              "devicty--",
                                              deviceType
                                            );
                                            console.log(
                                              "dviceToken--",
                                              deviceType
                                            );
                                            if (deviceType == "Android") {
                                              var message = {
                                                to: deviceToken,
                                                data: {
                                                  message: data.message,
                                                  title: "OngoingJob",
                                                  rider:
                                                    result.user._id,
                                                  driver:
                                                    result.driverdetails._id,
                                                  jobid: jobid,
                                                  driverstatus: driverstatus,
                                                  LastTripId: LastTrip,
                                                  TotalTrips: count,
                                                  ETA: ETA,
                                                  fare: fare,
                                                  pickuptime: pickuptime,
                                                  TotalSpent: TotalAmount,
                                                  status: result.tripstatus,
                                                  pickuplocation:
                                                    result.user
                                                      .pickupLocation,
                                                  dropLocation:
                                                    result.user
                                                      .dropLocation,
                                                  riderName:
                                                    result.user.name,
                                                  phonenumber:
                                                    result.user
                                                      .phonenumber,
                                                  rating:
                                                    result.user.rating,
                                                  image:
                                                    result.user
                                                      .imagefile,
                                                  userType:
                                                    result.user
                                                      .userType,
                                                },
                                              };
                                              fcm.send(
                                                message,
                                                function (err, pushresponse) {
                                                  if (err) {
                                                    console.log(
                                                      "notiication not send",
                                                      err
                                                    );
                                                  } else {
                                                    console.log(
                                                      "notifiactionsend to device",
                                                      pushresponse
                                                    );
                                                  }
                                                }
                                              );
                                            }
                                            if (deviceType == "IOS") {
                                              var message = {
                                                to: deviceToken,
                                                data: {
                                                  message: data.message,
                                                  title: "OngoingJob",
                                                  rider:
                                                    result.user._id,
                                                  driver:
                                                    result.driverdetails._id,
                                                  jobid: jobid,
                                                  driverstatus: driverstatus,
                                                  LastTripId: LastTrip,
                                                  TotalTrips: count,
                                                  ETA: ETA,
                                                  fare: fare,
                                                  pickuptime: pickuptime,
                                                  TotalSpent: TotalAmount,
                                                  status: result.tripstatus,
                                                  pickuplocation:
                                                    result.user
                                                      .pickupLocation,
                                                  dropLocation:
                                                    result.user
                                                      .dropLocation,
                                                  riderName:
                                                    result.user.name,
                                                  phonenumber:
                                                    result.user
                                                      .phonenumber,
                                                  rating:
                                                    result.user.rating,
                                                  image:
                                                    result.user
                                                      .imagefile,
                                                  userType:
                                                    result.user
                                                      .userType,
                                                },
                                              };
                                              fcm.send(
                                                message,
                                                function (err, pushresponse) {
                                                  if (err) {
                                                    console.log(
                                                      "notiication not send",
                                                      err
                                                    );
                                                  } else {
                                                    console.log(
                                                      "notifiactionsend to device",
                                                      pushresponse
                                                    );
                                                  }
                                                }
                                              );
                                            }
                                          }
                                        }
                                      }
                                    );
                                    io.emit("Ongoingdata", {
                                      status: true,
                                      riderId: rider,
                                      driverId: driver,
                                      jobid: jobid,
                                      ETA: ETA,
                                      fare: fare,
                                      driverstatus: driverstatus,
                                      pickuptime: pickuptime,
                                      LastTripId: LastTrip,
                                      TotalTrips: count,
                                      TotalSpent: TotalAmount,
                                      userType: userType,
                                      tripStatus: status,
                                      pickupLocation: pickuplocation,
                                      dropLocation: dropLocation,
                                      riderName: riderName,
                                      phonenumber: phonenumber,
                                      rating: rating,
                                      image: image,
                                    });
                                  }
                                });
                            }
                          });
                      }
                    });
                  });
                
                });
              }else{
                io.emit("Ongoingdata",{
                  message:"Your job has not been started "

                })
              }
             
                                        }else{
                                          io.emit("Ongoingdata",{
                                            message:"Your job has been Cancelled "

                                          })
                                         }                         }else{
                                          io.emit("Ongoingdata",{
                                            message:"Your job is not sheduled for today "

                                          })

                                         }
              });
          }
        });
    }),
    socket.on("getRiderOngoingBooking", (data) => {
      var rider = "";
      var driver = "";
      var driverlocation1 = "";
      var pickuplocation = "";
      var dropLocation = "";
      var riderName = "";
      var phonenumber = "";
      var driverstatus ='';
      var rating = "";
      var jobtype= "";
      var count = 0;
      var ETA = "";
      var pickuptime = "";
      var driverstatus = [];
      var TotalAmount = 0;
      let customer = data["customer"];
      // console.log("data",deriverdetail);
      Transcetion.find({
        user: customer,
      })
        .populate("jobid user driverdetails ")
        .lean()
        .exec((err, Result) => {
          if (Result) {
            // let pickup = Result.user.pickupLocation
            console.log("pik",Result);
           // driverlocation = Result.driverdetails
            Result.forEach((element) => {
              TotalAmount = TotalAmount + parseFloat(element.Amount);
              count = count + 1;
              console.log("jobid--",element.jobid.jobtype)
              jobtype =element.jobid.jobtype
            });

            console.log("Resul+++++++++++++++++++t--->",jobtype);
            driverstatusmodel
              .findOne({
                user: customer,

               requestAction: { $eq: "Accepted" },
            
                tripstatus: {$ne: "Completed"},
              
                jobtype: { $ne: "Hailjob" },
              })
              .populate("user driverdetails").sort({_id: -1})

              .exec((err, result) => {
                console.log("resui----", result);

                
                var startTime =result.pickUptime
                var currentTime= new Date().toLocaleTimeString()
                console.log("resui++----",currentTime );
                startTime = moment(startTime,'hh:mm:ss a')
                currentTime = moment(currentTime,'hh:mm:ss a')
              //    var duration1 = endTime.diff(startTime, 'hours')
              
             var duration=(moment(currentTime).diff(startTime, 'minutes'));
                console.log("locale time"+duration);
                if(duration <= 15){
                let jobid = result._id;
                Transcetion.findOne({
                  jobid: result._id,
                }).exec((err, Tressult) => {
                  console.log("transection---", result.status);
                 
                  fare = Tressult.Amount;
                    if(result.status.length !=[]){
                  
                    
                  driverstatus = result.status.slice(-1) ?result.status.slice(-1) : '';
                  driverstatus = driverstatus[0].status ? driverstatus[0].status:'' ;
                    }
                  console.log("drivr---", driverstatus);
                  let driverlocation = result.driverdetails.currentLocation;
                  console.log(
                    "driverlocation--",
                    driverlocation.coordinates[0]
                  );
                  driverlatitude = driverlocation.coordinates[0];
                  driverlongitude = driverlocation.coordinates[1];
                  console.table({ driverlatitude, driverlongitude, result });

                  let riderlocation = result.pickupLocation;
                  let riderdroplocation = result.dropLocation;

                  riderlatitude = riderlocation.coordinates[0];
                  riderlongitude = riderlocation.coordinates[1];
                  riderdroplatitude = riderdroplocation.coordinates[0];
                  riderdroplongitude = riderdroplocation.coordinates[1];
                  console.log({ riderlatitude, riderlongitude });
                  console.log("riderlocation--", riderlocation.coordinates[0]);
                  let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${riderlongitude},${riderlatitude}&destinations=${riderdroplongitude},${riderdroplatitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
                  //  console.log({ pickupLocation, dropLocation, link });

                  axios.get(link).then(function (response) {
                    // handle success
                    //  console.log("ETAA--",response.data.rows[0].elements);
                    // console.log("ETAA2--",response.data.rows[0].elements[0].duration.text);
                    ETA = response.data.rows[0].elements[0].duration.text;
                    let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${driverlongitude},${driverlatitude}&destinations=${riderlongitude},${riderlatitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
                    //  console.log({ pickupLocation, dropLocation, link });

                    axios.get(link).then(function (response) {
                      console.log(
                        "resss--",
                        //response.data.rows[0].elements[0].duration.text
                      );
                      //pickuptime =
                      //  response.data.rows[0].elements[0].duration.text;

                      if (result) {
                        let rider = result.user._id;
                        let driver = result.driverdetails._id;


                        let status = result.tripstatus;
                        let pickuplocation = result.pickupLocation;
                        let dropLocation = result.dropLocation;
                        let riderName = result.user.name;
                        let phonenumber = result.user.phonenumber;
                        let rating = result.user.rating;
                        let image = result.user.imagefile;
                        let userType = result.user.userType;
                        console.log("pickup", pickuplocation);
                        driverstatusmodel
                          .findOne({ user: customer })
                          .sort({ id: 1 })
                          .exec((err, lastTrip) => {
                            if (lastTrip) {
                              console.log("LastTrip--->", lastTrip._id);
                              let LastTrip = lastTrip._id;
                              Transcetion.findOne({ user: rider })
                                .populate("jobid")
                                .sort({ _id: -1 })
                                .exec((err, userResult) => {
                                  if (result) {
                                    console.log(
                                      "result--->",
                                      userResult.jobid._id
                                    );

                                    User.findOne(
                                      {
                                        _id: rider,
                                      },
                                      function (err, result1) {
                                        if (!result1) {
                                          console.log("result not found", err);
                                        } else {
                                          if (err) {
                                            console.log(
                                              "err in notification ",
                                              err
                                            );
                                          } else {
                                            console.log(
                                              "its reached here at notiication"
                                            );
                                          }
                                          var arr = result.driverdetails.deviceInfo;
                                          console.log(result)
                                          if (arr.length > 0) {
                                            let deviceToken =
                                              arr[arr.length - 1].deviceToken;
                                            let deviceType =
                                              arr[arr.length - 1].deviceType;
                                            console.log(
                                              "devicty--",
                                              deviceType
                                            );
                                            console.log(
                                              "dviceToken--",
                                              deviceType
                                            );
                                            if (deviceType == "Android") {
                                              var message = {
                                                to: deviceToken,
                                                data: {
                                                  message: data.message,
                                                  title: "OngoingJob",
                                                  rider:
                                                    result.user._id,
                                                  driver:
                                                    result.driverdetails._id,
                                                  jobid: jobid,
                                                  driverstatus: driverstatus,
                                                  LastTripId: LastTrip,
                                                  TotalTrips: count,
                                                  ETA: ETA,
                                                  fare: fare,
                                                  pickuptime: pickuptime,
                                                  TotalSpent: TotalAmount,
                                                  status: result.tripstatus,
                                                  pickuplocation:
                                                    result.user
                                                      .pickupLocation,
                                                  dropLocation:
                                                    result.user
                                                      .dropLocation,
                                                  riderName:
                                                    result.user.name,
                                                  phonenumber:
                                                    result.user
                                                      .phonenumber,
                                                  rating:
                                                    result.user.rating,
                                                  image:
                                                    result.user
                                                      .imagefile,
                                                  userType:
                                                    result.user
                                                      .userType,
                                                },
                                              };
                                              fcm.send(
                                                message,
                                                function (err, pushresponse) {
                                                  if (err) {
                                                    console.log(
                                                      "notiication not send",
                                                      err
                                                    );
                                                  } else {
                                                    console.log(
                                                      "notifiactionsend to device",
                                                      pushresponse
                                                    );
                                                  }
                                                }
                                              );
                                            }
                                            if (deviceType == "IOS") {
                                              var message = {
                                                to: deviceToken,
                                                data: {
                                                  message: data.message,
                                                  title: "OngoingJob",
                                                  rider:
                                                    result.user._id,
                                                  driver:
                                                    result.driverdetails._id,
                                                  jobid: jobid,
                                                  driverstatus: driverstatus,
                                                  LastTripId: LastTrip,
                                                  TotalTrips: count,
                                                  ETA: ETA,
                                                  fare: fare,
                                                  pickuptime: pickuptime,
                                                  TotalSpent: TotalAmount,
                                                  status: result.tripstatus,
                                                  pickuplocation:
                                                    result.user
                                                      .pickupLocation,
                                                  dropLocation:
                                                    result.user
                                                      .dropLocation,
                                                  riderName:
                                                    result.user.name,
                                                  phonenumber:
                                                    result.user
                                                      .phonenumber,
                                                  rating:
                                                    result.user.rating,
                                                  image:
                                                    result.user
                                                      .imagefile,
                                                  userType:
                                                    result.user
                                                      .userType,
                                                },
                                              };
                                              fcm.send(
                                                message,
                                                function (err, pushresponse) {
                                                  if (err) {
                                                    console.log(
                                                      "notiication not send",
                                                      err
                                                    );
                                                  } else {
                                                    console.log(
                                                      "notifiactionsend to device",
                                                      pushresponse
                                                    );
                                                  }
                                                }
                                              );
                                            }
                                          }
                                        }
                                      }
                                    );
                                    if(result.tripstatus != "Cancelled"){
                                    io.emit("riderOngoingdata", {
                                      status: true,
                                      riderId: rider,
                                      driverId: driver,
                                      driverlocation:result.driverdetails.currentLocation,
                                      duration: result.duration,
                                      distance:result.distance,
                                      jobid: jobid,
                                      ETA: ETA,
                                      fare: fare,
                                      driverstatus: driverstatus,
                                      pickuptime: pickuptime,
                                      LastTripId: LastTrip,
                                      TotalTrips: count,
                                      TotalSpent: TotalAmount,
                                      userType: userType,
                                      tripStatus: status,
                                      pickupLocation: pickuplocation,
                                      dropLocation: dropLocation,
                                      riderName: riderName,
                                      phonenumber: phonenumber,
                                      rating: rating,
                                      image: image,
                                    });
                                  }else{
                                    io.emit("riderOngoingdata", {
                                      status: false,
                                      riderId: rider,
                                      driverId: driver,
                                      driverlocation:result.driverdetails.currentLocation,
                                      duration: result.duration,
                                      distance:result.distance,
                                      jobid: jobid,
                                      ETA: ETA,
                                      fare: fare,
                                      driverstatus: driverstatus,
                                      pickuptime: pickuptime,
                                      LastTripId: LastTrip,
                                      TotalTrips: count,
                                      TotalSpent: TotalAmount,
                                      userType: userType,
                                      tripStatus: status,
                                      pickupLocation: pickuplocation,
                                      dropLocation: dropLocation,
                                      riderName: riderName,
                                      phonenumber: phonenumber,
                                      rating: rating,
                                      image: image,
                                    });
                                  }

                                  }
                                });
                            }
                          });
                      }
                    });
                  });
                
                });
              }else{
                io.emit("riderOngoingdata", {
                  message:"Your Job is not Start Yet"
                })
              }
              });
          }
        });
    }),
      socket.on("messageHistory", (data) => {
        console.log(
          "in MessageHistory=============>>>>>>>>>>>>>",
          data,
          "+++",
          data["receiver"]
        );
        let receiver = data["receiver"];
        let sender = data["sender"];

        let socketObj = sockets.find((socket) => {
          data.senderStatus = true;
          // socket.userId
          console.log("sender---", sender);
          console.log("recive---", receiver);
          if (socket.userId.toString() == receiver.toString()) {
            console.log("hello");
            data.receiverStatus = true;
            return socket;
          } else {
            data.receiverStatus = false;
            return socket;
          }
        });

        // socketObj.socket.emit("readUnread",data)


        if (typeof socketObj !== "undefined") {
          console.log("sender", sender);
          //if senderType is ADMIN please use ADMIN model for serach if(senderType === "Admin") {Admin.findOne} else {User.findOne}

        }
        msgCtrl.message_history(data);
        console.log("saaaaaaaaaaaaaaaaa", data);
      });

    /**
     * when user stoSSSp typing
     */
    socket.on("offTyping", (data) => {
      let receiver = data["receiver"];
      let socketObj = sockets.find((socket) => {
        if (socket.userId.toString() == receiver.toString()) {
          return socket;
        }
      });
      if (typeof socketObj !== "undefined") {
        socketObj.socket.emit("getOffTyping", data);
      }
    });
  });
};
