var _ = require("lodash");
var express = require("express");
var jwt = require("jsonwebtoken");
const cron = require("node-cron");

var async = require("async");
var axios = require("axios");
var mongoose = require("mongoose");
var multer = require("multer");
var constantmessage = require("../config/constants");
const drivermodel = require("../model/user");
const tranctiongmodel = require("../model/tansaction");
const Notification = require("../model/notification");
const utility = require("../config/utility");
const moment = require("moment");
var FCM = require("fcm-node");
const booking = require("./booking");
const formidable = require("formidable");
const jobhistorymodel = require("../model/jobhistory");
const fs = require("fs");
const driverstatusmodel = require("../model/driverstatus");

const driverdetailsmodel = require("../model/driverdetail");
const reviewratingmodel = require("../model/review");
Driver = mongoose.model("user");
const { driver } = require("mongoose");
const jobmodel = require("../model/jobhistory");
const driversdetailsmodel = require("../model/driverdetail");
// const { userInfo, totalmem } = require("os");
// const { reject } = require("lodash");
const client = require("twilio")(
  constantmessage.twilio.accountSid,
  constantmessage.twilio.authToken
);
var serverKey =
  "AAAAe2dFb3k:APA91bH1sVSzIm2RcC3TehkXMxTrzlJjATuHvCO4VsM2CyU8azuF_F6n89I9OlAKzRKI15TmlElBIjfznAma4OtlrsJzf3Hs_fSRHvrK7YAyYf2m3R-orykYtD28HnXDaCOQKByJKdLZ";
var fcm = new FCM(serverKey);

