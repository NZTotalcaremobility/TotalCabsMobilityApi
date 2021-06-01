const mongoose = require('mongoose')
const utility = require('../config/utility')
var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var constantmessage = require('../config/constants')
var drivercontroller = require('../controllers/driver')
//customermodel = mongoose.model('customermodel')
var authentication = require('../controllers/auth');
const constants = require('../config/constants');
var customercontroller = require('../controllers/customer')
var transactioncontroller = require('../controllers/transaction')
var bookingcontroller = require('../controllers/booking')


var jobcontroller = require('../controllers/job')

var messagecontroller = require('../controllers/Messaging_ctrl')
var companycontroller = require('../controllers/company')
var ridercontroller = require('../controllers/rider')
var areacontroller = require('../controllers/AreaCode')
var authentication = require('../controllers/auth');
const customermodel = require('../model/user');
const driver = require('../controllers/driver');
const job = require('../controllers/job');
var Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
})
var upload = multer({
  storage: Storage
})

// ----------------------------------------------Admin Section--------------------------------------------------------------

router.post('/getAllCoverJob', drivercontroller.getAllCoverJob)
router.post('/adminGetCustomer', customercontroller.adminGetCustomer)



// -------------------------------------------------------------------------------------------------------------------------
router.post('/commonLogin', drivercontroller.commonLogin)
router.post('/uploaddocuments', drivercontroller.uploaddocuments)
router.post('/addAreaCode', areacontroller.addAreaCode)
router.post('/getdriverdetails', drivercontroller.driverdetails)
router.post('/customerSignup', customercontroller.customersignup)
router.post('/customerSignupOpt', customercontroller.customerSignupOpt)
router.post('/signupcompany', companycontroller.signupcompany)
router.post('/forgotPassword', customercontroller.forgotPassword)
router.post('/resetPassword', customercontroller.resetpassword)
router.post('/customerLogin', customercontroller.customerLogin)
router.post('/verifyAccount', customercontroller.verifyLink)
router.post('/customerloginphone', customercontroller.customerLoginPhone)
router.post('/otpverification', customercontroller.otpverification)
router.post('/getUser', messagecontroller.getUser)
router.post('/uploadimage', messagecontroller.uploadimage)
router.post('/saveMesage', messagecontroller.saveMesage)
router.post('/message_history', messagecontroller.message_history)
router.post('/message_list', messagecontroller.message_list)
router.post('/driverstatus', authentication.ensureAuthorized, drivercontroller.driverstatus)
router.post('/riderdetails', authentication.ensureAuthorized, customercontroller.riderdetails)
router.post('/getcustomer', authentication.ensureAuthorized, customercontroller.getcustomer)

router.post('/getdriverByid', drivercontroller.getdriverByid)
router.post('/getcustomerByid', customercontroller.getcustomerByid)
router.post('/deleteaccount', authentication.ensureAuthorized, customercontroller.deleteaccount)
router.post('/changepassword', authentication.ensureAuthorized, customercontroller.changepassword)
router.post('/favorite', customercontroller.favorite)
router.post('/addLocation', customercontroller.addLocation)
router.post('/editDriver', upload.any(), customercontroller.editDriver)
router.post('/editRider', upload.any(), customercontroller.editRider)
router.post('/getFavoriteLocation', customercontroller.getFavoriteLocation)
router.post('/getdistance', customercontroller.getdistance)
router.post('/getdistance1', customercontroller.getdistance1)
router.post('/getdistance2', customercontroller.getdistance2)
router.post('/addBooking', bookingcontroller.addBooking)
router.post('/getBooking', bookingcontroller.getBooking)
router.post('/getAllDriverdata', bookingcontroller.getAllDriverdata)
router.post('/getVehicleType', bookingcontroller.getVehicleType)
router.post('/getDriver', bookingcontroller.getDriver)
router.post('/getUpComingBooking', bookingcontroller.getUpComingBooking)
router.post('/getOngoingBooking', bookingcontroller.getOngoingBooking)
router.post('/getByCode', bookingcontroller.getByCode)
router.post('/getBookingrecent', bookingcontroller.getBookingrecent)
router.post('/getBookingByid', bookingcontroller.getBookingByid)
router.post('/getBookingid', bookingcontroller.getBookingid)
router.post('/getRecept', bookingcontroller.getRecept)
router.post('/updatedriverData', upload.any(), drivercontroller.updatedriverData)
router.post('/updatecustomerData', upload.any(), customercontroller.updatecustomerData)
router.post('/forgotPassword', authentication.ensureAuthorized, customercontroller.forgotPassword)
router.post('/resetPassword', authentication.ensureAuthorized, customercontroller.resetpassword)
router.post('/verifyLink', authentication.ensureAuthorized, customercontroller.verifyLink)
//router.post('/driverLogin',drivercontroller.commonLogin)
router.post('/getAlldriver', drivercontroller.getAlldriver)
router.post('/riderdetail', ridercontroller.riderdeatail)
router.post('/panicMode', drivercontroller.panicMode)
router.post('/uploaddocuments', authentication.ensureAuthorized, drivercontroller.uploaddocuments)
// router.post('/getJobsHistory',drivercontroller.getjobhistory)
// router.post('/customersignup',authentication.ensureAuthorized,customercontroller)
const client = require("twilio")(constants.twilio.accountSid, constants.twilio.authToken);
//router.post('/driverLogin',drivercontroller.commonLogin)

router.post('/uploaddocuments',authentication.ensureAuthorized,drivercontroller.uploaddocuments)
router.post('/getJobsHistory',authentication.ensureAuthorized,drivercontroller.getjobhistory)
router.post('/changedriversatus',authentication.ensureAuthorized,drivercontroller.changedriversatus)
router.post('/makepayment',transactioncontroller.makepayment)
router.post('/messageHistory',authentication.ensureAuthorized,messagecontroller.message_history)
router.post('/messageList',authentication.ensureAuthorized,messagecontroller.message_list)
router.post('/tripfare',authentication.ensureAuthorized,transactioncontroller.tripfare)
router.post('/riderequest',jobcontroller.riderequest)
router.post('/AcceptandReject',jobcontroller.AcceptandReject)
router.post('/driverdetails',drivercontroller.driverdetails)
router.post('/testriderequest',jobcontroller.testriderequest)
router.post('/coverJobList',jobcontroller.coverJobList)
router.post('/coverJobStart',jobcontroller.coverJobStart)
router.post('/coverJobEnd',jobcontroller.coverJobEnd)
router.post('/ReviewAndRating',drivercontroller.reviewandrating)
router.post('/driverDistance',drivercontroller.driverdistance)
router.post('/hailjob',drivercontroller.hailjob)
router.post('/waitingtime',drivercontroller.waitingtime)
router.post('/completehailjob',drivercontroller.completehailjob)
router.post('/upcomingandcompleteride',jobcontroller.upcomingandcompleteride)
router.post('/coverJob',jobcontroller.coverJob)
router.post('/viewdocuments',drivercontroller.viewdocuments)
router.post('/logout',authentication.ensureAuthorized,drivercontroller.logout)

// router.post('/AcceptandReject',authentication.ensureAuthorized,jobcontroller.rideaction)
module.exports = router;
