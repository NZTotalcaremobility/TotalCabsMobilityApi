const utility = require("../config/utility");

const customermodel = require("../model/user");
const transactionModal = require("../model/tansaction");
var constantmessage = require("../config/constants");
const compantModel = require("../model/company");
const cron = require("node-cron");
var socketcontroller = require("../lib/socket");
var randomstring = require("randomstring");
var emailtemplate = require("../model/emailtemplate");
var localStorage = require("localStorage");
var handlebars = require("handlebars");
const _ = require("lodash");
const axios = require("axios");
var moment = require("moment");
var expressSession = require("express-session");
var mongoose = require("mongoose");
const async = require("async");
var jwt = require("jsonwebtoken");
var driver = require("./driver");
const { driverstatus } = require("./driver");
const driverstatusmodel = require("../model/driverstatus");
const userModel = require("../model/user");
const companymodel = require("../model/company");
const review = require("../model/review");
const { isMatch } = require("lodash");
const { findOneAndUpdate } = require("../model/user");
const queryy = require("../config/common_query");
const { query } = require("express");
const client = require("twilio")(
  constantmessage.twilio.accountSid,
  constantmessage.twilio.authToken
);
Customer = mongoose.model("user");
var FCM = require("fcm-node");

var serverkey =
  "AAAAe2dFb3k:APA91bH1sVSzIm2RcC3TehkXMxTrzlJjATuHvCO4VsM2CyU8azuF_F6n89I9OlAKzRKI15TmlElBIjfznAma4OtlrsJzf3Hs_fSRHvrK7YAyYf2m3R-orykYtD28HnXDaCOQKByJKdLZ";
