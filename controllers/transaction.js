var _ = require('lodash')
var express = require('express');
var async = require('async')
var constant = require('../config/constants')
const usermodel = require('../model/user')
const utility = require('../config/utility')
const moment = require('moment')
const fs = require('fs')
const jobmodel = require('../model/driverstatus')
const transactionmodel = require('../model/tansaction');
const transaction = require('../model/tansaction');
const query = require('../config/common_query')
const { createInvoice, mailToInvoice, generatePdf } = require("../lib/utils");




const adminListTransaction = async (req, res) => {
    const getAllTransaction = async () => {
        try {
            let filterOptions = {};
            let { query: queryParams } = req;
            filterOptions = queryParams ? queryParams : {}

            let result = await query.findData(transactionmodel, filterOptions, null, null, {
                path: 'jobid',
                populate: {
                    path: 'riderdetails driverdetails',
                    model: 'user'
                }
            });
            if (result.status) {
                let finalData = []
                const { data } = result
                data.forEach(element => {
                    const { status, jobid, _id: transactionID } = element;
                    const temp = {}
                    if (jobid) {
                        const { pickupLocation: from, dropLocation: to, distance, dateOfJourney, riderdetails, driverdetails, } = jobid
                        temp.pickupLocation = from.address;
                        temp.dropLocation = to.address;
                        if (driverdetails) {
                            temp.driverName = driverdetails.name;
                            temp.driverId = driverdetails._id
                        }
                        if (riderdetails) {
                            temp.userName = riderdetails.name;
                            temp.userId = riderdetails._id
                        }
                        finalData.push({ transactionID, distance, status, dateOfJourney, ...temp })
                    }
                });
                utility.sucesshandler(res, constant.messages.transactionListFetch, finalData);
            } else {
                utility.sucesshandler(res, constant.validationMessages.intenalError);
            }
        } catch (e) {
            console.log("e", e)
            // return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
        }
    }
    getAllTransaction();
}

const adminTransactionDetail = async (req, res) => {
    const getTransaction = async () => {
        try {
            const { params } = req;
            const { _id } = params
            if (!_id) throw "Transaction Not Found"

            let result = await query.findoneData(transactionmodel, { _id }, null, {
                path: 'jobid user',
                populate: {
                    path: 'riderdetails driverdetails driverstatuses',
                    model: 'user'
                }
            });
            if (result.status) {
                utility.sucesshandler(res, constant.messages.transactionDetailsFetch, result.data);
            } else {
                utility.sucesshandler(res, constant.validationMessages.intenalError);
            }
        } catch (e) {
            utility.internalerrorhandler(e)
        }
    }
    getTransaction();
}

const amdinPaymentStatus = async (req, res) => {
    try {
        const { params } = req;
        const { _id } = params
        if (!_id) throw "Transaction Not Found"

        let result = await query.findoneData(transactionmodel, { _id }, 'status -_id');
        if (result.status) {
            utility.sucesshandler(res, constant.messages.transactionDetailsFetch, result);
        } else {
            utility.sucesshandler(res, constant.validationMessages.intenalError);
        }
    } catch (e) {
        utility.errorhandler(res, e.message || constant.validationMessages.intenalError)
    }

}


const sendInvoiceToMail = (req, res) => {
    const genrateInvoice = async () => {
        try {
            const { params } = req;
            const { _id } = params
            if (!_id) throw "Transaction Not Found"

            let result = await query.findoneData(transactionmodel, { _id }, null, {
                path: 'jobid user',
                populate: {
                    path: 'riderdetails driverdetails driverstatuses',
                    model: 'user'
                }
            });
            if (result.status) {
                const { data } = result
                const { type, status, fare, tax, Amount, jobid, _id: transactionID, user, updatedAt } = data;
                const { pickupLocation: from, dropLocation: to, distance, dateOfJourney, pickUptime, riderdetails, driverdetails, } = jobid
                const { address: pickupLocation, coordinates: fromCoordinates } = from;
                const { address: dropLocation, coordinates: toCoordinates } = to;
                if ((riderdetails && riderdetails.email)) {
                    let tmeplatedata = {
                        imagesBaseURL: `${baseURL}/pdfimages`,
                        invoiceDate: updatedAt,
                        totalAmount: Amount,
                        transactionID: transactionID,
                        riderName: riderdetails && riderdetails.name ? riderdetails.name : '',
                        rideDetails: {
                            locationImage: '',
                            totalDistance: distance,
                            totaltime: 0,
                            vehicleType: driverdetails && driverdetails.carType ? driverdetails.carType : '',
                        },
                        pickupLocation: pickupLocation,
                        pickUptime: pickUptime,
                        droppedAtLocation: dropLocation,
                        droppedttime: '',
                        billDetails: {
                            rideFare: fare,
                            discount: 0,
                            tax: tax,
                        },
                        driverDetails: {
                            driverImage: `${baseURL}/uploads/${driverdetails && driverdetails.imagefile ? driverdetails.imagefile : ''}`,
                            driverName: driverdetails && driverdetails.name ? driverdetails.name : '',
                        },
                        paymentDetails: {
                            paymentType: type
                        }
                    }

                    const location = await generatePdf(tmeplatedata, _id)

                    mailToInvoice(riderdetails.email, location, (err, response) => {
                        if (err) utility.errorhandler(res, response);
                        utility.sucesshandler(res, constant.messages.invoiceMailSent, {});
                        fs.unlinkSync(location);
                    })
                } else {
                    throw { message: "user email is not register with us please" }
                }
            } else {
                utility.sucesshandler(res, constant.validationMessages.intenalError);
            }
        } catch (e) {
            console.log('hherhee sis issue --   -  -', e)
            return res.json({ code: 500, message: e.message || constant.validationMessages.intenalError, data: {} })
        }
    }
    genrateInvoice();
}

