var _ = require('lodash')
var express = require('express');
var jwt = require('jsonwebtoken')
var async = require('async')
const Joi = require('joi')
var mongoose = require('mongoose')
var constantmessage = require('../config/constants')
const drivermodel = require('../model/user')
const utility = require('../config/utility')
const moment = require('moment')
query = require('../config/common_query');
const formidable = require('formidable')
const jobhistorymodel = require('../model/jobhistory')
const Bookingmodel = require('../model/driverstatus')
const ridermodel = require("../model/rider")
Rider = mongoose.model('rider');
var deeplink = require('node-deeplink');
const fs = require('fs');
//const express = require('express');
const validator = require('express-joi-validation').createValidator({})

module.exports = {
    riderdeatail: riderdeatail,
    deeplink: deeplink,
    currentjobDetail: currentjobDetail
}
function riderdeatail(req, res) {
    async function rider_detail() {
        console.log("in rider")
        if (req.body && (!req.body.rating)) {
            res.jsonp(
                Error(
                    constant.statusCode.error,
                    // constant.rider_message.rating,
                )
            );
        } else if (req.body && (!req.body.phonenumber)) {
            res.jsonp(
                Error(
                    constant.statusCode.error,
                    //constant.rider_message.phonenumber,
                )
            );
        }
        else if (req.body && (!req.body.pickuplocation)) {
            res.jsonp(
                Error(
                    constant.statusCode.error,
                    //constant.rider_message.pickuplocation,
                )
            );
        }
        else if (req.body && (!req.body.droplocation)) {
            res.jsonp(
                Error(
                    constant.statusCode.error,
                    // constant.rider_message.droplocation,
                )
            );
        }
        else {
            var data = {};
            data.rating = req.body.rating;
            data.phonenumber = req.body.phonenumber;
            data.pickuplocation = req.body.pickuplocation;
            data.droplocation = req.body.droplocation;
            console.log("add--", data)
            let saveObj = await query.uniqueInsertIntoCollection(Rider, data);
            if (saveObj.status == true) {
                res.json({
                    code: 200,
                    data: saveObj.userData,

                })
            } else {
                res.json({
                    code: 500,
                    // message: constant.messages.requestNotProcessed
                })
            }
        }
    }

    rider_detail(function (data) { });
}
function deeplink(req, res) {

    deeplink({
        fallback: 'https://ss.stagingsdei.com:3531/',
        android_package_name: 'com.citylifeapps.cups',
        ios_store_link:
            'https://itunes.apple.com/us/app/cups-unlimited-coffee/id556462755?mt=8&uo=4'
    })
    console.log();
}

function currentjobDetail(req, res) {
    async function job_detail() {
        let message ;
        let data;
        try{
            console.log("body--",req.body);
            const body =Joi.object({_id:Joi.string().alphanum()})
      // let body = req.body
        let currentBooking = await Bookingmodel.findOne({jobid : req.body._id}).populate('user driverdetails')
      //console.log("booking--",currentBooking.tripstatus);
      if (currentBooking !=null) {
      if(currentBooking.tripstatus == "Upcoming"){
          data = currentBooking
          message = "Trip has not been  started"
      }
      else if(currentBooking.tripstatus == "Completed"){
            data  = currentBooking
         message = "Trip has been  Completed"
      }
      else {
          data =currentBooking
      }
        
            utility.sucesshandler(
              res,
              message,
              data
            
            );
          } else {
            utility.errorhandler(
              res, "No job Found"
            
            );
          }
        } catch (e) {
            console.log("e", e);
            // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
        }
    }

    job_detail(function (data) { });
}