var fcm = new FCM(serverkey);
module.exports = {
  customersignup: customersignup,
  customerSignupOtp: customerSignupOtp,
  forgotPassword: forgotPassword,
  resetpassword: resetpassword,
  verifyLink: verifyLink,
  customerLogin: customerLogin,
  customerLoginPhone: customerLoginPhone,
  otpverification: otpverification,

  riderdetails: riderdetails,
  getcustomer: getcustomer,
  getcustomerByid: getcustomerByid,
  updatecustomerData: updatecustomerData,
  changepassword: changepassword,
  deleteaccount: deleteaccount,
  favorite: favorite,
  unfavorite: unfavorite,
  getdistance: getdistance,
  getFavoriteLocation: getFavoriteLocation,
  addLocation: addLocation,
  editDriver: editDriver,
  getdistance1,
  getdistance1,
  editRider,
  getdistance2,
  showAvailableVehicle,
  // -----------------Admin------------------------
  adminAddCustomer: adminAddCustomer,
  adminGetCustomerByid: adminGetCustomerByid,
  adminGetCustomer: adminGetCustomer,
  adminUpdateCustomer: adminUpdateCustomer,
  adminDeleteUser: adminDeleteUser,

  adminAddDriver: adminAddDriver,
  adminGetDriver: adminGetDriver,
  adminDeleteDriver: adminDeleteDriver,
  adminGetDriverByid: adminGetDriverByid,
  adminUpdateDriver: adminUpdateDriver,
  adminGetDriverByIdWithReview: adminGetDriverByIdWithReview,
  adminGetDistance: adminGetDistance,
  adminBlockDriver: adminBlockDriver,
  // ---------------------------------------------

  searchUser: searchUser,
  getUserWithjobs: getUserWithjobs,
  getSubadminList: getSubadminList,
  updatePermission: updatePermission,
  updateKeyStatus: updateKeyStatus,
  deleteSubAdmin: deleteSubAdmin,
  verifyLinkAdmin: verifyLinkAdmin,
};
function addLocation(req, res) {
  console.log("body data", req.body);

  async function add_location() {
    try {
      const { key, loc, id } = req.body;
      console.log({ key, loc, id });
      let dataObj = {};
      if (key === "Pickup") {
        dataObj.pickupLocation = {
          type: "Point",
          coordinates: [loc.longitude, loc.latitude],
          address: loc.address,
        };
      } else {
        dataObj.dropLocation = {
          type: "Point",
          coordinates: [loc.longitude, loc.latitude],
          address: loc.address,
        };
      }

      let condition = {
        _id: id,
      };
      console.log({ condition, dataObj });
      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj,
        { isDeleted: false }
      );
      console.log("obj--", customerObj);
      if (customerObj.status) {
        console.log("ok done");
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataUpdated,
          customerObj
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

  add_location(function () {});
}

function getFavoriteLocation(req, res) {
  console.log("hit body", req.body._id);
  async function getFavoriteLocation() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      console.log("id--", condition);
      let customerdata = await queryy.findoneData(Customer, condition);
      console.log("data--", customerdata);
      if (customerdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          customerdata
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
  getFavoriteLocation();
}

function favorite(req, res) {
  console.log("body data", req.body);

  async function update_favorate() {
    try {
      const { key, loc, id } = req.body;
      console.log({ key, loc, id });
      let dataObj = {};
      if (key === "Pickup") {
        dataObj.favoritePickupLocation = {
          type: "Point",
          coordinates: [loc.longitude, loc.latitude],
          address: loc.address,
        };
      } else {
        dataObj.favoriteDropLocation = {
          type: "Point",
          coordinates: [loc.longitude, loc.latitude],
          address: loc.address,
        };
      }

      let condition = {
        _id: id,
      };
      console.log({ condition, dataObj });
      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj
      );
      console.log("obj--", customerObj);
      if (customerObj.status) {
        console.log("ok");
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataUpdated,
          customerObj
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

  update_favorate(function () {});
}
function unfavorite(req, res) {
  console.log("body data", req.body);

  async function update_unfavorate() {
    try {
      const { key, loc, id } = req.body;
      console.log({ key, loc, id });
      let dataObj = {};
      if (key === "Pickup") {
        dataObj.favoritePickupLocation = {
          type: "",
          coordinates: [],
          address: "",
        };
      } else {
        dataObj.favoriteDropLocation = {
          type: "",
          coordinates: [],
          address: "",
        };
      }

      let condition = {
        _id: id,
      };
      console.log({ condition, dataObj });
      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj
      );
      console.log("obj--", customerObj);
      if (customerObj.status) {
        console.log("ok");
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataUpdated,
          customerObj
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

  update_unfavorate(function () {});
}
function getdistance(req, res) {
  async function get_distance() {
    try {
      console.log(
        "body////////////////////////////////////////////////////",
        req.body
      );
      const { pickupLocation, dropLocation } = req.body;

      let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${pickupLocation.latitude},${pickupLocation.longitude}&destinations=${dropLocation.latitude},${dropLocation.longitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
      console.log({ pickupLocation, dropLocation, link });

      axios
        .get(link)
        .then(function (response) {
          // handle success
          utility.sucesshandler(res, "", response.data);
        })

        .catch(function (error) {
          // handle error
          utility.errorhandler(res, error);

          console.log(error);
        });
    } catch (e) {
      // utility.errorhandler(res, error)

      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_distance(function () {});
}
function getdistance1(req, res) {
  async function get_distance1() {
    try {
      console.log("distance---------------------", req.body);
      const { origin, destination } = req.body;

      let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
      console.log({ origin, destination, link });

      axios
        .get(link)
        .then(function (response) {
          // handle success
          utility.sucesshandler(res, "", response.data);
        })
        .catch(function (error) {
          // handle error
          utility.errorhandler(res, error);

          console.log(error);
        });
    } catch (e) {
      // utility.errorhandler(res, error)

      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_distance1(function () {});
}

function showAvailableVehicle(req, res) {
  async function _showAvailableVehicle() {
    try {
      const { origin, destination, carType } = req.body;
      console.log("body data", req.body);

      let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA&origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}`;

      let totalResult = {
        duration: "",
        distance: 0,
      };

      let result = await axios.get(link);
      if (result.error) throw { error: "Somethin Went Wrong!" };
      if (
        result.data &&
        result.data.rows[0].elements &&
        result.data &&
        result.data.rows[0].elements[0].status === "OK"
      ) {
        totalResult = {
          duration: result.data.rows[0].elements[0].duration.text,
          distance: result.data.rows[0].elements[0].distance.value,
        };
      }

      const availableVehicles = await queryy.findData(
        customermodel,
        { userType: "Driver", onlinestatus: 1, carType: carType },
        "name carType carBrand carRegNo currentLocation",
        null
      );

      if (availableVehicles.error) throw { messgae: "Internal Server Error!" };
      if (!availableVehicles.status || _.isEmpty(availableVehicles.data))
        utility.sucesshandler(res, "No Data Found", []);

      const { data } = availableVehicles;

      let finalResult = [];
      let responseResult = {};

      let destinationArry = "";
      let count = 0;
      data.forEach(async (element, index) => {
        const { currentLocation } = element;
        if (currentLocation && currentLocation.coordinates) {
          destinationArry += `${currentLocation.coordinates
            .reverse()
            .toString()}|`;
          finalResult.push(element);
          count++;
        }
      });
      if (destinationArry) {
        const { latitude, longitude, address } = origin;
        let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA&origins=${latitude},${longitude}&destinations=${destinationArry}`;
        axios
          .get(link)
          .then(function (response) {
            if (
              response.data &&
              !_.isEmpty(response.data.rows) &&
              response.data.rows[0].elements
            )
              response.data.rows[0].elements.forEach((row, index) => {
                const { status } = row;
                if (status === "OK") {
                  const { distance, duration } = row;
                  if (responseResult[finalResult[index].carType]) {
                    if (
                      responseResult[finalResult[index].carType].distance >
                      distance.value
                    ) {
                      responseResult[finalResult[index].carType] = {
                        duration: duration.text,
                        distance: distance.value,
                        ...finalResult[index],
                      };
                    }
                  } else {
                    responseResult[finalResult[index].carType] = {
                      distance: distance.value,
                      duration: duration.text,
                      ...finalResult[index],
                    };
                  }
                }
              });
            let okResult = {
              ...totalResult,
              availableVehicles: responseResult,
            };

            console.log("ok", okResult);
            utility.sucesshandler(res, "Data Successfully fetched", okResult);
          })
          .catch(function (error) {
            utility.errorhandler(res, error);
            console.log(error);
          });
      }
    } catch (e) {
      console.log("e", e);
      utility.errorhandler(res, constantmessage.messages.SOMETHING_WENT_WRONG);
    }
  }
  _showAvailableVehicle(function () {});
}

function getdistance2(req, res) {
  async function get_distance2() {
    try {
      console.log("tttttt", req.body);
      const { origin, destination } = req.body;
      driverlatitude = req.body.driverlatitude;
      driverlongitude = req.body.driverlongitude;
      latitude = req.body.latitude;
      longitude = req.body.longitude;
      //  const { origin, destination } = req.body;
      let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=kilometer&origins=${driverlatitude},${driverlongitude}&destinations=${latitude},${longitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
      //console.log({ origin, destination, link });

      axios
        .get(link)
        .then(function (response) {
          console.log("dataaa--", response.data);
          utility.sucesshandler(res, "", response.data);
        })
        .catch(function (error) {
          // handle error
          utility.errorhandler(res, error);

          console.log(error);
        });
    } catch (e) {
      // utility.errorhandler(res, error)

      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_distance2(function () {});
}

async function customerSignupOtp(req, res) {
  customermodel.existPhonenumberCheck(req.body.phonenumber, async function (err, exist) {
    if (err) {
      throw err;
    } else if (exist !== true) {
      utility.errorhandler(res, constantmessage.validationMessages.phoneAlreadyExist);
    } else if (exist) {
      let a = Math.floor(100000 + Math.random() * 900000);
      console.log('a-----', a);
      console.log('res-----', res);
      await client.messages.create({
        body: "Your verification code is:" + " " + a,
        from: +12059463843,
        to: +91 + req.body.phonenumber,
      });
      const finalData = {
        code: 200, 
        message: "Verification code has been send to your Mobileno."}
      utility.sucesshandler(res, constantmessage.messages.otpsend, {OTP: a});
    }
  });
}

async function customersignup(req, res) {
  try {
    let body = req.body ? req.body : {};

    if (body.email) {
      customermodel.existCheck(body.email, async function (err, exist) {
        if (err) {
          reject(err);
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
                  constantmessage.weburl.url +
                  "/accountverification/" +
                  userMailData.verifying_token;
                let message = template({
                  URL: url,
                  USERNAME: userMailData.name,
                });
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
                        password: body.confirmpassword,
                        verifyingToken: userMailData.verifying_token,
                        name: body.name,
                        phonenumber: body.phonenumber,
                        userType: "Normal",
                      };

                      let saveobj = new customermodel(usersave);

                      await saveobj.save();

                      utility.sucesshandler(
                        res,
                        "Registered successfully,please verfiy your email to login"
                      );
                    }
                  }
                );
              }
            });
        }
      });
    } else if (body.phonenumber) {
      console.log("in phonenumber", body.phonenumber);
      customermodel.existPhonenumberCheck(
        body.phonenumber,
        async function (err, exist) {
          console.log("e", exist);
          if (err) {
            throw err;
          } else if (exist !== true) {
            utility.errorhandler(
              res,
              constantmessage.validationMessages.phoneAlreadyExist
            );
          } else if (exist) {
            let usersave = {
              email: body.email,
              password: body.confirmpassword,
              name: body.name,
              phonenumber: body.phonenumber,
              userType: "Normal",
            };

            let a = Math.floor(100000 + Math.random() * 900000);
            let password = a;
            let message = await client.messages.create({
              body: "Your verification code is:" + " " + a,
              from: +12059463843,
              to: +91 + usersave.phonenumber,
            });

            if (message) {
              usersave.otp = password;
              // let saveobj = new customermodel(usersave);
              // await saveobj.save();
              utility.sucesshandler(res, constantmessage.messages.otpsend);
            }
          }
        }
      );
    }
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(res);
  }
}

async function forgotPassword(req, res) {
  const body = req.body ? req.body : {};

  const forgotPasswordfunction = () => {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(body.email)) {
        reject(constantmessage.validationMessages.requiredFieldmissing);
      } else {
        async.waterfall(
          [
            function (done) {
              customermodel
                .findOne({
                  email: body.email,
                  isDeleted: false,
                })
                .exec(function (err, user) {
                  if (user) {
                    done(err, user);
                  } else {
                    done(true);
                  }
                });
            },
            function (user, done, err) {
              randomToken = randomstring.generate(30);

              done(err, user, randomToken);
            },
            function (userresult, randomToken, done) {
              customermodel
                .findOneAndUpdate(
                  { email: userresult.email, isDeleted: false },
                  {
                    resetPasswordToken: randomToken,
                    resetPasswordExpires: Date.now() + 60000000,
                  },
                  { upsert: true, new: true }
                )
                .exec((err, new_user) => {
                  done(err, randomToken, new_user);
                });
            },
            function (randomToken, user, done) {
              var userMailData = {
                email: user.email,
                name: user.name ? user.name : "",
                randomToken: user.resetPasswordToken,
              };
              let userType = user.userType;
              emailtemplate
                .findOne({ findBy: "forgot_password" })
                .exec(async (err, emaildataresult) => {
                  if (err) {
                    reject(true);
                    // utility.readTemplateSendMail(user.email, constantmessage.emailSubjects.forgotPassword, userMailData, 'forgot_password', function (err, resp) {

                    //     done(null, resp)
                    // });

                    // return res.json({ "code": 200, "status": true, "message": constantsObj.messages.forgotPasswordSuccess });
                  } else if (emaildataresult) {
                    let selectedSubject = emaildataresult.subject;
                    let selectedContent = emaildataresult.content;
                    let reset_urlToken = "";
                    if (userType === "Admin" || userType === "SubAdmin") {
                      reset_urlToken =
                        constantmessage.adminURL.url +
                        "/resetPassword/" +
                        userMailData.randomToken;
                    } else {
                      reset_urlToken =
                        constantmessage.weburl.url +
                        "/auth/reset-password/" +
                        userMailData.randomToken;
                    }
                    // let reset_link =
                    //     '<a href="' +
                    //     reset_urlToken +
                    //     '" target="_blank">Reset Password</a>';
                    const template = handlebars.compile(
                      selectedContent.replace(/\n|\r/g, "")
                    );
                    let message = template({
                      URL: reset_urlToken,
                      fname: userMailData.name,
                    });

                    utility.sendmail(
                      userMailData.email,
                      selectedSubject,
                      message,
                      async (err, finalresult) => {
                        if (err) {
                          reject(true);
                        } else if (finalresult) {
                          resolve(true);
                        }
                      }
                    );
                  }
                });
            },
          ],
          function (err, resp) {
            if (err == true) {
              reject(constantmessage.messages.userNotExist);
            } else if (resp) {
              resolve(true);
            }
          }
        );
      }
    });
  };

  const forgotPasswordCalling = async () => {
    try {
      let result = await forgotPasswordfunction();

      if (result == true) {
        utility.sucesshandler(res, constantmessage.messages.forgotpasswordlink);
      }
    } catch (error) {
      console.log(error, "error in forgot password");
      utility.errorhandler(res, error);
    }
  };

  forgotPasswordCalling();
}

async function resetpassword(req, res) {
  let passwordReset = () => {
    return new Promise(async (resolve, reject) => {
      let body = req.body ? req.body : {};

      if (_.isEmpty(body.ConfirmPassword)) {
        reject(constantmessage.validationMessages.requiredFieldmissing);
      } else {
        customermodel
          .findOne({
            resetPasswordToken: body.token,
            isDeleted: false,
            resetPasswordExpires: {
              $gt: Date.now(),
            },
          })
          .exec(async function (err, userresult) {
            if (err) {
              reject(true);
            }
            if (!userresult) {
              reject(constantmessage.validationMessages.passwordNotreset);
            }

            if (userresult) {
              userresult.password = body.ConfirmPassword;
              userresult.resetPasswordToken = undefined;
              userresult.resetPasswordExpires = undefined;
              await userresult.save(function (err) {
                if (err) {
                  reject(true);
                } else {
                  var userMailData = {
                    email: userresult.email,
                    name: userresult.name,
                  };
                  emailtemplate
                    .findOne({ findBy: "reset_password" })
                    .exec(async (err, emaildataresult) => {
                      if (err) {
                        reject(true);
                        // utility.readTemplateSendMail(user.email, constantmessage.emailSubjects.forgotPassword, userMailData, 'forgot_password', function (err, resp) {

                        //     done(null, resp)
                        // });

                        // return res.json({ "code": 200, "status": true, "message": constantsObj.messages.forgotPasswordSuccess });
                      } else if (emaildataresult) {
                        let selectedSubject = emaildataresult.subject;
                        let selectedContent = emaildataresult.content;

                        const template = handlebars.compile(
                          selectedContent.replace(/\n|\r/g, "")
                        );
                        let message = template({
                          fname: userMailData.name,
                        });

                        utility.sendmail(
                          userMailData.email,
                          selectedSubject,
                          message,
                          async (err, finalresult) => {
                            if (err) {
                              reject(true);
                            } else if (finalresult) {
                              resolve(true);
                            }
                          }
                        );
                        // utility.readTemplateSendMail(userresult.email, constantmessage.emailSubjects.passwordReset, userMailData, 'reset_password', function (err, resp) {

                        //     if (resp) {
                        //         resolve(true)
                        //     }
                        // });
                      }
                    });
                }
              });
            }
          });
      }
    });
  };

  const resetpasswordCalling = async () => {
    try {
      let result = await passwordReset();
      if (result) {
        utility.sucesshandler(
          res,
          constantmessage.messages.passwordResetSuccessfully
        );
      }
    } catch (e) {
      if (e == true) {
        utility.internalerrorhandler(res);
      } else {
        utility.errorhandler(res, e);
      }
    }
  };
  resetpasswordCalling();
}
async function verifyLink(req, res) {
  try {
    let userresult = await customermodel.findOne({
      verifyingToken: req.body.token,
      isDeleted: false,
    });
    if (!userresult) {
      userresult = await compantModel.findOne({
        verifyingToken: req.body.token,
        isDeleted: false,
      });
      if (!userresult) {
        utility.errorhandler(res, "Invalid Verifying link");
      } else {
        userresult.isEmailVerified = true;
        userresult.verifyingToken = undefined;
        let savedata = await userresult.save();
        if (savedata) {
          utility.sucesshandler(res, "Verified Sucsessfully", "");
        }
      }
    } else {
      userresult.isEmailVerified = true;
      userresult.verifyingToken = undefined;
      let savedata = await userresult.save();
      if (savedata) {
        utility.sucesshandler(res, "Verified Sucsessfully", "");
      }
    }
  } catch (error) {
    utility.internalerrorhandler(res);
  }
}
async function verifyLinkAdmin(req, res) {
  try {
    let userresult = await customermodel.findOne({
      verifyingToken: req.body.token,
      isDeleted: false,
    });
    if (!userresult) {
      userresult = await compantModel.findOne({
        verifyingToken: req.body.token,
        isDeleted: false,
      });
      if (!userresult) {
        utility.errorhandler(res, "Invalid Verifying link");
      } else {
        let randomToken = randomstring.generate(30);
        userresult.resetPasswordToken = randomToken;
        userresult.resetPasswordExpires = Date.now() + 60000000;
        userresult.isEmailVerified = true;
        userresult.verifyingToken = undefined;
        userresult.status = true;
        let savedata = await userresult.save();
        if (savedata) {
          utility.sucesshandler(res, "Verified Sucsessfully", {
            token: randomToken,
          });
        }
      }
    } else {
      let randomToken = randomstring.generate(30);
      userresult.resetPasswordToken = randomToken;
      userresult.resetPasswordExpires = Date.now() + 60000000;
      userresult.isEmailVerified = true;
      userresult.verifyingToken = undefined;
      userresult.status = true;
      let savedata = await userresult.save();
      if (savedata) {
        utility.sucesshandler(res, "Verified Sucsessfully", {
          token: randomToken,
        });
      }
    }
  } catch (error) {
    console.log(error);
    utility.internalerrorhandler(res);
  }
}
var userdata;
async function customerLogin(req, res) {
  var body = req.body ? req.body : {};
  console.log("body--", body);
  let email = body.email;
  var checkuser;
  if (isNaN(email)) {
    checkuser = await customermodel.findOne({ email: email });
    console.log("email--,", checkuser);
    let login = async () => {
      return new Promise((resolve, reject) => {
        if (_.isEmpty(body.email) || _.isEmpty(body.password)) {
          reject(constantmessage.validationMessages.requiredFieldmissing);
        } else {
          var jwtToken = null;
          let email = body.email;
          var userData = {
            email: email,

            isDeleted: false,
          };
          customermodel.findOne(userData).exec(function (err, userInfo) {
            if (err) {
              reject("Error");
            }
            userdata = userInfo;
            console.log("data--", userdata);
            if (userInfo != null) {
              if (userInfo.status == true) {
                reject(constantmessage.messages.accountActivation);
              }
              // else if (info.isDeleted == true) {
              //
              //     reject(constantmessage.messages.accountDeleted)
              // }
              else if (userInfo.isEmailVerified == false) {
                reject(constantmessage.messages.Emailnotverified);
              } else {
                userInfo.comparePassword(
                  body.password,
                  async function (err, isMatch) {
                    if (isMatch && !err) {
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

                      userid = userdata._id;
                      _id = userid;
                      let lastloginTime = "";

                      let logindata = await queryy.findoneData(
                        customermodel,
                        _id
                      );
                      let lastlogintime = logindata.data.lastloginTime;
                      let lastupdateloginDate = logindata.data.updatedAt;
                      lastupdateloginDate = lastupdateloginDate.getDate();
                      console.log("date---", lastupdateloginDate);
                      lastloginTime = new Date().toLocaleTimeString();

                      // console.log("login--",logintime);
                      var infoData = {};
                      var dataObj = {};
                      let condition = {
                        _id: userInfo._id,
                      };

                      dataObj.lastloginTime = lastloginTime;
                      let endTime = new Date().toLocaleTimeString();
                      console.log("endtime--", endTime);
                      //                  console.log("dataobj---",dataObj);

                      let update = await queryy.updateOneDocument(
                        customermodel,
                        condition,
                        dataObj
                      );
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
                            userInfo.deviceInfo[i].deviceToken !=
                            body.deviceToken
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
                        userInfo.deviceInfo[index].deviceToken =
                          body.deviceToken;
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
                      let phonenumber = null;
                      let key = 0;
                      let logintime = "";
                      if (userInfo.lastloginTime != 0) {
                        logintime = userInfo.lastloginTime;
                      }

                      if (userInfo.phonenumber != 0) {
                        phonenumber = userInfo.phonenumbers;
                      }

                      if (userInfo.email != null) {
                        email = userInfo.email;
                      }

                      if (userInfo.companyname != null) {
                        companyname = userInfo.companyname;
                      }

                      if (userInfo.imagefile != null) {
                        imagefile = userInfo.imagefile;
                      }
                      if (userInfo.keyStatus) {
                        key = userInfo.key;
                      }

                      infoData.token = "User_Bearer " + jwtToken;
                      infoData.userType = userInfo.userType;
                      infoData.userId = userInfo._id;
                      infoData.email = userInfo.email ? userInfo.email : "";
                      infoData.name = userInfo.name ? userInfo.name : "";
                      infoData.phonenumber = userInfo.phonenumber
                        ? userInfo.phonenumber
                        : "";
                      infoData.imagefile = imagefile ? userInfo.imagefile : "";
                      infoData.companyname = userInfo.companyname
                        ? userInfo.companyname
                        : "";
                      infoData.isEmailVerified = userInfo.isEmailVerified
                        ? userInfo.isEmailVerified
                        : false;
                      infoData.isPhoneVerified = userInfo.phoneverified
                        ? userInfo.phoneverified
                        : false;

                      if (key !== 0) {
                        infoData.key = key;
                      }

                      infoData.logintime = userInfo.lastloginTime
                        ? userInfo.lastloginTime
                        : "";
                      localStorage.setItem(jwtToken);
                      resolve(infoData);
                    } else {
                      reject(constantmessage.validationMessages.wrongPassword);
                    }
                  }
                );
              }
            } else {
              console.log("in rject else");
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
          utility.sucesshandler(
            res,
            constantmessage.messages.loginSuccess,
            userLogin
          );
        }
      } catch (e) {
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
    checkuser = await customermodel.findOne({ phonenumber: email });
    console.log("checkuser", checkuser);

    // console.log("check--", checkuser.email);
    let login = async () => {
      return new Promise((resolve, reject) => {
        if (_.isEmpty(body.email) || _.isEmpty(body.password)) {
          reject(constantmessage.validationMessages.requiredFieldmissing);
        } else {
          var jwtToken = null;
          let email = body.email;
          var userData = {
            phonenumber: email,

            isDeleted: false,
          };
          customermodel.findOne(userData).exec(function (err, userInfo) {
            if (err) {
              reject("Error");
            }
            userdata = userInfo;
            console.log("data--", userdata);
            if (userInfo != null) {
              if (userInfo.status == true) {
                reject(constantmessage.messages.accountActivation);
              } else if (userInfo.isDeleted == true) {
                reject(constantmessage.messages.accountDeleted);
              } else if (userInfo.phoneverified == false) {
                reject(constantmessage.messages.Phoneverified);
              } else {
                console.log("password--", body.password);
                userInfo.comparePassword(
                  body.password,
                  async function (err, isMatch) {
                    if (isMatch) {
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

                      userid = userdata._id;
                      _id = userid;
                      let lastloginTime = "";

                      let logindata = await queryy.findoneData(
                        customermodel,
                        _id
                      );
                      let lastlogintime = logindata.data.lastloginTime;
                      let lastupdateloginDate = logindata.data.updatedAt;
                      lastupdateloginDate = lastupdateloginDate.getDate();
                      console.log("date---", lastupdateloginDate);
                      lastloginTime = new Date().toLocaleTimeString();

                      // console.log("login--",logintime);
                      var infoData = {};
                      var dataObj = {};
                      let condition = {
                        _id: userInfo._id,
                      };

                      dataObj.lastloginTime = lastloginTime;
                      let endTime = new Date().toLocaleTimeString();
                      console.log("endtime--", endTime);
                      //                  console.log("dataobj---",dataObj);

                      let update = await queryy.updateOneDocument(
                        customermodel,
                        condition,
                        dataObj
                      );
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
                            userInfo.deviceInfo[i].deviceToken !=
                            body.deviceToken
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
                        userInfo.deviceInfo[index].deviceToken =
                          body.deviceToken;
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
                      let logintime = "";
                      if (userInfo.lastloginTime != 0) {
                        logintime = userInfo.lastloginTime;
                      }

                      if (userInfo.phonenumber != 0) {
                        phonenumber = userInfo.phonenumbers;
                      }

                      if (userInfo.email != null) {
                        email = userInfo.email;
                      }

                      if (userInfo.companyname != null) {
                        companyname = userInfo.companyname;
                      }

                      if (userInfo.imagefile != null) {
                        imagefile = userInfo.imagefile;
                      }
                      if (userInfo.keyStatus) {
                        key = userInfo.key;
                      }

                      infoData.token = "User_Bearer " + jwtToken;
                      infoData.userType = userInfo.userType;
                      infoData.userId = userInfo._id;
                      infoData.email = userInfo.email ? userInfo.email : "";
                      infoData.name = userInfo.name ? userInfo.name : "";
                      infoData.phonenumber = userInfo.phonenumber
                        ? userInfo.phonenumber
                        : "";
                      infoData.imagefile = imagefile ? userInfo.imagefile : "";
                      infoData.companyname = userInfo.companyname
                        ? userInfo.companyname
                        : "";
                      infoData.isEmailVerified = userInfo.isEmailVerified
                        ? userInfo.isEmailVerified
                        : false;
                      infoData.isPhoneVerified = userInfo.phoneverified
                        ? userInfo.phoneverified
                        : false;

                      if (key !== 0) {
                        infoData.key = key;
                      }

                      infoData.logintime = userInfo.lastloginTime
                        ? userInfo.lastloginTime
                        : "";
                      localStorage.setItem(jwtToken);
                      resolve(infoData);
                    } else {
                      reject(constantmessage.validationMessages.wrongPassword);
                    }
                  }
                );
              }
            } else {
              reject(constantmessage.messages.phonenotexist);
            }
          });
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
  }
}

// const CRON_JOB_TIME = `0 */1 * * * *`; // every second
// cron.schedule(CRON_JOB_TIME,  async(req,res) => {

//     console.log("this is cron job executed");
//   //  var body = req.body ? req.body : {}
//     userid = userdata._id
//     _id=userid
//     let logindata = await queryy.findoneData(customermodel,_id)
//    let startTime = logindata.data.lastloginTime
//    let endTime = new Date().toLocaleTimeString();
//    console.log("tart--",startTime);
//  console.log('enddd--',endTime);
//  let type = logindata.data.userType
//  console.log("type---",type);
//    startTime = moment(startTime,'hh:mm:ss a')
//    endTime = moment(endTime,'hh:mm:ss a')
//    var duration1 = endTime.diff(startTime, 'hours')

//   var duration=(moment(endTime).diff(startTime, 'hours'));
//   // var hours = parseInt(duration.asHours());
//   console.log("duration--",duration1);
//   if(duration>=13)
//   {
//     console.log("inif");
//         var deviceArr = []
//       let logout=  customermodel.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(userid) }, { 'deviceInfo': deviceArr ,onlinestatus:'0'})
//      // console.log("log",logout);
//       if(logout)
//             {
//              console.log("done");
//              var message = {

//               notification : {

//                   body : 'driver Logout successfully '
//               }
//           };
//           fcm.send(message, function(err,response){
//             if(err) {
//               console.log(message);
//                    console.log("Something has gone wrong !");
//              } else {
//                  console.log("Successfully sent with resposne :",response);
//                }
//             });

//               }
//            else {
//             utility.errorhandler(res, error)

//         }
//       }
// });

async function customerLoginPhone(req, res) {
  try {
    var phonenumber = req.body.phonenumber;

    let a = Math.floor(100000 + Math.random() * 900000);
    var password = a;
    console.log("random no-->" + a);
    let message = await client.messages.create({
      body: "Your verification code is:" + " " + a,
      from: +12059463843,
      to: +91 + phonenumber,
    });

    if (message) {
      console.log(message, "message");
      let find = await customermodel.findOne({ phonenumber: phonenumber });

      if (find == null) {
        // var customerdetails = new customermodel({
        //     phonenumber: phonenumber,
        //     otp: password
        // });

        await customermodel.create({
          phonenumber: phonenumber,
          otp: password,
          userType: "Normal",
        });

        // utility.sucesshandler(res, constantmessage.messages.otpsend)
      } else if (find) {
        await customermodel.findOneAndUpdate(
          { phonenumber: phonenumber },
          { $set: { otp: password } }
        );
      }
      utility.sucesshandler(res, constantmessage.messages.otpsend);
    }
  } catch (e) {
    console.log(e, "error");
    utility.internalerrorhandler(res);
  }
}

async function otpverification(req, res) {
  try {
    var phonenumber = req.body.phonenumber;
    var password = req.body.password;
    console.log(password, "e");
    let lastloginTime = "";
    lastloginTime = new Date().toLocaleTimeString();

    var code = await customermodel.findOne({
      otp: password,
      phonenumber: phonenumber,
    });
    if (code) {
      let result = await customermodel.findOneAndUpdate(
        { otp: password },
        { phoneverified: true, otp: undefined, lastloginTime: lastloginTime }
      );
      var params = {
        id: result._id,
      };
      jwtToken = jwt.sign(params, constantmessage.jwtsecret.secret, {
        expiresIn: "4320h",
      });
      console.log("res--", result);
      let imagefile = null;
      let companyname = null;
      let email = null;
      let phonenumber = 0;
      let key = 0;
      let logintime = "";
      if (result.lastloginTime != 0) {
        logintime = result.phonenumber;
      }

      if (result.phonenumber != 0) {
        phonenumber = result.phonenumber;
      }
      if (result.key != 0) {
        key = result.key;
      }

      if (result.email != null) {
        email = result.email;
      }

      if (result.companyname != null) {
        companyname = result.companyname;
      }

      if (result.imagefile != null) {
        imagefile = result.imagefile;
      }

      var infoData = {};

      infoData.token = "User_Bearer " + jwtToken;
      infoData.userType = result.userType;
      infoData.userId = result._id;
      infoData.email = result.email ? result.email : "";
      infoData.name = result.name ? result.name : "";
      infoData.phonenumber = result.phonenumber ? result.phonenumber : "";
      infoData.imagefile = imagefile ? result.imagefile : "";
      infoData.companyname = result.companyname ? result.companyname : "";
      infoData.key = result.key ? result.key : "";
      infoData.logintime = result.lastloginTime ? result.lastloginTime : "";

      utility.sucesshandler(res, "Phone Number verified");
    } else if (!code) {
      utility.errorhandler(res, constantmessage.validationMessages.Invalidotp);
    }
  } catch (e) {
    console.log(e);
    utility.internalerrorhandler(res);
  }
}

// var Storage=multer.diskStorage({
//     destination:"./public/uploads/",
//     filename:(req,file,cb)=>{
//       cb(null,file.fieldname+""+Date.now()+path.extname(file.originalname));
//     }
//   })
//   var upload= multer({
//     storage:Storage
//   }).single('file');

//    router.post('/userverify',function(req,res){
//      var password=req.body.password
//      console.log("password--",password)
//      var code = customermodel.findOne({password:password})
//      code.exec((err,result)=>{
//       if(code == null)
//       {
//        console.log("password not matched")
//       }
//       else
//       {
//         if (err) throw err;
//         console.log("res---",result)
//       }
//      })
//    })
//    router.get('/useredit/:id',function(req,res,next){
//     var id=req.params.id;
//     var upd=customermodel.findById(id);
//     upd.exec(function(err,data){
//       if(err) throw err;
//       console.log("data-->",data)
//       res.send(data)
//     })

//   });

//    router.post('/useredit/',upload,function(req,res){
//   var updat = customermodel.findByIdAndUpdate(req.body.id,{
//     name:req.body.name,
//     email:req.body.email,
//     image:req.file.filename
//   }).updat.exec(function(err,data){
//     if(err)throw err;
//     res.send(data)
//   })

//   })

async function riderdetails(req, res) {
  try {
    let body = req.body ? req.body : "";

    let obj = {
      jobid: body.jobid,
    };

    let riderdetails = await driverstatusmodel
      .findOne(obj)
      .populate("riderid", "name phonenumber userType")
      .select({
        rating: 1,
        pickUpLocation: 1,
        dropLocation: 1,
      });
    utility.sucesshandler(res, "", riderdetails);
  } catch (e) {
    console.log(e);
    utility.internalerrorhandler(res);
  }
}
function getcustomer(req, res) {
  async function asy_init() {
    try {
      let customerlist = await queryy.findData(Customer);
      console.log("feed--", customerlist);
      if (customerlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          customerlist
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
function getcustomerByid(req, res) {
  console.log("hit body", req.body._id);
  async function get_customerByid() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      console.log("id--", condition);
      let customerdata = await customermodel.findOne(condition);
      console.log("data--", customerdata);

      let phonenumber = 0;
      if (customerdata.phonenumber != 0) {
        phonenumber = customerdata.phonenumber;
      }

      let data = {
        _id: customerdata._id,
        name: customerdata.name,
        email: customerdata.email,
        imagefile: customerdata.imagefile,
        userType: customerdata.userType,
        phonenumber: phonenumber ? customerdata.phonenumber : 0,
        key: customerdata.key,
      };

      // key:customerdata.key,
      // phonenumber:customerdata.phonenumber
      // }

      if (customerdata != null) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
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
  get_customerByid();
}

function updatecustomerData(req, res) {
  console.log("body data", req.body);

  async function update_customer() {
    try {
      var dataObj = {};

      //   console.log("lien--", req.body.licencenumber)
      dataObj.name = req.body.name;
      // console.log("name--", req.body.name)
      dataObj.email = req.body.email;
      dataObj.phonenumber = req.body.phonenumber;
      //  console.log("rating--", req.body.rating)
      //  console.log("file--",req.file.imagefile)
      if (req.files && req.files[0] && req.files[0].filename) {
        dataObj.imagefile = req.files[0].filename;
      }
      console.log("img*5555", dataObj);

      let condition = {
        _id: req.body._id,
      };
      console.log("condit--", condition);

      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj
      );

      if (customerObj.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataUpdated,
          customerObj
        );
      } else {
        utility.errorhandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }

  update_customer(function () {});
}
function changepassword(req, res) {
  console.log("hit");
  console.log("body data", req.body);

  async function change_password() {
    try {
      let { password, confirmpassword, newpassword, id } = req.body
        ? req.body
        : {};
      console.log({ password, confirmpassword, newpassword, id });
      if (newpassword !== confirmpassword) {
        console.log("in");
        return utility.errorhandler(
          res,
          "new password and confirmpassword didn't match"
        );
      }

      let condition = {
        _id: id,
      };
      customermodel.findOne(condition).exec(function (err, info) {
        console.log({ err, info });
        if (err || info === null) {
          return utility.errorhandler(res, "user not found");
        } else {
          info.comparePassword(password, async function (err, isMatch) {
            console.log({ err, isMatch });
            if (err) {
              return utility.errorhandler(res, "please check old password");
            } else {
              if (isMatch !== true) {
                return utility.errorhandler(res, "please check old password");
              } else {
                info.password = confirmpassword;
                info.save(function (err, user) {
                  if (err) {
                    console.log({ errSave: err });
                    return utility.errorhandler(res, "unable to save user");
                  } else {
                    console.log({ password: "DOne" });
                    return utility.sucesshandler(
                      res,
                      "password changed successfully"
                    );
                  }
                });
              }
            }
          });
        }
      });
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

  change_password(function () {});
}

function deleteaccount(req, res) {
  console.log("hit");
  async function delete_account() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      console.log("id--", condition);
      let customerdata = await Customer.findOneAndUpdate(condition, {
        isDeleted: true,
      });
      console.log("data--", customerdata);
      if (customerdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          customerdata
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
  delete_account();
}
function editDriver(req, res) {
  console.log("hit");
  console.log("body", req.body);
  async function update_account() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };

      let dataObj = {};
      console.log("id--", condition);
      let customerdata = await Customer.findOne(condition);
      console.log("data--", customerdata);

      if (req.files && req.files[0] && req.files[0].filename) {
        console.log("files--");
        dataObj.imagefile = req.files[0].filename;

        // utility.sucesshandler(res,constantmessage.messages.customerDataFetched,customerdata);
      }
      if (req.body.name != null) {
        dataObj.name = req.body.name;
      }
      if (req.body.nikname != null) {
        dataObj.nikname = req.body.nikname;
      }
      console.log("obj--", dataObj);
      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj
      );
      //console.log("data", customerObj);
      if (customerObj.status) {
        console.log("ok");
        utility.sucesshandler(res, "", customerObj);
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
  update_account();
}
function editRider(req, res) {
  console.log("hit");
  console.log("body", req.body);
  async function update_account() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body.rider_id),
      };

      let dataObj = {};
      console.log("id--", condition);
      //let customerdata = await companymodel.findOne(condition);

      if (req.files && req.files[0] && req.files[0].filename) {
        console.log("files--");
        dataObj.imagefile = req.files[0].filename;
      }
      if (req.body.name != null) {
        dataObj.name = req.body.name;
      }
      if (req.body.email != null) {
        dataObj.email = req.body.email;
      }

      if (req.body.phonenumber != null) {
        dataObj.phonenumber = req.body.phonenumber;
      }
      if (req.body.companyname != null) {
        dataObj.companyname = req.body.companyname;
      }
      let companyname = null;
      let name = "abc";
      let email = null;
      let phonenumber = null;
      let imagefile = null;
      let key = 0;
      console.log("obj--", dataObj);
      let customerObj = await queryy.updateOneDocument(
        userModel,
        condition,
        dataObj
      );

      console.log("cus--", customerObj);
      if (customerObj.data.name != null) {
        name = customerObj.data.name;
        console.log("nae", name);
      }
      if (customerObj.data.companyname != null) {
        companyname = customerObj.data.companyname;
      }
      if (customerObj.data.email != null) {
        email = customerObj.data.email;
      }
      if (customerObj.data.phonenumber != null) {
        phonenumber = customerObj.data.phonenumber;
      }
      if (customerObj.data.imagefile != null) {
        imagefile = customerObj.data.imagefile;
      }

      let data = {
        companyname: companyname,
        name: name,
        email: email,
        image: imagefile,
        phonenumber: phonenumber,
        key: customerObj.data.key,
      };
      //console.log("data", customerObj);
      if (customerObj.status) {
        console.log("ok");
        utility.sucesshandler(res, "", data);
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
  update_account();
}

async function adminAddCustomer(req, res) {
  try {
    let body = req.body ? req.body : {};
    console.log(body);
    customermodel.existCheck(body.email, async function (err, exist) {
      if (err) {
        reject(err);
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
                constantmessage.weburl.url +
                "/accountverification/" +
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
                      dob: body.dob,
                      street: body.street,
                      city: body.city,
                      state: body.state,
                      postcode: body.postcode,
                      country: body.country,
                      userType: body.userType,
                      imagefile: req.files[0].filename,
                    };

                    let saveobj = new customermodel(usersave);
                    console.log("saveobj", saveobj);
                    await saveobj.save();

                    utility.sucesshandler(
                      res,
                      "Registered successfully,please verfiy your email to login"
                    );
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

function adminGetCustomerByid(req, res) {
  async function get_customerByid() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      let customerdata = await queryy.findoneData(Customer, condition);
      if (customerdata.status) {
        const { data } = customerdata;
        const { key, keyStatus, ...rest } = data;
        customerdata.data = !keyStatus ? _.omit(data, ["key"]) : data;
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          customerdata
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
  get_customerByid();
}

function adminGetCustomer(req, res) {
  async function asy_init() {
    try {
      console.log("in all");
      let condition = {
        userType: "Normal",
      };

      let customerlist = await customermodel
        .find(condition)
        .sort({ createdAt: -1 })
        .lean();

      if (customerlist) {
        customerlist = customerlist.map((data) =>
          !data.keyStatus ? _.omit(data, ["key"]) : data
        );
        utility.sucesshandler(
          res,
          constantmessage.messages.userDataFetched,
          customerlist
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
function adminUpdateCustomer(req, res) {
  console.log("body data", req.body);

  async function update_customer() {
    try {
      var dataObj = {};
      if (req.body.name) {
        dataObj.name = req.body.name;
      }
      if (req.body.email) {
        dataObj.email = req.body.email;
      }
      if (req.body.phonenumber) {
        dataObj.phonenumber = req.body.phonenumber;
      }
      // if (req.body.lastName) {
      //   dataObj.lastName = req.body.lastName;
      // }
      if (req.body.city) {
        dataObj.city = req.body.city;
      }
      if (req.body.dob) {
        dataObj.dob = req.body.dob;
      }
      if (req.body.state) {
        dataObj.state = req.body.state;
      }
      if (req.body.country) {
        dataObj.country = req.body.country;
      }
      if (req.body.postcode) {
        dataObj.postcode = req.body.postcode;
      }
      if (req.body.street) {
        dataObj.street = req.body.street;
      }
      if (req.body.userType) {
        dataObj.userType = req.body.userType;
      }

      if (req.files && req.files[0] && req.files[0].filename) {
        dataObj.imagefile = req.files[0].filename;
      }
      // console.log("img*5555", dataObj)
      let condition = {
        _id: req.body._id,
      };
      console.log("condit--", condition);

      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj
      );

      if (customerObj.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataUpdated,
          customerObj
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
  update_customer(function () {});
}
async function adminDeleteUser(req, res) {
  console.log(7777777777);
  console.log("body", req.body);
  console.log("id", req.body._id);
  var body = req.body ? req.body : {};
  let condition = {
    _id: mongoose.Types.ObjectId(req.body._id),
  };
  await customermodel
    .findByIdAndRemove(condition, { isDeleted: body.isDeleted })
    .exec((err, resp) => {
      if (err) {
        return res.json({
          status: 404,
          msg: "somthing went wrong !",
          error: err,
        });
      }
      // else if (resp.length === 0) {
      //     return res.json({
      //         status: 200,
      //         msg: "No driver data found !"
      //     });
      // }
      else {
        return res.json({
          status: 200,
          msg: "User data deleted successfully",
          data: resp,
        });
      }
    });
}

// async function adminAddDriver(req, res) {
//   console.log("hit");
//   let driverLicence = '';
//   let trainingDoc = '';
//   let hoistManual = '';
//   let pEndorsement = '';

//   if (req.files && req.files[0]) {

//     driverLicence = req.files[0].filename;
//   }
//   if (req.files && req.files[1]) {
//     trainingDoc = req.files[1].filename;
//   }

//   if (req.files && req.files[2]) {
//     pEndorsement = req.files[2].filename;
//   }
//   if (req.files && req.files[3]) {
//     hoistManual = req.files[3].filename;
//   }

//   try {
//     let body = req.body ? req.body : {};
//     customermodel.existCheck(body.email, async function (err, exist) {
//       if (err) {
//         reject(err);
//       } else if (exist != true) {
//         utility.errorhandler(
//           res,
//           constantmessage.validationMessages.emailAlreadyExist,
//           ""
//         );
//       } else if (exist) {
//         var verifyingLink = utility.getEncryptText(
//           Math.random().toString(4).slice(2) + new Date().getTime()
//         );

//         var userMailData = {
//           email: body.email,
//           name: body.name,
//           verifying_token: verifyingLink,
//         };
//         emailtemplate
//           .findOne({ findBy: "register_verify" })
//           .exec(async (err, emaildataresult) => {
//             if (err) {
//               throw new Error(err);
//             } else if (emaildataresult) {
//               let selectedSubject = emaildataresult.subject;
//               let selectedContent = emaildataresult.content;
//               const template = handlebars.compile(
//                 selectedContent.replace(/\n|\r/g, "")
//               );
//               let url =
//                 constantmessage.weburl.url +
//                 "/accountverification/" +
//                 userMailData.verifying_token;
//               let message = template({ URL: url, USERNAME: userMailData.name });
//               utility.sendmail(
//                 userMailData.email,
//                 selectedSubject,
//                 message,
//                 async (err, finalresult) => {
//                   if (err) {
//                     throw new Error(err);
//                   } else if (finalresult) {

//                     let usersave = {
//                       email: body.email,
//                       password: body.password,
//                       verifyingToken: userMailData.verifying_token,
//                       name: body.name,
//                       // lastName: body.lastName,
//                       phonenumber: body.phonenumber,
//                       dob: body.dob,
//                       street: body.street,
//                       city: body.city,
//                       state: body.state,
//                       postcode: body.postcode,
//                       country: body.country,
//                       userType: body.userType,
//                       carBrand: body.carBrand,
//                       carType: body.carType,
//                       carModel: body.carModel,
//                       carRegNo: body.carRegNo,
//                       carFuelType: body.carFuelType,
//                       licencenumber: body.licencenumber,
//                       licenseValid: body.licenseValid,
//                       carOwner: body.carOwner,
//                       driverLicence: driverLicence,
//                       trainingDoc: trainingDoc,
//                       hoistManual: hoistManual,
//                       pEndorsement: pEndorsement
//                     };

//                     let saveobj = new customermodel(usersave);
//                     await saveobj.save()
//                     utility.sucesshandler(res, 'Registered successfully,please verfiy your email to login')
//                     console.log("usersave", saveobj);

//                   }
//                 }
//               );
//             }
//           });
//       }
//     });
//   } catch (e) {
//     console.log(e, "error");
//     utility.internalerrorhandler(res);
//   }

// }

async function adminAddDriver(req, res) {
  console.log("req file", req.files.length);
  console.log("file------------------------", req.files);

  console.log("hit");
  let driverLicence = "";
  let trainingDoc = "";
  let hoistManual = "";
  let pEndorsement = "";
  let imagefile = "";
  let driverManual = "";
  let healthSafetyPolicy = "";
  for (let i = 0; i < req.files.length; i++) {
    if (req.files && req.files[i]) {
      if (req.files[i].fieldname === "driverLicence") {
        driverLicence = req.files[i].filename;
      } else if (req.files[i].fieldname === "trainingDoc") {
        trainingDoc = req.files[i].filename;
      } else if (req.files[i].fieldname === "pEndorsement") {
        pEndorsement = req.files[i].filename;
      } else if (req.files[i].fieldname === "hoistManual") {
        hoistManual = req.files[i].filename;
      } else if (req.files[i].fieldname === "imagefile") {
        imagefile = req.files[i].filename;
      } else if (req.files[i].fieldname === "driverManual") {
        driverManual = req.files[i].filename;
      } else if (req.files[i].fieldname === "healthSafetyPolicy") {
        healthSafetyPolicy = req.files[i].filename;
      }
    }
  }

  try {
    let body = req.body ? req.body : {};
    customermodel.existCheck(body.email, async function (err, exist) {
      if (err) {
        reject(err);
        // res,
        //   constantmessage.validationMessages.InvalidEmail,
        //   ""
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
                constantmessage.weburl.url +
                "/accountverification/" +
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
                    let docs = {
                      driverLicence: driverLicence,
                      trainingDoc: trainingDoc,
                      pEndorsement: pEndorsement,
                      hoistManual: hoistManual,
                      driverManual: driverManual,
                      healthSafetyPolicy: healthSafetyPolicy,
                    };

                    let usersave = {
                      email: body.email,
                      password: body.password,
                      verifyingToken: userMailData.verifying_token,
                      name: body.name,
                      // lastName: body.lastName,
                      phonenumber: body.phonenumber,
                      dob: body.dob,
                      street: body.street,
                      city: body.city,
                      state: body.state,
                      postcode: body.postcode,
                      country: body.country,
                      userType: body.userType,
                      carBrand: body.carBrand,
                      carType: body.carType,
                      carModel: body.carModel,
                      carRegNo: body.carRegNo,
                      carFuelType: body.carFuelType,
                      licencenumber: body.licencenumber,
                      licenseValid: body.licenseValid,
                      carOwner: body.carOwner,
                      imagefile: imagefile,
                      documents: docs,
                    };

                    let saveobj = new customermodel(usersave);
                    await saveobj.save();
                    utility.sucesshandler(
                      res,
                      "Registered successfully,please verfiy your email to login"
                    );
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
function adminGetDriver(req, res) {
  async function asy_init() {
    try {
      // console.log("in all");
      let condition = {
        userType: "Driver",
      };
      let customerlist = await customermodel
        .find(condition)
        .sort({ createdAt: -1 });
      // console.log("feed--", customerlist);
      if (customerlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.userDataFetched,
          customerlist
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      utility.errorhandler(res, constantmessage.messages.SOMETHING_WENT_WRONG);
    }
  }
  asy_init();
}

async function adminDeleteDriver(req, res) {
  console.log(7777777777);
  console.log("body", req.body);
  console.log("id", req.body._id);
  var body = req.body ? req.body : {};
  let condition = {
    _id: mongoose.Types.ObjectId(req.body._id),
  };
  await customermodel
    .findByIdAndRemove(condition, { isDeleted: body.isDeleted })
    .exec((err, resp) => {
      if (err) {
        return res.json({
          status: 404,
          msg: "somthing went wrong !",
          error: err,
        });
      } else {
        return res.json({
          status: 200,
          msg: "Driver data deleted successfully",
          data: resp,
        });
      }
    });
}

function adminGetDriverByid(req, res) {
  console.log("hit body", req.body._id);
  async function get_driverByid() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      console.log("id--", condition);
      let customerdata = await queryy.findoneData(Customer, condition);
      console.log("data--", customerdata);
      if (customerdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          customerdata
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
  get_driverByid();
}

function adminGetDriverByIdWithReview(req, res) {
  console.log("hit body", req.body._id);
  async function get_driverByid() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      console.log("id--", condition);

      let customerdata = await queryy.findoneData(Customer, condition);
      let reviewdata = await review.find({ ratedto: condition });
      var obj = {
        data: customerdata,
        reviewdata: reviewdata,
      };
      console.log("data--", obj);
      console.log("customerdata--", customerdata);

      if (customerdata.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          obj
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
  get_driverByid();
}

function adminUpdateDriver(req, res) {
  console.log("body", req.body);
  console.log("file------------------------", req.files);

  let driverLicence = req.body.driverLicence;
  let trainingDoc = req.body.trainingDoc;
  let pEndorsement = req.body.pEndorsement;
  let hoistManual = req.body.hoistManual;
  let imagefile = req.body.imagefile;
  let driverManual = req.body.driverManual;
  let healthSafetyPolicy = req.body.healthSafetyPolicy;

  for (let i = 0; i < req.files.length; i++) {
    if (req.files && req.files[i]) {
      if (req.files[i].fieldname === "driverLicence") {
        driverLicence = req.files[i].filename;
      } else if (req.files[i].fieldname === "trainingDoc") {
        trainingDoc = req.files[i].filename;
      } else if (req.files[i].fieldname === "pEndorsement") {
        pEndorsement = req.files[i].filename;
      } else if (req.files[i].fieldname === "hoistManual") {
        hoistManual = req.files[i].filename;
      } else if (req.files[i].fieldname === "imagefile") {
        imagefile = req.files[i].filename;
        console.log("imagefile", imagefile);
      } else if (req.files[i].fieldname === "driverManual") {
        driverManual = req.files[i].filename;
      } else if (req.files[i].fieldname === "healthSafetyPolicy") {
        healthSafetyPolicy = req.files[i].filename;
      }
    }
  }
  async function update_customer() {
    try {
      let docs = {
        driverLicence: driverLicence,
        trainingDoc: trainingDoc,
        pEndorsement: pEndorsement,
        hoistManual: hoistManual,
        driverManual: driverManual,
        healthSafetyPolicy: healthSafetyPolicy,
      };
      var dataObj = {
        documents: docs,
        name: req.body.name,
        email: req.body.email,
        phonenumber: req.body.phonenumber,
        dob: req.body.dob,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        postcode: req.body.postcode,
        country: req.body.country,
        userType: req.body.userType,
        carBrand: req.body.carBrand,
        carType: req.body.carType,
        carModel: req.body.carModel,
        carRegNo: req.body.carRegNo,
        carFuelType: req.body.carFuelType,
        licencenumber: req.body.licencenumber,
        licenseValid: req.body.licenseValid,
        carOwner: req.body.carOwner,
        imagefile: imagefile,
      };
      console.log("img*5555", dataObj);
      let condition = {
        _id: req.body._id,
      };

      console.log("condit--", condition);

      let customerObj = await queryy.updateOneDocument(
        Customer,
        condition,
        dataObj
      );

      if (customerObj.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.driverDataUpdated,
          customerObj
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
  update_customer(function () {});
}

function adminGetDistance(req, res) {
  async function get_distance() {
    try {
      console.log("tttttt????", req.body);
      const { origin, destination } = req.body;
      // driverlatitude = req.body.driverlatitude;
      // driverlongitude = req.body.driverlongitude;
      // latitude = req.body.latitude;
      // longitude = req.body.longitude;
      //  const { origin, destination } = req.body;
      let link = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=driving&key=AIzaSyAPtxJJdDVQUUW_PKvnIHaPuH6YOgGnjGA`;
      //console.log({ origin, destination, link });

      axios
        .get(link)
        .then(function (response) {
          console.log("dataaa--", response.data);
          utility.sucesshandler(res, "", response.data);
        })
        .catch(function (error) {
          // handle error
          utility.errorhandler(res, error);

          console.log(error);
        });
    } catch (e) {
      // utility.errorhandler(res, error)

      console.log("e", e);
      // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_distance(function () {});
}
function searchUser(req, res) {
  const _searchUser = async () => {
    const { query } = req;
    let fetachvalue = { name: 1, email: 1, phonenumber: 1 };
    let sort = {};
    let re = "";
    if (query.name) {
      re = { name: { $regex: new RegExp(query.name) } };
      sort.name = -1;
    } else if (query.key) {
      re = { key: Number(query.key) };
      sort.key = 1;
    }
    const condition = { ...re, userType: "Normal" };
    console.log("oks", condition);
    try {
      let customerlist = await queryy.findData(
        customermodel,
        condition,
        fetachvalue,
        sort,
        null
      );
      if (customerlist.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          customerlist
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      return Response(res, 500, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  };

  _searchUser();
}

function getUserWithjobs(req, res) {
  const { params, query: UrlQuery } = req;
  const { _id } = params;
  let { startDate, endDate } = UrlQuery;

  async function get_customerByid() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(_id),
      };
      let customerdata = await queryy.findoneData(customermodel, condition);

      let match = {};

      if (startDate && endDate) {
        match.createdAt = {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        };
      }
      console.log("match", match, startDate, endDate);
      let jobsDeatils = await transactionModal.aggregate([
        {
          $match: { user: condition._id, ...match },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "driverstatuses",
            localField: "jobid",
            foreignField: "_id",
            as: "jobid",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "jobid.driverdetails",
            foreignField: "_id",
            as: "driverdetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "jobid.riderdetails",
            foreignField: "_id",
            as: "riderdetails",
          },
        },
        { $unwind: "$user" },
        { $unwind: "$jobid" },
        { $unwind: "$driverdetails" },
        { $unwind: "$riderdetails" },
        {
          $group: {
            _id: {
              tripStatus: "$jobid.tripstatus",
            },
            jobs: { $push: "$$ROOT" },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      let final = {
        userDetails: {},
        upComingJob: [],
        onGoingJobs: [],
        completedJob: [],
        canceledJob: [],
      };

      if (customerdata.status) {
        final.userDetails = customerdata.data;
        if (jobsDeatils.length > 0) {
          jobsDeatils.forEach((ele) => {
            if (ele._id.tripStatus === "Completed") {
              final.completedJob = [...final.completedJob, ...ele.jobs];
            } else if (ele._id.tripStatus === "Complete") {
              final.completedJob = [...final.completedJob, ...ele.jobs];
            } else if (ele._id.tripStatus === "Ongoing") {
              final.onGoingJobs = ele.jobs;
            } else if (ele._id.tripStatus === "Upcoming") {
              final.upComingJob = ele.jobs;
            } else if (ele._id.tripStatus === "Canceled") {
              final.canceledJob = [...final.canceledJob, ...ele.jobs];
            } else {
              final.canceledJob = [...final.canceledJob, ...ele.jobs];
            }
          });
        }

        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataFetched,
          final
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      return Response(res, 500, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }
  get_customerByid();
}

async function adminBlockDriver(req, res) {
  console.log("hit body", req.body._id);
  async function get_driverByid() {
    try {
      let condition = {
        _id: mongoose.Types.ObjectId(req.body._id),
      };
      let customerdata = await queryy.findoneData(Customer, condition);
      if (customerdata.status) {
        if (customerdata.data.isBlock == true) {
          let obj = {
            isBlock: false,
          };
          let customerObj = await queryy.updateOneDocument(
            Customer,
            condition,
            obj
          );
          if (customerObj.status) {
            utility.sucesshandler(
              res,
              constantmessage.messages.customerDataFetched,
              customerObj
            );
          } else {
            utility.sucesshandler(
              res,
              constantmessage.validationMessages.Invaliddata
            );
          }
        } else {
          let obj = {
            isBlock: true,
          };
          let customerObj = await queryy.updateOneDocument(
            Customer,
            condition,
            obj
          );
          if (customerObj.status) {
            utility.sucesshandler(
              res,
              constantmessage.messages.customerDataFetched,
              customerObj
            );
          } else {
            utility.sucesshandler(
              res,
              constantmessage.validationMessages.Invaliddata
            );
          }
        }
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
  get_driverByid();
}

function getSubadminList(req, res) {
  async function _getSubadminList() {
    try {
      let condition = {
        userType: "SubAdmin",
        isDeleted: false,
      };
      let customerlist = await customermodel
        .find(condition)
        .sort({ createdAt: -1 });

      if (customerlist) {
        utility.sucesshandler(
          res,
          constantmessage.messages.userDataFetched,
          customerlist
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
  _getSubadminList();
}

function updatePermission(req, res) {
  async function _updatePermission() {
    try {
      const { params } = req;
      const { _id } = params;
      var dataObj = {};

      dataObj.permissions = req.body.permissions;

      let condition = {
        _id: _id,
      };

      let customerObj = await queryy.updateOneDocument(
        customermodel,
        condition,
        dataObj
      );

      if (customerObj.status) {
        utility.sucesshandler(
          res,
          constantmessage.messages.customerDataUpdated,
          customerObj
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      utility.errorhandler(
        res,
        e.message || constantmessage.validationMessages.Invaliddata
      );
    }
  }

  _updatePermission();
}

function updateKeyStatus(req, res) {
  async function _updateKeyStatus() {
    try {
      console.log("req.body", req.body);
      const { params } = req;
      //const { _id } = params
      var dataObj = {};

      dataObj.keyStatus = req.body.keyStatus;

      let condition = {
        _id: req.body.userId,
      };

      let customerObj = await queryy.updateOneDocument(
        customermodel,
        condition,
        dataObj
      );

      if (customerObj.status) {
        userModel
          .findOne({
            _id: req.body.userId,
          })
          .lean()
          .exec((err, result) => {
            console.log("ASSS--", result.key);
            if (result.isAvailable == true) {
              //console.log(item._id, "item iddi");
              var arr = result.deviceInfo;

              let deviceToken = arr[arr.length - 1].deviceToken;
              let deviceType = arr[arr.length - 1].deviceType;
              console.log("devictype--", deviceType);
              console.log("devictoken--", deviceToken);
              if (deviceType == "Android") {
                console.log("in android");
                if (req.body.keyStatus) {
                  var message = {
                    to: deviceToken,
                    data: {
                      message: "Key successfully enabled",
                      title: "KeyEnabled",
                      // "body":`${data.sender} send you a message`,
                      key: result.key,
                      user_id: result._id,
                      user_name: result.name,
                      action: "KeyEnabled",
                    },
                  };
                } else {
                  var message = {
                    to: deviceToken,
                    data: {
                      message: "Key disabled",
                      title: "KeyDisabled",
                      // "body":`${data.sender} send you a message`,
                      key: "",
                      user_id: result._id,
                      user_name: result.name,
                      action: "KeyDisabled",
                    },
                  };
                }
                console.log("mess--", message);
                fcm.send(message, function (err, pushresponse) {
                  if (err) {
                    console.log("notifications not send", err);
                  } else {
                    console.log("notifications sent to devices", pushresponse);
                  }
                });
              } else if (deviceType == "IOS") {
                // console.log(deviceToken, "deviceToken+deviceToken");
                console.log(deviceToken, "deviceToken+deviceToken");
                if (req.body.keyStatus) {
                  var message = {
                    to: deviceToken,
                    notification: {
                      badge: "1",
                      // "name": result2.name,
                      body: "Key Enabled",
                      sound: "default",
                      data: {
                        message: "Key successfully enabled",
                        title: "KeyEnabled",
                        // "body":`${data.sender} send you a message`,
                        key: result.key,
                        user_id: result._id,
                        user_name: result.name,
                        action: "KeyEnabled",
                      },
                    },
                  };
                } else {
                  var message = {
                    to: deviceToken,
                    notification: {
                      badge: "1",
                      // "name": result2.name,
                      body: "Key Enabled",
                      sound: "default",
                      data: {
                        message: "Key disabled",
                        title: "KeyDisabled",

                        key: "",
                        user_id: result._id,
                        user_name: result.name,
                        action: "KeyDisabled",
                      },
                    },
                  };
                }
                console.log("ios--", message);
                fcm.send(message, function (err, pushresponse) {
                  if (err) {
                    console.log("notifications not send", err);
                  } else {
                    console.log("notifications sent to devices", pushresponse);
                  }
                });
              } else {
                console.log("Device not found");
              }
            } else {
              callback();
            }
          });

        utility.sucesshandler(
          res,
          req.body.keyStatus
            ? "Key successfully enabled!"
            : "Key successfully disabled!"
        );
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      utility.errorhandler(
        res,
        e.message || constantmessage.validationMessages.Invaliddata
      );
    }
  }

  _updateKeyStatus();
}

function deleteSubAdmin(req, res) {
  async function _deleteSubAdmin() {
    try {
      const { params } = req;
      const { _id } = params;
      var dataObj = { isDeleted: true };

      let condition = {
        _id: _id,
      };

      let customerObj = await queryy.updateOneDocument(
        customermodel,
        condition,
        dataObj
      );

      if (customerObj.status) {
        utility.sucesshandler(res, "Account successfully Deleted");
      } else {
        utility.sucesshandler(
          res,
          constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      utility.errorhandler(
        res,
        e.message || constantmessage.validationMessages.Invaliddata
      );
    }
  }

  _deleteSubAdmin();
}
