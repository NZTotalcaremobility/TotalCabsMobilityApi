var _ = require('lodash')
var constant = require('../config/constants')
const utility = require('../config/utility')
const fs = require('fs')
const transactionmodel = require('../model/tansaction');
const usermodel = require('../model/user');
const jobModal = require('../model/jobhistory');
const query = require('../config/common_query')
const moment = require('moment');
const driverstatus = require('../model/driverstatus');

/**
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
const home = async (req, res) => {
    try {
        const { query } = req;
        let { type } = query
        let groupBy = {}
        let sortBy = {};

        switch (type) {
            case "month":
                groupBy = {
                    "month": { $month: "$createdAt" },
                    "year": { $year: '$createdAt' }
                }
                sortBy = { "month": -1 }
                break;
            case "week":
                groupBy = {
                    "week": { $week: "$createdAt" },
                    "year": { $year: '$createdAt' }
                }
                sortBy = { "week": -1 }
                break;
            case "year":
                groupBy = { "year": { "$year": "$createdAt" } }
                sortBy = { "year": -1 }
                break;
            default:
                groupBy = {
                    "month": { $month: "$createdAt" },
                    "year": { $year: '$createdAt' }
                }
                type = "months"
                sortBy = { "month": -1 }
                break;
        }

        const users = await usermodel.aggregate([
            {
                $match: { userType: 'Normal' },
            },
            {
                $group: {
                    "_id": groupBy,
                    "totalUsers": { $sum: 1 },
                    // "users": { "$push": "$$ROOT" },
                }
            },
            {
                $sort: sortBy
            }
        ])

        const drivers = await usermodel.find({ userType: 'Normal' })

        const jobs = await driverstatus.find().sort({ created_at: -1 }).populate('user driverdetails')

        let result = {
            type: type,
            totalUser: 0,
            userByType: [],
            listOfJobs: [],
            allocatedJobs: [],
            declinedJob: [],
            freevehciles: 0,
            TotalVehicles: drivers.length,
        };

        if (users.length > 0) {
            let temp = [];
            users.forEach((data) => {
                const { _id, totalUsers } = data;
                const { week, month, year } = _id;
                if (_id && result['userByType']) {
                    temp.push({ week, month, year, totalUsers })
                }
                result.totalUser += totalUsers
            })
            result['userByType'] = temp
        }

        if (jobs.length > 0) {
            result.listOfJobs = jobs
            jobs.forEach((data) => {
                if (data.tripstatus === 'Upcoming' || data.tripstatus === 'Accepted' || data.tripstatus === 'Ongoing') {
                    result.allocatedJobs.push(data)
                } else if (data.tripstatus === 'Canceled') {
                    result.declinedJob.push(data)
                } else if (data.tripstatus === 'Completed' && data.status.length > 0 && data.status[data.status.length - 1].status === 'Endtrip') {
                    result.freevehciles += 1
                }
            })
        }

        utility.sucesshandler(res, constant.messages.transactionDetailsFetch, result);
    }
    catch (e) {
        console.log('e', e)
        utility.internalerrorhandler(res)
    }

}


module.exports = {
    home: home,
}