module.exports = {
  commonLogin: commonLogin,
  uploaddocuments: uploaddocuments,
  getjobhistory: getjobhistory,
  driverstatus: driverstatus,
  getdriver: getdriver,
  getdriverByid: getdriverByid,
  updatedriverData: updatedriverData,
  changedriversatus: changedriversatus,
  getAlldriver1: getAlldriver1,
  driverdetails: driverdetails,
  reviewandrating,
  getReviewAndRating,
  driverdistance,
  hailjob,
  waitingtime,
  completehailjob,
  viewdocuments,
  panicMode: panicMode,
  logout,
  getAllCoverJob: getAllCoverJob,
 getJobByid : getJobByid,
 jobCancelled:jobCancelled,

  // --------------------Admin-----------------
  AdminGetAllCoverJob: AdminGetAllCoverJob,
  AdminGetAllCompletedJob: AdminGetAllCompletedJob,
  adminGetAllOngoingJob: adminGetAllOngoingJob,
  getAllDrivers
  //-------------------------------------------
};
async function getLocation(data) {
  return await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`
  );
}

async function commonLogin(req, res) {
  var body = req.body ? req.body : {};



  console.log("login---", body);

  let currentTime = new Date();

  var checkuser = await drivermodel.findOne({ licencenumber: body.licencenumber });
  // console.log("check--", checkuser);

  if (checkuser) {
    let loginAlloed = false;
    let set = {}

    firstLoginTime = checkuser.firstLoginTime ? checkuser.firstLoginTime : null
    let duration = moment.duration(moment(firstLoginTime).diff()).asHours();

    console.log(duration, new Date(firstLoginTime), firstLoginTime)
    if (Math.abs(duration) < 13) {
      if (!firstLoginTime) {
        set.firstLoginTime = new Date()
        set.lastLogoutTime = null
      }
      loginAlloed = true;
    } else if (Math.abs(duration) > 13 && Math.abs(duration) <= 23) {
      loginAlloed = false;
    } else {
      set.firstLoginTime = new Date()
      set.lastLogoutTime = null
      loginAlloed = true;
    }

    if (loginAlloed) {

      if (!checkuser.lastloginTime) {
        set.lastloginTime = new Date().toLocaleTimeString()
      }

      await drivermodel.findOneAndUpdate({ licencenumber: body.licencenumber }, { $set: set })

      let login = async () => {
        return new Promise((resolve, reject) => {
          if (_.isEmpty(body.licencenumber) || _.isEmpty(body.dob)) {
            reject(constantmessage.validationMessages.requiredFieldmissing);
          } else {
            var jwtToken = null;
            let licencenumber = body.licencenumber;
            var userData = {
              licencenumber: licencenumber,
              // dob: new Date(body.dob).toD,
              isDeleted: false,
            };

            drivermodel
              .find({
                userType: "Driver",
                isDeleted: false,
                licencenumber: licencenumber,
                $expr: {
                  $eq: [{ $year: "$dob" }, parseInt(body.dob)],
                },
              })
              .exec(function (err, userInfo) {
            
           let driverdetil = userInfo[0]._id

           if(userInfo){
             driversdetailsmodel.findOne({driverid:driverdetil}).sort({_id :-1}).exec(function (err,detail){

             console.log("driverkilo---",detail.distance);
             if(err){
              reject("Error");
             }

                 console.log("info", userInfo[0]._id);
                if (err) {
                  reject("Error");
                }


                console.log(userInfo, "error in aggregation");
                if (userInfo.length > 0) {
      
                  if (!userInfo[0].deviceInfo) {
                    userInfo[0].deviceInfo = [];
                  }

                  var params = {
                    id: userInfo[0]._id,
                  };
                  jwtToken = jwt.sign(params, constantmessage.jwtsecret.secret, {
                    expiresIn: "13h",
                  });


                  var infoData = {};
                  var index = "index";

                  if (userInfo[0].deviceInfo.length > 0) {
                    for (var i in userInfo[0].deviceInfo) {
                      if (
                        userInfo[0].deviceInfo[i].deviceToken != body.deviceToken
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
                    userInfo[0].deviceInfo[index].access_token = jwtToken;
                    userInfo[0].deviceInfo[index].deviceToken = body.deviceToken;
                    userInfo[0].deviceInfo[index].deviceType = body.deviceType;
                  } else {
                    // userInfo.deviceInfo[index].access_token = jwtToken;
                    // userInfo.version = req.body.version
                    userInfo[0].deviceInfo.push({
                      access_token: jwtToken,
                      deviceType: body.deviceType,
                      deviceToken: body.deviceToken,
                    });
                  }

                  infoData.token = "Driver_Bearer " + jwtToken;
                  infoData.driverId = userInfo[0]._id;
                  infoData.dob = moment(userInfo[0].dob).format("L");
                  infoData.name = userInfo[0].name;
                  infoData.nikname = userInfo[0].nikname;
                  infoData.image = userInfo[0].imagefile
                  infoData.distance = detail.distance
                  drivermodel
                    .findOneAndUpdate(
                      { _id: userInfo[0]._id },
                      {
                        $set: {
                          deviceInfo: userInfo[0].deviceInfo,
                          onlinestatus: 1
                        },
                      }
                    )
                    .exec((err, userInfoResult) => {
                      if (!err) {
                        utility.removeExpiredTokenOfUser(userInfo[0]);
                        resolve(infoData);
                      }
                    });

                  // }
                } else {
                  // reject(constantmessage.validationMessages.Invalidcredential);
                  reject('You are not registered please signup')
                }
              })
              }
              });

            // else {

            //     console.log(info, 'info+info')
            //     reject('You are not registered please signup')
            // }
          }
        });


      };

      let callinglogin = async () => {
        try {
          let userLogin = await login();

          if (userLogin) {
            utility.sucesshandler(
              res,
              constantmessage.messages.loginSuccess,
              userLogin
            );
          }
        } catch (e) {
          console.log(e, "error+error");
          if (e == "Error") {
            utility.internalerrorhandler(
              res,
              constantmessage.validationMessages.intenalError
            );
          } else {
            utility.errorhandler(res, e);
          }
        }
      };
      callinglogin();
    } else {
      utility.errorhandler(res, `you can not login before,${moment().add(23 - Math.abs(duration), 'h').format("DD-MM-YYYY hh:MM:ss ")}`)
    }
  } else {
    utility.errorhandler(
      res,
      constantmessage.messages.loginerror
    );
  }
}
async function viewdocuments(req, res) {
  try {
    var document =[]
    let body = req.body ? req.body : {};
    let driverData = await drivermodel
      .findOne({ _id: body.driverid }, 'documents')
      console.log({driverData});
      console.log(driverData.documents.driverLicence);
      let data =[
        {name:"driverLicence",
          image :driverData.documents.driverLicence

        },
        {
          name:"trainingDoc",
          image : driverData.documents.trainingDoc
        },
        {
          name:"pEndorsement",
          image : driverData.documents.pEndorsement
        },
        {
          name:"hoistManual",
          image : driverData.documents.hoistManual
        },
        {
          name:"driverManual",
          image : driverData.documents.driverManual
        },
        {
          name:"healthSafetyPolicy",
          image : driverData.documents.healthSafetyPolicy
        },
       
        
      ]

    if (driverData) {
      utility.sucesshandler(res, "Sucess", data);
    }
    else {
      utility.errorhandler(res, "No data found")
    }
  } catch (e) {
    console.log('dsfdf', e);
    utility.internalerrorhandler(res);
  }
}

async function getjobhistory(req, res) {
  try {
    let body = req.body ? req.body : {};

    if (body != {}) {
      if (_.isEmpty(body.driverid) || _.isEmpty(body.dateOfJourney)) {
        let e = constantmessage.validationMessages.requiredFieldmissing;
        throw e;
      } else {
        console.log(
          moment(new Date(body.dateOfJourney))
            .endOf("day")
            .subtract(1, "days")
            .toDate()
        );
        let result = await driverstatusmodel
          .find({
            driverdetails: mongoose.Types.ObjectId(body.driverid),
            $and: [
              {
                dateOfJourney: {
                  $gte: moment(new Date(body.dateOfJourney))
                    .startOf("day")
                    .subtract(1, "days")
                    .format(),
                },
              },
              {
                dateOfJourney: {
                  $lte: moment(new Date(body.dateOfJourney))
                    .endOf("day")
                    .subtract(1, "days")
                    .format(),
                },
              },
            ],
          })
          .populate("user", "name phonenumber userType");

        console.log( "body++++++++++++++++++", result);

        let resultarray = [];
        if (result) {
       
          result.forEach((element) => {
            console.log("in length",element);
            if(element.tripstatus == 'Upcoming'){
            let obj = {
              pickuplocationaddress: element.pickupLocation.address,
              dropLocationaddress: element.dropLocation.address,
             tripstatus: element.tripstatus,

              username: element.user.name,
              areacode: "",
             image: element.user.imagefile
              ? element.user.imagefile
                : "",
              rating: 0,
              //  starttime:
              //   element.tripstatus == "Completed"
              //      ? moment(element.status[1].triptime).format("hh:mm a")
              //     : "",
              //  endtime:
              //    element.tripstatus == "Completed"
              //      ? moment(
              //        element.jobid.status[element.status.length - 1]
              //          .triptime
              //      ).format("hh:mm:ss a")
              //      : "",
            };
            resultarray.push(obj);
            console.log("array--",resultarray);
          }
          else if(element.jobtype =='Completed'){
            let resultarray = [];
            let obj = {
              pickuplocationaddress: element.pickupLocation.address,
              dropLocationaddress: element.dropLocation.address,
             tripstatus: element.tripstatus,

              username: element.user.name,
              areacode: "",
             image: element.user.imagefile
              ? element.user.imagefile
                : "",
              rating: 0,
               starttime:
                element.tripstatus == "Completed"
                   ? moment(element.status[1].triptime).format("hh:mm a")
                  : "",
               endtime:
                 element.tripstatus == "Completed"
                   ? moment(
                     element.jobid.status[element.status.length - 1]
                       .triptime
                   ).format("hh:mm:ss a")
                   : "",
            };
            resultarray.push(obj);
            console.log("array+++--",resultarray);
          }
          });
          if(result.length > 0){
          utility.sucesshandler(res, "Success", resultarray);
          }
          else {
            utility.errorhandler(res, "No Record Found");
          }
        }

      }
    } else {
      utility.errorhandler(res, "No Record Found");
    }
  } catch (e) {
    utility.errorhandler(res, "No Record Found");
  }
}

async function uploaddocuments(req, res) {
  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      console.log({ fields, files });
      let userId = req.user ? req.user._id ? req.user._id.toString() : null : null;
      if (fields.driverid) {
        userId = fields.driverid;
      }
      //  if (fields.driverid === req.user._id.toString() {
      let newDocsUrls = [];
      if (Object.keys(files).length > 0) {
        for (var field in files) {
          var fileType = files[field].type.substring(0, 5);
          var docsusrl = "/docs/uploads/";
          var uploadedDocs = await uploadDocs(files[field]);
          newDocsUrls.push({
            [field]: `${docsusrl + uploadedDocs}`,
          });
        }
        console.log({ newDocsUrls, userId });

        drivermodel
          .findByIdAndUpdate(userId, {
            $set: { documents: newDocsUrls },
          })
          .exec((err, result) => {
            if (err) {
              res.json({
                code: 402,
                status: false,
                message: "Something went wrong",
              });
            }
            if (result) {
              res.json({
                code: 200,
                status: true,
                message: "Docs uploaded successfully.",
                data: {
                  documents: newDocsUrls,
                },
              });
            }
          });
      } else {
        res.json({
          code: 402,
          status: true,
          message: "Please enter atleast one docs",
        });

        // } else {
        //   res.json({
        //     code: 402,
        //     status: false,
        //     message: "Invalid userid",
        //   });
      }
    });
  } catch (e) {
    console.log(e);
    utility.internalerrorhandler(res, e);
  }
}

var uploadDocs = (filePath) =>
  new Promise(async (resolve, reject) => {
    var ext = filePath.type.split("/")[1];
    console.log(filePath, "extension");
    var file = filePath.path;
    var imageName =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      "." +
      ext;

    var newpath = "./public/docs/uploads/" + imageName;

    // Read the file
    fs.readFile(file, function (err, data) {
      if (err) throw err;
      console.log("File read!");

      // Write the file
      fs.writeFile(newpath, data, function (err) {
        if (err) throw err;
        resolve(imageName);
        console.log("File written!");
      });

      // Delete the file
      // fs.unlink(file, function (err) {
      //   if (err) throw err;
      //   console.log("File deleted!");
      // });
    });

    // await fs.rename(file, newpath, function (err) {
    //   console.log(err ,"HHHHHHHHHHHHHHHHHHHH ERR");
    //   if (err) {
    //     throw err;
    //   } else {
    //     resolve(imageName);
    //   }
    // });
  });

async function driverstatus(req, res) {
  try {
    let body = req.body ? req.body : "";

    let obj = {
      location: {
        type: "Point",
        coordinates: [body.longitude, body.latitude],
      },
      driverid: req.user._id,
      triptime: new Date(body.triptime),
      status: body.status,
    };

    let result = await driverstatusmodel.find({});
    console.log(obj, result, "object driver");
    let update = await driverstatusmodel.findOneAndUpdate(
      { jobid: body.jobid },
      {
        $push: {
          status: obj,
        },
      }
    );

    utility.sucesshandler(res, "Driver status updated successfully");
  } catch (e) {
    console.log(e);
    utility.internalerrorhandler(res);
  }
}
function getdriver(req, res) {
  async function asy_init() {
    try {
      let driverlist = await query.findData(driverstatusmodel);
      console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.driverDataFetched,
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
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  asy_init();
}
function panicMode(req, res) {
  async function asy_init() {

    try {
      let driverlist = await Driver.findOne({ _id: req.body._id });
      console.log("feed--", driverlist);
      let data = {
        name: driverlist.name,
        driverCurrentLocation: driverlist.currentLocation,
        licenceNumber: driverlist.licencenumber,
        email: driverlist.email,
        message: "i am in problem",
      }
      console.log('data--', data);
      if (driverlist) {
        const payload = {
          from: req.body._id,
          message: `${data.name} is in problem`,
          type: 'system'
        }
        await new Notification(payload).save();
        utility.sucesshandler(
          res,
          constantmessage.messages.driverDataFetched,
          data
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  asy_init();
}

function getAlldriver1(req, res) {
  async function asy_init() {
    try {
      console.log("in all");
      let condition = {
        userType: "Driver",
        onlinestatus: "1",
        isAvailable: true,


      };
      let driverlist = await query.findData(drivermodel, condition);
      console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.driverDataFetched,
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
      // return Response(
      //   res,
      //   constant.statusCode.internalservererror,
      //   constant.messages.SOMETHING_WENT_WRONG,
      //   e
      // );
    }
  }
  asy_init();
}
function getdriverByid(req, res) {
  console.log("hit");
  async function get_driverByid() {
    console.log("driver id--");
    try {
      let Condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      console.log("id--", Condition);
      let driverdata = await query.findoneData(drivermodel, Condition);
      console.log("data--", driverdata);
      if (driverdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.driverDataFetched,
          driverdata
        );
      } else {
        utility.errorhandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_driverByid();
}
var Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({
  storage: Storage,
}).single("file");

function updatedriverData(req, res) {
  //console.log("body id",req.body.id);

  console.log("body data", req.body);

  //  upload.any();
  // console.log("req.body", req.body)
  async function update_driver() {
    try {
      /*  if (req.body && (!req.body.licencenumber)) {
            res.jsonp(
                Error(
                    utility.sucesshandler(res,constantmessage.validationMessages.Invaliddata)
                )
            );
        } 
        if (req.body && (!req.body.name)) {
            res.jsonp(
                Error(
                    utility.sucesshandler(res,constantmessage.validationMessages.Invaliddata)
                )
            );
        }
        if (req.body && (!req.body.rating)) {
            res.jsonp(
                Error(
                    utility.sucesshandler(res,constantmessage.validationMessages.Invaliddata)

                )
            );
        }  
        if (req.file && (!req.file.imageName)) {
            res.jsonp(
                Error(
                    utility.sucesshandler(res,constantmessage.validationMessages.Invaliddata)

                )
            );
        } */

      var dataObj = {};

      dataObj.licencenumber = req.body.licencenumber;
      //   console.log("lien--", req.body.licencenumber)
      dataObj.name = req.body.name;
      // console.log("name--", req.body.name)
      dataObj.rating = req.body.rating;
      //  console.log("rating--", req.body.rating)
      //  console.log("file--",req.file.imagefile)
      dataObj.imagefile = req.files[0].filename;
      console.log("img--", dataObj.imagefile);

      let condition = {
        _id: req.body.id,
      };

      let driverObj = await query.updateOneDocument(Driver, condition, dataObj);
      console.log("driverObj--", driverObj);
      if (driverObj.status == true) {
        utility.sucesshandler(
          res,
          constantmessage.messages.driverDataFetched,
          driverObj
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }

  update_driver(function () { });
}

async function changedriversatus(req, res) {
  try {
    let body = req.body ? req.body : {};
    let currentLocation = {
      type: "Point",
      coordinates: [body.longitude, body.latitude],
      address: body.address,
    };
    let update_status = await drivermodel
      .findOneAndUpdate(
        { _id: body.driverid },
        {
          $set: { onlinestatus: body.status, currentLocation: currentLocation },
        },
        { new: true }
      )
      .select({ onlinestatus: 1 });

    utility.sucesshandler(res, "Status updated successfully", update_status);
  } catch (e) {
    utility.internalerrorhandler(e);
  }
}

async function driverdetails(req, res) {
  try {
    let body = req.body ? req.body : {};
    ratedto = body._id;
    console.log("to", ratedto);
    console.log(body, "driverdetails+driverdetails");
    let driverdetails = await drivermodel
      .findById(body._id)
      .select({ licencenumber: 1, name: 1, imagefile: 1, phonenumber: 1 });
    console.log("der-->", driverdetails);
    let reviewdetails = await reviewratingmodel.find({ ratedto: ratedto });
    console.log("dertt-->", reviewdetails);
    let rating = 0;
    let count = 0;
    let phonenumber = 0;
    reviewdetails.forEach((element) => {
      rating += element.rating;
      count = count + 1;

      // rating = rating.parseFloat(rating).toFixed(2)
    });
    rating = rating / count;
    let data = {
      imagefile: driverdetails.imagefile,
      _id: driverdetails._id,
      licencenumber: driverdetails.licencenumber,
      phonenumber: driverdetails.phonenumber,
      name: driverdetails.name,
      rating: rating,
    };


    console.log("deatils--", driverdetails);
    utility.sucesshandler(res, "", data);
  } catch (e) {
    utility.internalerrorhandler(res, "", e);
  }
}

async function reviewandrating(req, res) {
  try {
    let body = req.body ? req.body : {};

    let obj = {
      ratedto: body.ratedto,
      rating: body.rating,
      ratedby: body.ratedby,
      review: body.review,
    };

    let result = await new reviewratingmodel(obj).save();
    console.log("rs", result);

    utility.sucesshandler(res, "Success");
  } catch (e) {
    utility.internalerrorhandler(e);
  }
}
async function getReviewAndRating(req, res) {
  console.log("body--", req.body)
  var rating = 0;
  var count = 0
  var review = '';
  try {
    let body = req.body ? req.body : {};


    let result = await reviewratingmodel.find({ ratedto: body.driverid })
    console.log("rs", result);
    result.forEach((element) => {
      rating = rating + element.rating
      count = count + 1;
      review = element.review
    })
    rating = rating / count
    let data = {
      rating: rating,
      review: review
    }

   // console.log("rating--", rating);
    utility.sucesshandler(res, "Success", data);
  } catch (e) {
    utility.internalerrorhandler(e);
  }

}
async function driverdistance(req, res) {
  try {
    let body = req.body ? req.body : {};

    console.log(body);
    let obj = {
      driverid: body.driverid,
      distance: body.distance,
      date: new Date(body.date),
    };

   let distance= await new driverdetailsmodel(obj).save();

    utility.sucesshandler(res, "successdistance", distance);
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(e);
  }
}

async function hailjob(req, res) {
  try {
    let body = req.body ? req.body : {};
    let response = await getLocation(body.pickupLocation);
    let obj = {
      driverdetails: body.driverid,

      jobtype: "Hailjob",
      pickupTime: body.pickupTime,
      pickupLocation: {
        coordinates: [
          body.pickupLocation.longitude,
          body.pickupLocation.latitude,
        ],
        type: "Point",
        address: response.data.results[0].formatted_address,
      },
      tripstatus: "Ongoing",
      tripStartTime: new Date()
    };

    console.log("ALl Date TO DB", obj);
    let driverstatus = await drivermodel
      .findOne({ _id: body.driverid, userType: "Driver" })
      .select({ onlinestatus: 1 });

    if (driverstatus.onlinestatus == "1") {
      let createjob = await new driverstatusmodel(obj).save();

      utility.sucesshandler(res, "Sucess", createjob);
    } else {
      utility.errorhandler(res, "Driver is online");
    }
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(e);
  }
}

async function waitingtime(req, res) {
  try {
    let body = req.body ? req.body : {};

    let updatejob = await driverstatusmodel.findOneAndUpdate(
      { _id: body.jobid },
      { $set: { waitingtime: body.waitingtime } }
    );

    utility.sucesshandler(res, "success");
  } catch (e) {
    utility.internalerrorhandler(e);
  }
}

async function completehailjob(req, res) {
  try {
    let body = req.body ? req.body : {};
    let response = await getLocation(body.destination);

    let dropLocation = {
      coordinates: [body.destination.longitude, body.destination.latitude],
      type: "Point",
      address: response.data.results[0].formatted_address,
    };
    var TotalAmount = 0;
    var count = 0;
    let fare = body.fare;
    let totalTime = body.totalTime;
    let waitingtime = body.waitingtime;
 let currentid = await driverstatusmodel.find({_id:body.jobid})
     console.log("id-",currentid);
    let driverstatus = await driverstatusmodel
      .findOneAndUpdate(
        { _id: body.jobid },
        {
          $set: {
            dropLocation: dropLocation,
            tripstatus: "Completed",
            fare: fare,
            waitingtime: waitingtime,
            totalTime: totalTime,
            tripendtime: new Date(body.tripendtime),
          },
        },
        { new: true }
      )
      .lean()
      .select({
        tripendtime: 1,
        pickupTime: 1,
        pickupLocation: 1,
        waitingtime: 1,
        dropLocation: 1,
        driverdetails: 1,
        fare: 1,
      });
    //   let data ={
    //     Amount :body.fare,
    //     jobid : body.jobid,
    //     driverdetails:currentid.driverdetails
    //   }
    // let saveob = new tranctiongmodel(data)
    // let rest  = await saveob.save()
    // console.log({rest});
    console.log("sta--", driverstatus.pickupTime);
    let sum = await tranctiongmodel
      .find({
        driverdetails: driverstatus.driverdetails,
      })
      .populate("user")
      .lean();
    sum.forEach((element) => {
      TotalAmount = TotalAmount + parseFloat(element.Amount);
      count = count + 1;
    });
    console.log("amount", { TotalAmount, count });
    const { destination } = req.body;

    let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${driverstatus.pickupLocation.coordinates[1]},${driverstatus.pickupLocation.coordinates[0]}&destinations=${destination.latitude},${destination.longitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
    //  let link =`https://maps.googleapis.com/maps/api/geocode/json?units=imperial&origins=${driverstatus.pickUpLocation.coordinates[1]},${driverstatus.pickUpLocation.coordinates[0]}&destinations=${destination.latitude},${destination.longitude}&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
    axios
      .get(link)
      .then(function (response) {
        // handle success
        //console.log("like00--",link);
        let link = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${driverstatus.pickupLocation.coordinates[1]},${driverstatus.pickupLocation.coordinates[0]}&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;

        axios
          .get(link)

          .then(function (response) {
            let link = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${destination.latitude},${destination.longitude}&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;

            axios
              .get(link)

              .then(function (response) {
                // handle success
                // utility.sucesshandler(res,"",response.data)
              });
            // handle success
            // utility.sucesshandler(res,"",response.data)
          });

        let splitdistance = response.data.rows[0].elements[0].distance.text.split(
          " "
        );
        console.log(splitdistance, "data+++++completehailjob 1.609");
        let kilometerdistance = parseFloat(splitdistance) * 1.609344;
        kilometerdistance = kilometerdistance.toFixed(2);
        pickupaddress = response.data.origin_addresses;
        dropaddress = response.data.destination_addresses;
        console.log("ddd--", dropaddress);
        // console.log("kilometer---",kilometerdistance);
        //  let fare = driverstatus.waitingtime +3+ parseFloat(kilometerdistance) * 6
        // let updateaddress =  driverstatusmodel.findOneAndUpdate({_id:body.jobid},{$set:{'dropLocation'{address:"dropaddress"}}, pickupLocation.address":pickupaddress}},{new:true})

        let fare = driverstatus.fare;
        //console.log("fareee--", updateaddress);
        // console.log("fare--",driverstatus._id);
        ///driverstatus.fare=fare.toFixed(0)
        bookingData = booking;
        // console.log("booking-",bookingData);
        let data = {
          destination_address: response.data.destination_addresses,
          source_address: response.data.origin_addresses,
          _id: driverstatus._id,
          fare: fare,
          distance: kilometerdistance,
          splitditance: splitdistance,
          TotalAmount: TotalAmount,
          TotalTrip: count,
          totalTime: totalTime,
        };
        console.log("data--", data);
        utility.sucesshandler(res, "success", data);

        // utility.sucesshandler(res,"",response.data)
      })
      .catch(function (error) {
        // handle error
        utility.errorhandler(res, error);

        console.log(error);
      });
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(e);
  }
}



