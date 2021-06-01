const utility = require('../config/utility')
const customermodel = require('../model/user')
const reviewmodel = require("../model/review")
var dateFormat = require("dateformat")
var constantmessage = require('../config/constants')
const query = require('../config/common_query')
var emailtemplate = require('../model/emailtemplate')
var driverdetails = require('../model/driverdetail')
var areacodemodel = require('../model/Areacode')
var handlebars = require('handlebars')
const _ = require('lodash')
const axios = require('axios');
var mongoose = require('mongoose')
const bodyParser = require('body-parser');
const async = require('async')
var jwt = require('jsonwebtoken')

const drivergmodel = require('../model/driverstatus')
const usermodel = require('../model/user')
const areamodel = require('../model/Areacode')
const bookingmodel = require('../model/booking')
const tranctiongmodel = require('../model/tansaction')
const { populate, findOne } = require('../model/user')
const { any } = require('underscore')
const { path, set } = require('../app')

const client = require("twilio")(constantmessage.twilio.accountSid, constantmessage.twilio.authToken);
Customer = mongoose.model('user')

module.exports = {
    addBooking: addBooking,
    getBookingByid: getBookingByid,
    getBookingEdit: getBookingEdit,
    getBooking: getBooking,
    getUpComingBooking: getUpComingBooking,
    getAllDriverdata: getAllDriverdata,
    getDriver: getDriver,
    getOngoingBooking: getOngoingBooking,
    getVehicleType: getVehicleType,
    driverdetails: driverdetails,
    getBookingrecent: getBookingrecent,
    getCompleteBooking: getCompleteBooking,
    getByCode: getByCode,
    getRecept,
    testApi,
    trackDriverById,
    deleteBooking,
    editBooking
}

