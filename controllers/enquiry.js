
const utility = require("../config/utility");
const Enquiry = require("../model/enquiry");
const Contact = require('../model/contact');
var constantmessage = require("../config/constants");
var emailtemplate = require("../model/emailtemplate");
var handlebars = require("handlebars");
var mongoose = require("mongoose");
const { AwsContext } = require("twilio/lib/rest/accounts/v1/credential/aws");
// const enquirymodel = mongoose.model("enquiry");
module.exports = {
  rentailEnquiry: rentailEnquiry,
  contactEnquiry
};

async function rentailEnquiry(req, res) {
  try {
    let body = req.body ? req.body : {};

    var userMailData = {
      email: body.email,
      name: body.firstName + ' ' + body.lastName,
    };
    emailtemplate
      .findOne({ findBy: "enquiry_form" })
      .exec(async (err, emaildataresult) => {
        if (err) {
          throw new Error(err);
        } else if (emaildataresult) {
          let selectedSubject = emaildataresult.subject;
          let selectedContent = emaildataresult.content;
          const template = handlebars.compile(
            selectedContent.replace(/\n|\r/g, "")
          );

          let message = template({ USERNAME: body.firstName });
          utility.sendmail(
            userMailData.email,
            selectedSubject,
            message,
            async (err, finalresult) => {
              if (err) {
                throw new Error(err);
              } else if (finalresult) {

                const response = await new Enquiry(body).save();
                if (response) {
                  res.status(200).send({
                    msg: "Enquiry Form submitted",
                  });
                }
              }
            }
          );
        }
      });
  } catch (e) {
    console.log(e.message || 'Internal Server Error');
    utility.internalerrorhandler(res);
  }
}

async function contactEnquiry(req, res) {
  try {
    let body = req.body ? req.body : {};
    var userMailData = {
      email: body.email,
      name: body.fullName,
    };
    emailtemplate
      .findOne({ findBy: "enquiry_form" })
      .exec(async (err, emaildataresult) => {
        if (err) {
          throw new Error(err);
        } else if (emaildataresult) {
          let selectedSubject = emaildataresult.subject;
          let selectedContent = emaildataresult.content;
          const template = handlebars.compile(
            selectedContent.replace(/\n|\r/g, "")
          );

          let message = template({ USERNAME: userMailData.name });
          utility.sendmail(
            userMailData.email,
            selectedSubject,
            message,
            async (err, finalresult) => {
              if (err) {
                throw new Error(err);
              } else if (finalresult) {

                const response = await new Contact(body).save();
                if (response) {
                  res.status(200).send({
                    msg: "Contacat Form submitted",
                  });
                }
              }
            }
          );
        }
      });
  } catch (e) {
    console.log(e.message || 'Internal Server Error');
    utility.internalerrorhandler(res);
  }
}