function logout(req, res) {
  // const CRON_JOB_TIME = `0 0 */1 * * *`; // 1 hours
  var body = req.body ? req.body : {};

  /**
   * init = making method async
   */

  const inti = async () => {
    // lastLogoutTime

    // let take current date date
    let currentTime = new Date();

    // find driver from DB
    var checkuser = await drivermodel.findOne({ _id: mongoose.Types.ObjectId(body.userid) });
    let firstLoginTime = checkuser.firstLoginTime ? checkuser.firstLoginTime : null
    // get the hours forworded time
    let forwordTime = moment(firstLoginTime).add(13, 'h');
    // get time duration b/w firstlogintime vs currenttime
    let duration = moment.duration(forwordTime.diff(currentTime));
    // get the time in hours 
    let leftHours = duration.asHours();
    //making device array emptyp and onine status 0
    var deviceArr = [];
    let updateObj = { deviceInfo: deviceArr, onlinestatus: "0" }
    console.log(leftHours);
    if (firstLoginTime && leftHours <= 0) {
      updateObj.lastLogoutTime = new Date();
    }

    drivermodel
      .findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(body.userid) },
        updateObj, { $set: { onlinestatus: '0' } }
      )
      .exec(function (err, result) {
        if (err) {
          return res.json({
            code: 402,
            status: false,
            message: "Something went wrong",
          });
        }

        if (result) {
          return res.json({
            code: 200,
            status: true,
            message: "Successfully Logged out",
          });
        }
      });
  }
  inti();
}