async function trackDriverById(req, res) {
    try {
        let response = await usermodel.findById({ _id: req.body._id }, { currentLocation: 1 });
        console.log({ response });
        if (response) {
            res.status(200).send(response.currentLocation.coordinates);
        } else {
            res.status(200).send({ msg: 'Error Fetching Drivers Info' });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
    }
}

async function driverdetails(req, res) {

    try {

        let body = req.body ? req.body : {}
        console.log(body, 'driverdetails+driverdetails')
        let driverdetails = await drivermodel.findById(body._id).select({ licencenumber: 1, name: 1 })
        utility.sucesshandler(res, "", driverdetails)
    }
    catch (e) {
        utility.internalerrorhandler(e)
    }
}

function addBooking(req, res) {

    console.log("body data+++++++++++++++++++++++++++++++++++", req.body);


    async function add_Booking() {
        try {

            const { key, loc, id } = req.body;
            console.log("body dta--", req.body);
            // console.log({user});
            let dataObj = {};
            let tObj = {};
            dataObj.user = req.body.user;

            dataObj.distance = req.body.distance;
            dataObj.duration = req.body.duration;
            tObj.fare = req.body.fare;
            tObj.tax = req.body.tax;
            tObj.Amount = req.body.totalFare;
            tObj.type = req.body.paymentType;
            dataObj.carType = req.body.taxiType;
            dataObj.bookingDate = req.body.bookingDate;
            dataObj.pickUptime = req.body.bookingTime;
            dataObj.dateOfJourney = req.body.dateOfJourney;
            var add = req.body.pickupLocation.address
            var pickupArea = add.split(',')
            pickupAreaname = pickupArea[1]
            console.log({ pickupAreaname });
            dataObj.pickupAreaname = pickupAreaname;
            var add2 = req.body.dropLocation.address
            var dropArea = add2.split(',')
            dropAreaname = dropArea[1];
            console.log({ dropAreaname });
            dataObj.dropAreaname = dropAreaname

            dataObj.pickupLocation = {
                type: 'Point',
                coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
                address: req.body.pickupLocation.address,
            };

            dataObj.dropLocation = {
                type: 'Point',
                coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
                address: req.body.dropLocation.address,
            }
            dataObj.riderdetails = req.body.user;
            dataObj.jobid = req.body.user;

            let customerObj = await query.uniqueInsertIntoCollection(drivergmodel, dataObj);


            tObj.jobid = customerObj.userData._id;
            tObj.user = req.body.user;
            console.log("customerr---", customerObj);
            let transectionObj = await query.uniqueInsertIntoCollection(tranctiongmodel, tObj);
            if (customerObj) {
                console.log("ok");
                utility.sucesshandler(res, constantmessage.messages.BookingConfirmed, customerObj);

            } else {
                utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
            }



        }
        catch (e) {
            console.log("e", e)
            //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);

        }
    }


    add_Booking(function () { });
}

function editBooking(req, res) {

    async function _editBooking() {
        try {
            let dataObj = {};
            let tObj = {};

            dataObj.user = req.body.user;

            if (req.body.dateOfJourney) {

                dataObj.distance = req.body.distance;
                dataObj.duration = req.body.duration;
                dataObj.carType = req.body.taxiType;

                dataObj.dateOfJourney = req.body.dateOfJourney;
                dataObj.pickUptime = req.body.timeOfJourney;

                dataObj.fare = req.body.price;
                dataObj.tax = req.body.tax;
                dataObj.Amount = req.body.totalFare;

                dataObj.pickupLocation = {
                    type: 'Point',
                    coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
                    address: req.body.pickupLocation.address,
                };

                dataObj.dropLocation = {
                    type: 'Point',
                    coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
                    address: req.body.dropLocation.address,
                }

                dataObj.riderdetails = req.body.user
                dataObj.jobid = req.body.jobid._id;

                tObj.tax = req.body.tax;
                tObj.Amount = req.body.totalFare;
                tObj.type = req.body.paymentType;
            } else {
                dataObj.distance = req.body.distance;
                dataObj.duration = req.body.duration;
                dataObj.carType = req.body.taxiType;

                dataObj.bookingDate = req.body.bookingDate;
                dataObj.bookingTime = req.body.bookingTime;

                dataObj.fare = req.body.price;
                dataObj.tax = req.body.tax;
                dataObj.Amount = req.body.totalFare;

                dataObj.pickupLocation = {
                    type: 'Point',
                    coordinates: [req.body.pickupLocation.longitude, req.body.pickupLocation.latitude],
                    address: req.body.pickupLocation.address,
                };

                dataObj.dropLocation = {
                    type: 'Point',
                    coordinates: [req.body.dropLocation.longitude, req.body.dropLocation.latitude],
                    address: req.body.dropLocation.address,
                }

                dataObj.riderdetails = req.body.user
                dataObj.jobid = req.body.jobid._id;

                tObj.tax = req.body.tax;
                tObj.Amount = req.body.totalFare;
                tObj.type = req.body.paymentType;

            }

            let customerObj = await query.updateOneDocument(drivergmodel, { _id: mongoose.Types.ObjectId(dataObj.jobid) }, dataObj);
            if (customerObj.status) {
                let transectionObj = await query.updateOneDocument(tranctiongmodel, { _id: mongoose.Types.ObjectId(req.body._id) }, tObj);
                if (transectionObj) {
                    utility.sucesshandler(res, constantmessage.messages.BookingUpdate, customerObj);
                } else throw { messgae: 'Unable to Update In DB' }
            } else throw { messgae: 'Unable to Update In DB' }
        }
        catch (e) {
            console.log("e", e)
            utility.errorhandler(res, constant.messages.SOMETHING_WENT_WRONG);
        }
    }
    _editBooking(function () { });
}


function getBookingByid(req, res) {
    console.log("hit body", req.body);
    async function get_BookingByid() {
        try {
            let condition = {
                user: req.body._id,
            }
            console.log("id--", condition);
            // let customerdata = await query.findoneData(tranctiongmodel,condition,null,{
            //     path: 'jobid user',
            //     populate: {
            //     path: 'riderdetails driverdetails',
            //     model: 'user'
            //     }
            //     } );
            let customerdata = await tranctiongmodel.find(condition).populate('jobid')
            console.log("data--", customerdata);


            if (customerdata.length > 0) {
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, customerdata);
            }

            else {
                utility.errorhandler(res, "No Boooking Found");
            }
        }
        catch (e) {
            console.log("e", e)
            // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
        }
    }
    get_BookingByid();

}
function getBookingrecent(req, res) {
    console.log("hit body", req.body);
    async function get_Bookingrecent() {
        try {
            let condition = {
                user: req.body.jobid,

            }
            console.log("id--", condition);
            let customerdata = await tranctiongmodel.findOne(condition).populate('jobid').sort({ _id: -1 });
            // console.log("data--", customerdata);
            if (customerdata) {
                console.log("ok");
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, customerdata);
            }
            else {
                utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
            }
        }
        catch (e) {
            console.log("e", e)
            // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
        }
    }
    get_Bookingrecent();

}


function getBooking(req, res) {
    console.log("in Booking");
    async function asy_init() {
        try {
            let bookinglist = await query.findData(tranctiongmodel, null, null, null, 'jobid user');
            console.log("feed--", bookinglist);
            if (bookinglist) {
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, bookinglist);

            } else {
                utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);

            }

        } catch (e) {
            console.log("e", e)
            utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}

