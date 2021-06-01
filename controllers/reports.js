var _ = require('lodash')
var constant = require('../config/constants')
const utility = require('../config/utility')
const fs = require('fs')
const transactionmodel = require('../model/tansaction');
const usermodel = require('../model/user');
const driverStatusModal = require('../model/driverstatus');
const bookingModal = require('../model/booking');
const common_query = require('../config/common_query')
const moment = require('moment');



const filte = {
    startDate: new Date(moment().subtract(30, 'day')),
    endDate: new Date(moment.now()),
    driver: '',
    paymentStatus: ''
}



const genrateRport = async (req, res) => {
    try {
        const { query } = req;
        let { type, startDate, endDate, driver, paymentStatus } = query
        let groupBy = {}
        let sortBy = {};

        let match = {};
        let match2 = {}

        if (startDate && endDate) {
            match.created_at = {
                $gte: new Date(moment(startDate)), $lt: new Date(moment(endDate))
            }
            match2.createdAt = {
                $gte: new Date(moment(startDate)), $lt: new Date(moment(endDate))
            }
        } else {
            match.created_at = {
                $gte: filte.startDate, $lt: filte.endDate
            }
            match2.createdAt = {
                $gte: filte.startDate, $lt: filte.endDate
            }
        }
        if (driver) {
            match.driver = driver
            match2.driverdetails = driver
        }
        if (paymentStatus) {
            match.paymentStatus = paymentStatus
            match2.status = paymentStatus
        }
        if (type) {
            match.jobtype = type
            // match2.jobid.jobtype = type
        }

        // switch (type) {
        //     case "month":
        //         groupBy = {
        //             "month": { $month: "$created_at" },
        //             "year": { $year: '$created_at' }
        //         }
        //         sortBy = { "month": -1 }

        //         break;
        //     case "day":
        //         groupBy = {
        //             "day": { $dayOfMonth: "$created_at" },
        //             "month": { $month: "$created_at" },
        //         }
        //         sortBy = { "date": -1 }
        //         break;
        //     case "year":
        //         groupBy = { "year": { "$year": "$created_at" } }
        //         sortBy = { "year": -1 }
        //         break;
        //     default:
        //         groupBy = {
        //             "month": { $month: "$created_at" },
        //             "year": { $year: '$created_at' }
        //         }
        //         type = "months"
        //         sortBy = { "date": -1 }
        //         break;
        // }

        const summary = await driverStatusModal.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    "_id": { jobStatus: '$tripstatus' },
                    "count": { $sum: 1 },
                    "job": { "$push": "$$ROOT" },
                },
            }
        ])

        const users = await usermodel.aggregate([
            {
                $match: { userType: 'Driver' ,isBlock:false},
            }
        ])
        const jobs = await transactionmodel.find(match2).populate({
            match: type ? { "jobid.jobtype": type } : null,
            path: 'jobid user driverdetails',
            populate: {
                path: 'riderdetails driverstatuses',
                model: 'user'
            }
        });

        let finalData = {
            driverList: [],
            totalDriver: 0,
            totalJobs: 0,
            completedJob: 0,
            pendingJob: 0,
            Ongoing: 0,
            upcoming: 0,
            list: [],
            filter: { type, daterange: { startDate, endDate }, driver, paymentStatus }
        };

        if (jobs) {
            finalData.list = jobs
        }
        if (users) {
            finalData.totalDriver = users.length
            let driver = []
            users.forEach(ele => {
                driver.push({ _id: ele._id, name: ele.name })
            })
            finalData.driverList = driver;
        }

        if (summary) {
            summary.forEach(element => {
                if (element._id.jobStatus === "Completed") {
                    finalData.completedJob += element.count
                } else if (element._id.jobStatus === "Ongoing") {
                    finalData.Ongoing += element.count
                } else if (element._id.jobStatus === "Upcoming") {
                    finalData.upcoming += element.count
                } else {
                    finalData.pendingJob += element.count
                }
                finalData.totalJobs += element.count
            });
        }

        utility.sucesshandler(res, constant.messages.transactionDetailsFetch, finalData);

    }
    catch (e) {
        console.log('e', e)
        utility.internalerrorhandler(res)
    }

}


module.exports = {
    genrateRport
}