function getAllCoverJob(req, res) {
  async function asy_init() {
    try {
      console.log("in all");
      let condition = {
        jobtype: "Coverjob",

      };
      let driverlist = await driverstatusmodel.find(condition).populate("riderdetails", "name phonenumber email imagefile userType").sort({ createdAt: -1 });
      // let driverlist = driverstatusmodel.find();
      console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.coverJobDataFetched,
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
function AdminGetAllCoverJob(req, res) {
  async function asy_init() {
    try {
      console.log("in all");
      let condition = {
        jobtype: "Coverjob",

      };
      let driverlist = await driverstatusmodel.find(condition).populate("user", "name phonenumber email imagefile userType").populate('user driverdetails').sort({ created_at: -1 });

      // let driverlist = driverstatusmodel.find();
      console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.coverJobDataFetched,
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


function adminGetAllOngoingJob(req, res) {
  async function asy_init() {
    try {
      console.log("in all");
      let condition = {
        jobtype: "Hailjob",
        tripstatus: "Ongoing",
        requestAction: "Accepted"
      };
      let driverlist = await driverstatusmodel.find(condition).populate("user driverdetails", "name phonenumber email imagefile userType").sort({ createdAt: -1 });
      // let driverlist = driverstatusmodel.find();
      console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.coverJobDataFetched,
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

function AdminGetAllCompletedJob(req, res) {
  async function asy_init() {
    try {
      console.log("in all");
      let condition = {
        jobtype: "Hailjob",
        tripstatus: "Completed",
        requestAction: "Accepted"
      };
      let driverlist = await driverstatusmodel.find(condition).populate("user driverdetails", "name phonenumber email imagefile userType").sort({ createdAt: -1 });
      // let driverlist = driverstatusmodel.find();
      console.log("feed--", driverlist);
      if (driverlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.coverJobDataFetched,
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

async function getAllDrivers(req, res) {
  try {
    const driverList = await drivermodel.find({ userType: 'Driver', onlinestatus: 1 }, { currentLocation: 1, name: 1, carRegNo: 1 }).lean()

    const response = await driverstatusmodel.aggregate([
      {
        $match: {
          tripstatus: 'Ongoing'
        },
      },
      {
        $group: {
          "_id": {
            driverdetails: '$driverdetails'
          },
          "jobs": { "$push": "$$ROOT" },
        }
      },
      {
        $sort: {
          created_at: -1
        }
      }
    ]);
    console.log('df', driverList)
    if (driverList) {
      if (response) {
        response.forEach((job) => {
          console.log(job);
          if (job._id.driverdetails) {
            driverList.forEach((driver, indx) => {
              if (job._id.driverdetails.toString() == driver._id.toString()) {
                driverList[indx] = { ...driver, currentJob: job.jobs }
              }
            })
          }
        })
      }
      utility.sucesshandler(res, "success", driverList)
    } else {
      res.status(201).send({
        msg: "Error Fetching Drivers Location"
      });
    }
  } catch (error) {
    console.log(error.message || 'Internal Server Error');
  }
}
function getJobByid(req, res) {
  console.log("hit body", req.body.id);
  async function get_driverByid() {
    try {
      let condition = {
        id: mongoose.Types.ObjectId(req.body.id),
      };
      console.log("id--", condition);
      let jobdata = await driverstatusmodel.findOne({_id:req.body.id}).sort({ _id: -1 })
      console.log("data--", jobdata);
      if (jobdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.JobdataFetched,
          jobdata
        );
      } else {
        utility.errorhandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_driverByid();
}
function jobCancelled(req, res) {
  console.log("hit body", req.body.id);
  async function jobcancel() {
    try {
      let condition = {
        id: mongoose.Types.ObjectId(req.body.id),
      };
      console.log("id--", condition);
      let jobdata = await driverstatusmodel.findByIdAndUpdate({_id:req.body.id},{$set:{tripstatus:"Cancelled"}}).populate('driverdetails user')
     if(jobdata != null){
         console.log("data--", jobdata.driverdetails.deviceInfo);
      var arr = jobdata.driverdetails.deviceInfo;
    
        let deviceToken = arr[arr.length - 1].deviceToken;
        let deviceType = arr[arr.length - 1].deviceType;
        if (deviceType == "Android") {
          var message = {
            to: deviceToken,
            data: {
              message: "Your running job is cancelled",
              title: "Normal job",
              user_id :jobdata.user._id ? jobdata.user._id  :'',
              user_name:jobdata.user.name ? jobdata.user.name :'',
              userType:jobdata.user.userType ? jobdata.user.userType  :"",
              pickupLocation:{
                longitude:
                    jobdata.pickupLocation.coordinates[0],
                  latitude:
                    jobdata.pickupLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: jobdata.pickupLocation.address,
              },
              dropLocation:{
                longitude:
                    jobdata.dropLocation.coordinates[0],
                  latitude:
                    jobdata.dropLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: jobdata.dropLocation.address,
              },
              jobtype:"cancel_ride"
            }
          }
          console.log({message});
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
                    message: `${userDetails1.name} has cancel ride request`,
                    from: `${userDetails1._id}`,
                    type: 'system'
                  };
                  await new Notification(notificationData).save();
                  console.log(result, "result");
                }
              }
            }
          });
        }else if(deviceType == "IOS"){
          var message = {
            to: deviceToken,
            notification: {
              badge: "1",
              body: "Normal job",
              sound: "default",
              data: {
                message: "Your running job is cancelled",
              title: "Normal job",
              user_id :jobdata.user._id ? jobdata.user._id  :'',
              user_name:jobdata.user.name ? jobdata.user.name :'',
              userType:jobdata.user.userType ? jobdata.user.userType  :"",
              pickupLocation:{
                longitude:
                    jobdata.pickupLocation.coordinates[0],
                  latitude:
                    jobdata.pickupLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: jobdata.pickupLocation.address,
              },
              dropLocation:{
                longitude:
                    jobdata.dropLocation.coordinates[0],
                  latitude:
                    jobdata.dropLocation.coordinates[1],
                  // dropareacode: dropareacode,
                  address: jobdata.dropLocation.address,
              },
              jobtype:"cancel_ride"
              }
            }
            }
            console.log({message});
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
                      message: `${userDetails1.name} has cancel ride request`,
                      from: `${userDetails1._id}`,
                      type: 'system'
                    };
                    await new Notification(notificationData).save();
                    console.log(result, "result");
                  }
                }
              }
            });
        }
      
      if (jobdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.jobdataCancelled,
          jobdata
        );
      } else {
        utility.errorhandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    }
    else {
      utility.errorhandler(
        res,"Your job id is invalid"
      );
    }
    } catch (e) {
      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  jobcancel();
}

