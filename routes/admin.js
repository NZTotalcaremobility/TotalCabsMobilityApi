const mongoose = require('mongoose')
const utility = require('../config/utility')
var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var authentication = require('../controllers/auth');
const constants = require('../config/constants');
var reportsController = require('../controllers/reports')
var transactioncontroller = require('../controllers/transaction');
var authentication = require('../controllers/auth');
var dashboardController = require('../controllers/dashboard');
const bookingController = require('../controllers/booking');
const authController = require('../controllers/auth');
var customercontroller = require('../controllers/customer');
const notificationController = require('../controllers/notification');
const driverController = require('../controllers/driver');
const customer = require('../controllers/customer');
const notificationSchema = require('../model/notification');


var Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
})
var upload = multer({
  storage: Storage
})

//  payment history  routes
router.post('/user', customercontroller.searchUser)
router.post('/user/:_id/updateKeyStatus', customercontroller.updateKeyStatus)
router.post('/user/:_id/jobs', customercontroller.getUserWithjobs)
router.post('/forgotPassword', customercontroller.forgotPassword)
router.post('/resetPassword', customercontroller.resetpassword)
router.post('/verifyAccount', customercontroller.verifyLinkAdmin)
router.post('/subAdminList', customercontroller.getSubadminList)
router.post('/updateSubAdmin/:_id', customercontroller.updatePermission)
router.post('/deleteSubadmin/:_id', customercontroller.deleteSubAdmin)
router.post('/registerSubAdmin', authController.register)

router.post('/dashboard', dashboardController.home)
router.post('/login', authController.login)

router.post('/adminListTransaction', transactioncontroller.adminListTransaction)
router.post('/adminTransaction/:_id', transactioncontroller.adminTransactionDetail)
router.post('/adminTransactionSatus/:_id', transactioncontroller.amdinPaymentStatus)
router.post('/adminSendInvociceToMail/:_id', transactioncontroller.sendInvoiceToMail)
router.post('/adminGenerateInvoice/:_id', transactioncontroller.genrateInvoice)

// booking routes
router.post('/listBookings', bookingController.getBooking);
router.post('/bookingDetails', bookingController.getBookingByid);

router.post('/generatreports', reportsController.genrateRport);

//Notification routes
router.post('/addNotification', notificationController.addNotification);
router.post('/showSystemNotification', notificationController.showSystemNotification);
router.post('/showMessageNotification', notificationController.showMessageNotification);
router.post('/readNotification', notificationController.readNotification);
router.post('/listChatNotification', notificationController.listAllChatNotification);
router.post('/listSystemNotification', notificationController.listAllSystemNotification);

router.post('/getDrivers', driverController.getAllDrivers);

module.exports = router;
