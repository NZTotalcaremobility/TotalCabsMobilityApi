const utility = require('../config/utility')
var constantmessage = require('../config/constants')
var randomstring = require('randomstring')
var emailtemplate = require('../model/emailtemplate')
var handlebars = require('handlebars')
const _ = require('lodash')
var mongoose = require('mongoose')
const async = require('async')
var jwt = require('jsonwebtoken')
const companymodel = require('../model/user')
const client = require("twilio")(constantmessage.twilio.accountSid, constantmessage.twilio.authToken);

module.exports = {
    signupcompany:signupcompany,
    CompanyUserList:CompanyUserList,
    adminAddCompanyUser:adminAddCompanyUser,
    UpdatecompanyCustomer:UpdatecompanyCustomer,
}
async function signupcompany(req, res) {
    try {
     let body = req.body ? req.body : {}



        companymodel.existCheck(body.email, async function (err, exist) {

            if (err) {

                reject(err)
            }
            else if (exist != true) {

                utility.errorhandler(res, constantmessage.validationMessages.emailAlreadyExist, '')

            }
            else if (exist) {

                var verifyingLink = utility.getEncryptText(Math.random().toString(4).slice(2) + new Date().getTime());

                var userMailData = { email: body.email, name: body.name, verifying_token: verifyingLink };
                emailtemplate.findOne({ findBy: "register_verify" })
                    .exec(async (err, emaildataresult) => {

                        if (err) {

                            throw new Error(err)
                        }


                        else if (emaildataresult) {
                            let selectedSubject = emaildataresult.subject;
                            let selectedContent = emaildataresult.content;
                            const template = handlebars.compile(
                                selectedContent.replace(/\n|\r/g, "")
                            );
                            let url = constantmessage.weburl.url + "/accountverification/" + userMailData.verifying_token;
                            let message = template({ URL: url, USERNAME: userMailData.name });
                            utility.sendmail(userMailData.email, selectedSubject, message, async (err, finalresult) => {
                                if (err) {

                                    throw new Error(err)
                                }
                                else if (finalresult) {

                                    let usersave = {
                                        email: body.email,
                                        name: body.name,
                                        lastnane:body.lastname,
                                        companyname:body.companyname,
                                        password: body.confirmpassword,
                                        verifyingToken: userMailData.verifying_token,
                                        userType: 'Normal'
                                    }

                                    let saveobj = new companymodel(usersave)

                                    await saveobj.save()

                                    utility.sucesshandler(res, 'Registered successfully,please verfiy your email to login')


                                }

                            })
                        }



                    })
            }

        })
    }


    catch (e) {
        console.log(e, 'error')
        utility.internalerrorhandler(res)

    }


}
function CompanyUserList(req, res) {
    async function asy_init() {
      try {
        // console.log("in all");
        let condition = {
          userType: "Normal",
        };
        let customerlist = await companymodel
          .find({"companyname":{$ne:null}})
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
  async function adminAddCompanyUser(req, res) {
    try {
      let body = req.body ? req.body : {};
  
      console.log(body,"customer addSS");
      companymodel.existCheck(body.email, async function (err, exist) {
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
                        companyname:body.companyname,
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
  
                      let saveobj = new companymodel(usersave);
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
  function UpdatecompanyCustomer(req, res) {
    console.log("body data", req.body);
  
    async function update_customer() {
      try {
        var dataObj = {};
        if (req.body.name) {
          dataObj.name = req.body.name;
        }
        if (req.body.companyname) {
          dataObj.name = req.body.companyname;
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
          companymodel,
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
  
  