const genrateInvoice = (req, res) => {
    const { params } = req;
    const { _id } = params

    try {
        if (!_id) throw "Transaction Not Found"
        const location = `${constant.invoicePath}/${_id}${constant.invoiceFileType}`;
        utility.fileExistCheck(location, (found) => {
            if (found) {
                const publicPath = `/invoices/${_id}${constant.invoiceFileType}`
                utility.sucesshandler(res, constant.messages.invoiceGenerated, { url: publicPath });
            } else {
                genrateInvoice();
            }
        })
    } catch (e) {
        console.log('hherhee sis issue --   -  -', e)
        return res.json({ code: 500, message: constant.validationMessages.intenalError || e.message, data: {} })
    }


    const genrateInvoice = async () => {
        let result = await query.findoneData(transactionmodel, { _id }, null, {
            path: 'jobid user',
            populate: {
                path: 'riderdetails driverdetails driverstatuses',
                model: 'user'
            }
        });

        if (result.status) {
            const { data } = result
            const { type, status, fare, tax, Amount, jobid, _id: transactionID, user, updatedAt } = data;
            const { pickupLocation: from, dropLocation: to, distance, dateOfJourney, pickUptime, riderdetails, driverdetails, } = jobid
            const { address: pickupLocation, coordinates: fromCoordinates } = from;
            const { address: dropLocation, coordinates: toCoordinates } = to;
            if ((riderdetails && riderdetails.email)) {
                let tmeplatedata = {
                    imagesBaseURL: `${baseURL}/pdfimages`,
                    invoiceDate: updatedAt,
                    totalAmount: Amount,
                    transactionID: transactionID,
                    riderName: riderdetails && riderdetails.name ? riderdetails.name : '',
                    rideDetails: {
                        locationImage: '',
                        totalDistance: distance,
                        totaltime: 0,
                        vehicleType: driverdetails && driverdetails.carType ? driverdetails.carType : '',
                    },
                    pickupLocation: pickupLocation,
                    pickUptime: pickUptime,
                    droppedAtLocation: dropLocation,
                    droppedttime: '',
                    billDetails: {
                        rideFare: fare,
                        discount: 0,
                        tax: tax,
                    },
                    driverDetails: {
                        driverImage: `${baseURL}/uploads/${driverdetails && driverdetails.imagefile ? driverdetails.imagefile : ''}`,
                        driverName: driverdetails && driverdetails.name ? driverdetails.name : '',
                    },
                    paymentDetails: {
                        paymentType: type
                    }
                }

                let location = await generatePdf(tmeplatedata, _id)

                location = location.slice(6);
                utility.sucesshandler(res, constant.messages.invoiceGenerated, { url: location });
            } else {
                utility.errorhandler(res, 'user email is not register with us please')
            }
        } else {
            utility.errorhandler(res, e.message || constant.validationMessages.intenalError)
        }
    }

}




async function makepayment(req, res) {
    try {

        let body = req.body ? req.body : {}
        let getransectiondetail = await transactionmodel.findOne({jobid:body.jobid})
        console.log("deattil--",getransectiondetail);
        if(getransectiondetail){
            console.log("in if");
            let obj = {
                jobid: body.jobid,
                type: body.type,
                Cardamount: body.cardamount,
                Cashamount: body.cashamount,
                Amount: body.amount,
                offer: body.offer
            } 
            let transectionupdate = await transactionmodel.findOneAndUpdate({jobid:body.jobid},{$set:{obj}})
        
            utility.sucesshandler(res,"payment updated",transectionupdate)
        
        }
else{
    console.log("in else");
        if (body.type == 'Split' || body.type == 'Epos' || body.type == 'Cash' || body.type == 'offer') {
            let obj = {
                jobid: body.jobid,
                type: body.type,
                Cardamount: body.cardamount,
                Cashamount: body.cashamount,
                Amount: body.amount,
                offer: body.offer
            }
            let user = await jobmodel.findOne({ _id: body.jobid }).select({ riderdetails: 1 }).lean()

            obj.user = user.riderdetails
            await new transactionmodel(obj).save()

            utility.sucesshandler(res, 'payment done')
        } else {
            let obj = {
                user: body.customerid,
                jobid: body.jobid,
                type: body.type,
                pin: body.pin,
                Cardamount: body.cardamount,
                cashamount: body.cashamount,
                Amount: body.amount,
                offer: body.offer

            }

            await new transactionmodel(obj).save()

            utility.sucesshandler(res, 'payment done')
        }
    }
    } catch (e) {
        utility.internalerrorhandler(e)
    }
}

async function tripfare(req, res) {
    try {

        let body = req.body ? req.body : {}
        let amount = {
            price: '$' + parseFloat(body.Distance) * 3
        }
        console.log(amount, 'amount')

        utility.sucesshandler(res, 'tripfare', amount)
    } catch (e) {
        utility.internalerrorhandler(e)
    }
}


module.exports = {
    makepayment: makepayment,
    tripfare: tripfare,
    adminListTransaction: adminListTransaction,
    adminTransactionDetail: adminTransactionDetail,
    amdinPaymentStatus: amdinPaymentStatus,
    sendInvoiceToMail,
    genrateInvoice
}