async function testApi(req, res) {
    try {
        const response = await drivergmodel.find(
            {
                $and: [
                    { tripstatus: { $eq: 'Completed' } },
                    { jobtype: { $ne: 'Hailjob' } }]
            });
        console.log(response);
        res.send(response);
    } catch (error) {
        console.log('error', error);
    }
}

function getCompleteBooking(req, res) {
    async function asy_init() {
        try {

            let bookinglist = await tranctiongmodel.find(
                { user: req.body._id },
            ).populate({
                path: 'jobid',
                populate: {
                    path: 'driverdetails',
                    model: 'user'
                },
                match: {
                    $and: [
                        { tripstatus: { $eq: 'Completed' } },
                        { jobtype: { $ne: 'Hailjob' } }]
                }
            }).sort({ updatedAt: -1 }).lean();
            let newList = [];

            bookinglist.forEach((bk) => {
                if (bk.jobid !== null) {
                    const { jobid, ...rest1 } = bk
                    const { driverdetails, ...rest } = jobid
                    newList.push({ driverdetails, ...rest1, jobid: rest });
                }
            });

            console.log({ newList });
            let revierating = await reviewmodel.find({ ratedby: req.body._id });
            let data = {
                bookingdata: newList,
                revierating: revierating
            }
            if (newList.length > 0) {
                // return bookinglist;
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, data);

            } else {

                utility.errorhandler(res, "No data found");

            }

        } catch (e) {
            console.log("e", e)
            utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}
function getRecept(req, res) {
    console.log("in Recept");
    async function asy_init() {
        try {
            let condition = {
                _id: req.body._id
            }
            console.log("id--", condition);
            let bookinglist = await tranctiongmodel.find(
                { _id: req.body._id },
            ).populate({
                path: 'jobid',
                populate: {
                    path: 'driverdetails',
                    model: 'user'
                },
                match: {
                    $and: [
                        { tripstatus: { $eq: 'Completed' } },
                        { jobtype: { $ne: 'Hailjob' } }]
                }
            }).sort({ updatedAt: -1 }).lean();
            let newList = [];

            bookinglist.forEach((bk) => {
                if (bk.jobid !== null) {
                    const { jobid, ...rest1 } = bk
                    const { driverdetails, ...rest } = jobid
                    newList.push({ driverdetails, ...rest1, jobid: rest });
                }
            });


            //let bookinglist = await query.findData(drivergmodel,{'tripstatus':{$eq:'Ongoing'}})
            //console.log("rec--", receipt);
            if (newList.length > 0) {
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, newList);
            }
            //console.log("feed--",bookinglist);
            else {
                // return false;
                utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);

            }

        } catch (e) {
            console.log("e", e)
            utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}

function getBookingEdit(req, res) {
    async function asy_init() {
        try {
            let condition = {
                _id: req.body._id
            }
            let receipt = await tranctiongmodel.findOne(condition).populate({
                path: 'jobid driverdetails',
                populate: {
                    path: 'riderdetails driverdetails',
                    model: 'user'
                }
            })
            if (receipt) {
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, receipt);
            }
            else {
                utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
            }
        } catch (e) {
            console.log("e", e)
            utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();
}

function deleteBooking(req, res) {
    async function asy_init() {
        try {
            let condition = {
                _id: req.body._id
            }
            let receipt = await tranctiongmodel.deleteOne(condition);
            if (receipt.deletedCount > 0) {
                utility.sucesshandler(res, "Deleted Successfully", {});
            } else {
                utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
            }
        } catch (e) {
            console.log("e", e)
            utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();
}


function getUpComingBooking(req, res) {
    console.log("in Booking",req.body);
    async function asy_init() {
        try {
            var date = new Date()
            date = dateFormat(new Date(), "mm/dd/yyyy")
            //  date =  date.toISOString().split('T')[0]
            //   console.log({date});

            let upcoming = await drivergmodel.findOne({ user: req.body._id })
            // console.log(upcoming.bookingDate );
            // let bookinglist = await query.findData(tranctiongmodel,null,null,null,'jobid',{'updatedAt':{$gte: new Date ()}})
            let bookinglist = await tranctiongmodel.find({ user: req.body._id }).populate({
                path: 'jobid',
                populate: {
                    path: 'driverdetails',
                    model: 'user'
                },
                match: {
                    $and: [
                        { $or: [{ tripstatus: { $eq: 'Upcoming' }  }] },
                        { jobtype: { $ne: 'Hailjob' } }]
                }
            }).sort({ updatedAt: -1 }).lean();
            let newList = [];

            bookinglist.forEach((bk) => {
                if (bk.jobid !== null) {
                    const { jobid, ...rest1 } = bk
                    const { driverdetails, ...rest } = jobid
                    newList.push({ driverdetails, ...rest1, jobid: rest });
                }
            });

            console.log("upcomig data-", newList);
            // let Ongoing = await drivergmodel.find({ user: req.body._id, tripstatus: { $eq: "Ongoing" }, jobtype: { $ne: "Hailjob" } }).populate('transectionId driverdetails')
            // let Ongoing = await drivergmodel.find({user: req.body._id,tripstatus:{$eq:'Ongoing'} }).populate(' transectionId driverdetails') 
            let upcomingdata = {
                upcomingdta: newList,
                // Ongoing: Ongoing
            }

            if (newList.length > 0) {
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, upcomingdata);

            } else {

                utility.errorhandler(res, "no Booking data Found");

            }

        } catch (e) {
            console.log("e", e)
            utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}

function getVehicleType(req, res) {
    console.log("in Booking");
    async function asy_init() {
        // let bookinglist = await query.findData(tranctiongmodel,null,null,null,'jobid user',{'tripstatus':{$eq:'Ongoing'},'dateOfJourney':{$gte: new Date ()}})
        // //let bookinglist = await query.findData(drivergmodel,{'tripstatus':{$eq:'Ongoing'}})
        let availabledrivers = await query.findData(drivergmodel, { '': { $in: ["car", "van"] } })

        console.log("feed--", availabledrivers);
        try {
            if (availabledrivers) {

                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, availabledrivers);

            } else {

                utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);

            }

        } catch (e) {
            console.log("e", e)
            utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}


function getOngoingBooking(req, res) {

    async function asy_init() {
        let body = req.body

        try {
            //  let bookinglist = await query.findData(drivergmodel,body.driverdetails,null,null,{'tripstatus':{$eq:'Ongoing'}})
            // let bookinglist = await drivergmodel.find({{driverdetails:body.driverdetails},{tripstatus:{$eq:"Ongoing"}}})
            let bookinglist = await drivergmodel.findOne({ driverdetails: body.driverdetails, tripstatus: { $eq: "Ongoing" }, jobtype: { $ne: "Hailjob" } }).populate('riderdetails')
            // console.log("feed--",bookinglist);
            if (bookinglist) {

                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, bookinglist);

            } else {

                utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);

            }

        } catch (e) {
            console.log("e", e)
            utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}

function getDriver(req, res) {
    //console.log("hit--");
    async function asy_init() {
        try {
            let body = req.body ? req.body : {}
            console.log("body---", body);

            // let dataObj ={}
            // dataObj.pickUpLocation = {
            //     type: 'Point',
            //     coordinates:[req.body.pickupLocation.longitude,req.body.pickupLocation.latitude],
            //     address: req.body.pickupLocation.address,
            //   };
            //   console.log("datab--->",dataObj)
            let availabledrivers = await usermodel.find({ isDeleted: false, status: false, userType: 'Driver', onlinestatus: '1', isAvailable: true }).select({ _id: 1 })
            console.log('drver--', availabledrivers);
            let driverIds = availabledrivers.map((x) => {
                return x._id;
            });


            let availableDrivers = await usermodel.aggregate([
                {

                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [parseFloat(body.pickupLocation.longitude), parseFloat(body.pickupLocation.latitude)]
                        },
                        distanceField: "distance",
                        maxDistance: 50000,
                        spherical: true
                    },

                },
                {
                    $match: { _id: { $in: driverIds } },
                },

                { $limit: 3 },

                {
                    $project: {
                        name: 1,
                        currentLocation: 1,
                        distance: 1,
                        deviceInfo: 1,
                        dob: 1,
                        imagefile: 1,
                        licencenumber: 1,
                        onlinestatus: 1,
                        phonenumber: 1,
                        phoneverified: 1,
                        userType: 1
                    },
                },
            ]);


            if (availableDrivers.length > 0) {
                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, availableDrivers);
            }
            else {
                utility.errorhandler(res, "No Drivers found")
            }
            console.log("avild--", availableDrivers);
        }

        catch (e) {
            console.log("e", e)
            utility.errorhandler(res, "No Driver Found");
        }
    }
    asy_init();




}
function getAllDriverdata(req, res) {
    async function asy_init() {
        try {
            console.log("body--", req.body);

            let Condition1 = {
                ratedto: req.body._id,

            }
            console.log("con--", Condition1);
            var totalDistance = totalDistance || 0;
            var rating = 0;
            var count = 0;
            let completedresult = []
            let jobs = await drivergmodel.find({

                driverdetails: req.body._id,
            });

            let filteredjob = jobs.filter((e) => {
                return e._id;
            });

            let sum = await tranctiongmodel.find({
                jobid: { $in: filteredjob }
            }).populate(' jobid user driverdetails')
            

            let driverDetails = await customermodel.find({ _id: req.body._id })

            let ratings = await reviewmodel.find({ ratedto: req.body.id })
            ratings.forEach(element => {
                rating = rating + parseFloat(element.rating)
                count++
            })
            let Distance = await reviewmodel.find(Condition1)

            Distance.forEach(element => {
                rating = rating + parseFloat(element.rating)
                count = count + 1;
            })
            rating = rating / count
            let Trips = await drivergmodel.find({ driverdetails: req.body._id, tripstatus: "Ongoing" }).populate('user').lean()

            var TotalAmount = 0;
            var TodayAmount = 0
            var TotalTrips = 0;
            var comp;
            var Name = '';


            var licenceNumber = '';

            var profileImage = '';
            var driver_id = '';
            var driver_name = '';
            var driver_image = '';
            var driver_rating = '';
            var driver_phoneNumber = '';
            var userid = '';
            var email = '';
            var phonenumber = '';
            var riderImage = '';
            var userrating = '';
            if (driverDetails.length > 0) {
                driver_id = driverDetails[0]._id;
                driver_image = driverDetails[0].imagefile;
                // console.log('id--', driver_id);
                driver_name = driverDetails[0].name
                driver_phoneNumber = driverDetails[0].phonenumber;
                licenceNumber = driverDetails[0].licencenumber
                // var rider_phonenumber

                var tDate = new Date().getDate();
                var td = 0

                sum.forEach(element => {
                    if(element.jobid.jobtype != 'Hailjob'){
                    console.log("sum--", element.jobid.jobtype);
                    console.log("name--",element.user.name);
                    totalDistance = parseFloat(element.jobid.distance)
                    console.log("fis-----", element.jobid.distance);
                    totalDistance += totalDistance
                    TotalAmount = parseFloat(element.Amount)
                    TotalAmount += TotalAmount
                    Name = element.user.name
                    driver_rating = element.user.rating
                    phonenumber = element.user.phonenumber
                    userid = element.user._id
                    userrating = element.user.rating
                    // profileImage = element.driverdetails.imagefile
                    TotalTrips = TotalTrips + 1;
                    comp = element.createdAt.getDate()
                    if (comp == tDate) {
                        TodayAmount = TodayAmount + parseFloat(element.Amount)
                    }

                }
                })
            
            }

            var saveData = {
                totalDistance: totalDistance ? totalDistance : null,
                TotalAmount: TotalAmount ? TotalAmount :  null,
                TodayAmount: TodayAmount ? TodayAmount :null,
                TotalTrips: TotalTrips ? TotalTrips : null,
                name: Name ? Name : '',
                phonenumber: phonenumber ? phonenumber : null,
                userid: userid ? userid :'' ,
                rating: userrating ? userrating:null,
                licenceNumber: licenceNumber ? licenceNumber :null ,
                profileImage: profileImage ? profileImage :null,
                driver_phoneNumber: driver_phoneNumber ?driver_phoneNumber :null,
                driver_id: driver_id ? driver_id :null,
                driver_name: driver_name ? driver_name :null,
                driver_image: driver_image ? driver_image:null,
                driver_rating: driver_rating ? driver_rating :null,
                // driver_phonenumber:driver_phonenumber,
                trips: Trips ? Trips:null,

            }
            completedresult.push(saveData)

            console.log("distance--", completedresult);
            if (driverDetails.length > 0) {
                console.log("in length", completedresult);

                utility.sucesshandler(res, constantmessage.messages.customerDataFetched, completedresult);
                // res.json({'status':200, message: 'data fetched', "Totaldistance":totalDistance,"TodayAmount":TodayAmount,"TotalTrips":TotalTrips,"totalAmount":amount})


            }

            else {


                utility.errorhandler(res, "no data found", completedresult)

            }

        }
        catch (e) {
            console.log("e", e)
            utility.errorhandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();


}

function getByCode(req, res) {
    console.log("in Booking");
    async function asy_init() {
        try {

            let bookinglist = await areamodel.aggregate([
                {
                    $lookup: {
                        from: "drivergmodel",
                        localField: "address",
                        foreignField: "pickupLocation['address']",
                        as: "pickupL124"
                    }



                }
            ])
            console.log("feed--", bookinglist);
        } catch (e) {
            console.log("e", e)
            utility.sucesshandler(res, constantmessage.validationMessages.Invaliddata);
        }
    }
    asy_init();

}
