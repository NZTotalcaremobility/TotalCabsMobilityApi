'use strict';
const constant = require('./constants');
const mongoose = require('mongoose');
const fs = require("fs");
const commonQuery = {};
let SALT_WORK_FACTOR = 10;
let bcrypt = require('bcrypt');
let _ = require('lodash');
const { populate } = require('../model/user');


/**
 * Function is use to add salt to the password 
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 03 Aug 19
 */

commonQuery.saltThePassword = function saltThePassword(pwd) {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
                if (err) {
                    reject({
                        status: false,
                        error: err
                    });
                } else {
                    bcrypt.hash(pwd, salt, (err, hash) => {
                        if (err) {
                            reject({
                                status: false,
                                error: err
                            });
                        } else {
                            resolve({
                                status: true,
                                value: hash
                            })
                        }

                    });
                }

            });
        })
    }
    /**
     * Function is use to Fetch Single data
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.findoneData = function findoneData(model, cond, fetchVal,populate) {
    // console.log("model, cond, fetchVal",model, cond, fetchVal)
    return new Promise(function(resolve, reject) {
        model.findOne(cond, fetchVal).populate(populate).lean().exec( function(err, userData) {
            // console.log("userData",userData)
            let tempObj = {
                status: false
            }
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })

}

/**
 * Function is use to Fetch all data
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findData = function findData(model, cond, fetchVal, sortBY = '',populate) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        if (sortBY) {
            var sort_by = sortBY
        } else {
            var sort_by = {
                _id: 'desc'
            };
        }
        console.log(sort_by)
        model.find(cond, fetchVal).populate(populate).sort(sort_by).lean().exec(function(err, userData) {
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}

/**
 * Function is use to Fetch all data by sort, skip, limit
 * @access private
 * @return json
 * Created by shubhangi singh 
 * @smartData Enterprises (I) Ltd
 * Created Date 11 Sept 19
 */
commonQuery.findDataBySortSkipLimit = function findDataBySortSkipLimit(model, cond, sort_by, count, skip) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond).sort(sort_by)
            .limit(parseInt(count))
            .skip(parseInt(skip))
            .exec(function(err, userData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userData;
                    resolve(tempObj);
                }
            });
    })
}


/**
 * Function is use to Fetch all data in descending order by date
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
// commonQuery.findDataBySort = function findDataBySort(model, cond, fetchVal) {
//     return new Promise(function (resolve, reject) {
//         let tempObj = {
//             status: false
//         }
//         model.find(cond, fetchVal).sort({
//             createdAt: 'descending'
//         }).exec(function (err, userData) {
//             if (err) {
//                 tempObj.error = err;
//                 reject(tempObj);
//             } else {
//                 tempObj.status = true;
//                 tempObj.data = userData;
//                 resolve(tempObj);
//             }
//         });
//     })
// }


/**
 * Function is use to Fetch Multiple data with populate
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findDataWithPopulate = function findDataWithPopulate(model, cond, populate) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond).populate(populate).exec(function(err, userData) {
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}


/**
 * Function is use to Fetch Multiple data with multiple populate
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findDataWithMultiplePopulate = function findDataWithMultiplePopulate(model, cond, populate1, populate2) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond).populate(populate1).populate(populate2).exec(function(err, userData) {
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}

/**
 * Function is use to Fetch Multiple data with populate and limited count
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findDataWithPopulateWithCount = function findDataWithPopulateWithCount(model, cond, populate, count) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond)
            .limit(parseInt(count))
            .populate(populate)
            .sort({
                updatedAt: 'descending'
            })
            .exec(function(err, userData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userData;
                    resolve(tempObj);
                }
            });
    })
}

/**
 * Function is use to Fetch Multiple data with populate and limited count as per createdAt descending order
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findDataWithPopulateWithCountDescending = function findDataWithPopulateWithCountDescending(model, cond, populate, count) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond)
            .limit(parseInt(count))
            .populate(populate)
            .sort({
                createdAt: 'descending'
            })
            .exec(function(err, userData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userData;
                    resolve(tempObj);
                }
            });
    })
}

/**
 * Function is use to Fetch Multiple data with populate and limited count as per createdAt descending order for pagination
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findDataWithPopulateWithCountandPaginateDescending = function findDataWithPopulateWithCountandPaginateDescending(model, cond, populate, populate2, count, skip) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }

        // User.find(condition)
        // .limit(parseInt(count))
        // .skip(parseInt(skip))
        // .sort(sorting)
        // .lean()

        model.find(cond)
            .limit(parseInt(count))
            .populate(populate)
            .populate(populate2)
            .skip(parseInt(skip))
            .sort({
                createdAt: 'descending'
            })
            .exec(function(err, userData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userData;
                    resolve(tempObj);
                }
            });
    })
}

/**
 * Function is use to Fetch Multiple data and limited count
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findDataWithCount = function findDataWithCount(model, cond, count) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond)
            .limit(parseInt(count))
            .sort({
                createdAt: 'descending'
            })
            .exec(function(err, userData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userData;
                    resolve(tempObj);
                }
            });
    })
}

/**
 * Function is use to Fetch Single data with populate
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findoneDataWithPopulate = function findoneDataWithPopulate(model, cond, fetchVal, populate) {
    return new Promise(function(resolve, reject) {
        model.findOne(cond, fetchVal).populate(populate).exec(function(err, userData) {
            let tempObj = {
                status: false
            }
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}

/**
 * Function is use to Fetch Single data with populate
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findoneWithPopulate = function findoneWithPopulate(model, cond, populate) {
    return new Promise(function(resolve, reject) {
        model.findOne(cond).populate(populate).exec(function(err, userData) {
            let tempObj = {
                status: false
            }
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}

/**
 * Function is use to Fetch Single data with populate in descending order
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findoneDataWithPopulateInDesc = function findoneDataWithPopulateInDesc(model, cond, populate) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.findOne(cond).sort({
            createdAt: 'descending'
        }).populate(populate.path).exec(function(err, userData) {
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}



/**
 * Function is use to Fetch Single data
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findById = function findById(model, cond) {
        return new Promise(function(resolve, reject) {
            model.findById(cond, function(err, userData) {
                if (err) {
                    reject(err);
                } else {
                    resolve(userData);
                }

            });
        })
    }
    /**
     * Function is use to Fetch Single data
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.updatedById = function updatedById(model) {
        return new Promise(function(resolve, reject) {
            model.save(function(err, userData) {
                if (err) {
                    reject(err);
                } else {
                    resolve(userData);
                }
            });
        })
    }
    /**
     * Function is use to Last Inserted id
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.lastInsertedId = function lastInsertedId(model) {
    return new Promise(function(resolve, reject) {
        model.findOne().sort({
            id: -1
        }).exec(function(err, data) {
            if (err) {
                resolve(0);
            } else {
                if (data) {
                    var id = data.id + 1;
                } else {
                    var id = 1;
                }
            }
            resolve(id);
        });
    })
}

/**
 * Function is use to Insert object into Collections
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.InsertIntoCollection = function InsertIntoCollection(model, obj) {
    return new Promise(function(resolve, reject) {
        new model(obj).save(function(err, userInfo) {
            let tempObj = {
                status: false
            }
            if (err) {
                console.log("err", err)
                tempObj.error = err;
                reject(tempObj);
            } else {
                console.log("userInfo", userInfo)
                tempObj.status = true;
                tempObj.data = userInfo;
                resolve(tempObj);
            }
        });
    })
}

/**
 * Function is use to Insert many into Collections
 * @access private
 * @return json
 * Created by prakash
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.InsertManyIntoCollection = function InsertManyIntoCollection(model, arr) {
        return new Promise(function(resolve, reject) {
            try {
                model.insertMany(arr, function(err, userInfo) {
                    let tempObj = {
                        status: false
                    }
                    if (err) {
                        tempObj.error = err;
                        reject(tempObj);
                    } else {
                        tempObj.status = true;
                        tempObj.data = userInfo;
                        resolve(tempObj);
                    }
                });
            } catch (error) {
                console.log(" on insert many ::userInfo::>", error);
            }

        })
    }
    /**
     * Function is use to upload file into specific location
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.fileUpload = function fileUpload(imagePath, buffer) {
        return new Promise((resolve, reject) => {
            try {
                let tempObj = {
                    status: false
                }
                fs.writeFile(imagePath, buffer, function(err) {
                    if (err) {
                        tempObj.error = err;
                        reject(err);
                    } else {
                        tempObj.status = true;
                        tempObj.message = 'uploaded';
                        resolve(tempObj);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Function is use to check File Exist or not
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.FileExist = function FileExist(imagePath, noImage, imageloc) {
        return new Promise(function(resolve, reject) {
            utility.fileExistCheck(imagePath, function(exist) {
                if (!exist) {
                    resolve(constant.config.baseUrl + noImage);
                } else {
                    resolve(constant.config.baseUrl + imageloc);
                }
            });
        })
    }
    /**
     * Function is use to delete file from specific directory
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.deleteFile = function deleteFile(filePath) {
    return new Promise(function(resolve, reject) {
        fs.unlink(filePath, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve("success");
            }
        });
    })
}

/**
 * Function is use to Update One Document
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.updateOneDocument = function updateOneDocument(model, updateCond, userUpdateData) {
    return new Promise(function(resolve, reject) {
        model.findOneAndUpdate(updateCond, {
                $set: userUpdateData
            }, {
                new: true
            })
            .lean().exec(function(err, userInfoData) {
                // console.log("\n\n\n dta>>>>>>>>>>>>>>>>>>>>>>", userInfoData);
                let tempObj = {
                    status: false
                }
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userInfoData;
                    resolve(tempObj);
                }
            });
    })
}

/**
 * Function is use to insert obj into array
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.pushObjIntoDocument = function pushObjIntoDocument(model, updateCond, userUpdateData, setCondition = {}) {
        return new Promise(function(resolve, reject) {
            model.findOneAndUpdate(updateCond, {
                $push: userUpdateData,
                $set: setCondition
            }).lean().exec(function(err, userInfoData) {

                let tempObj = {
                    status: false
                }
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userInfoData;
                    resolve(tempObj);
                }
            });
        })
    }
    /**
     * Function is use to insert obj into array
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.pullObjFromDocument = function pullObjFromDocument(model, updateCond, userUpdateData) {
    return new Promise(function(resolve, reject) {
        model.findOneAndUpdate(updateCond, {
            $pull: userUpdateData
        }).lean().exec(function(err, userInfoData) {
            let tempObj = {
                status: false
            }
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userInfoData;
                resolve(tempObj);
            }
        });
    })
}



/**
 * Function is use to Update One Document contains an array field
 * @access private
 * @return json
 * Created by Saurabh Udapure
 * @smartData Enterprises (I) Ltd
 * Created Date 29 Aug 2019
 */
commonQuery.updateDocumentwithArrayField = function updateDocumentwithArrayField(model, updateCond, userUpdateData) {

    return new Promise(function(resolve, reject) {
        // let obj = { status: false };
        model.findOneAndUpdate(updateCond,
                userUpdateData
            )
            .lean().exec(function(err, userInfoData) {
                let tempObj = {
                    status: false
                }
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userInfoData;
                    resolve(tempObj);
                }
            });
    })
}

/**
 * Function is use to Update All Document
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.updateAllDocument = function updateAllDocument(model, updateCond, userUpdateData) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.update(updateCond, {
                $set: userUpdateData
            }, {
                multi: true
            })
            .lean().exec(function(err, userInfoData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userInfoData;
                    resolve(tempObj);
                }
            });
    })
}


/**
 * Function is used to Update multiple document with different conditions
 * @access private
 * @return json
 * Created by Sneha
 * @smartData Enterprises (I) Ltd
 * Created Date 30 Sep 19
 */
commonQuery.updateMultipleDocument = function updateMultipleDocument(model, updateCond, userUpdateData) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.bulkWrite(userUpdateData.map((obj) => {
                let updateObj = obj;
                let filterId = obj._id;
                delete updateObj._id; //delete _id from update object
                return {
                    updateOne: {
                        filter: {
                            _id: filterId
                        },
                        update: {
                            $set: updateObj
                        },
                        upsert: true
                    },
                };
            }))
            .then(userInfoData => {
                tempObj.status = true;
                tempObj.data = userInfoData;
                resolve(tempObj);

            })
            // .catch((e) => reject(e));
            .catch((err) => {
                tempObj.error = err;
                reject(tempObj);
            });
    })
}

/**
 * Function is use to Find all Documents
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.fetch_all = function fetch_all(model, cond, fetchd) {
    return new Promise(function(resolve, reject) {
        model.find(cond, fetchd).exec(function(err, userData) {
            if (err) {
                reject(err);
            } else {
                resolve(userData);
            }

        });
    })
}

/**
 * Function is use to Count number of record from a collection
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.countData = function countData(model, cond) {
        let tempObj = {
            status: false
        }
        return new Promise(function(resolve, reject) {
            model.count(cond).exec(function(err, userData) {
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = userData;
                    resolve(tempObj);
                }

            });
        })
    }
    /**
     * Function is use to Fetch All data from collection , Also it supports aggregate function
     * @access private
     * @return json
     * Created by prakash kumar soni
     * @smartData Enterprises (I) Ltd
     * Created Date 02 Aug 19
     */
commonQuery.fetchAllLimit = function fetchAllLimit(query) {
    return new Promise(function(resolve, reject) {
        query.exec(function(err, userData) {
            if (err) {
                reject(err);
            } else {
                resolve(userData);
            }
        });
    })
}

/**
 * Function is use to Insert object into Collections , Duplication restricted
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.uniqueInsertIntoCollection = function uniqueInsertIntoCollection(model, obj) {
    let result = {
            status: false
        }
        // console.log("\n uniqueInsertIntoCollection called \n", obj);
    return new Promise(function(resolve, reject) {
        new model(obj).save(function(err, userData) {
            if (err) {
                console.log("\n uniqueInsertIntoCollection error \n", err);
                result.status = false;
                result.err = err;
                reject(result);
            } else {
                // console.log("\n uniqueInsertIntoCollection sucessss \n", userData);
                result.status = true;
                result.userData = userData;
                resolve(result);
            }
        });
    })
}


/**
 * Function is use to DeleteOne Query
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.deleteOneDocument = function deleteOneDocument(model, cond) {
    let result = {
        status: false
    }

    return new Promise(function(resolve, reject) {
        model.deleteOne(cond).exec(function(err, userData) {
            if (err) {
                result.err = err
                reject(result);
            } else {
                result.status = true
                result.userData = userData
                resolve(result);
            }

        });
    })
}

/**
 * Function is use to delete Many document from Collection
 * @access private
 * @return json
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.deleteManyfromCollection = function deleteManyfromCollection(model, obj) {
    return new Promise(function(resolve, reject) {
        model.deleteMany(obj, function(error, inserted) {
            if (error) {
                resolve(0);
            } else {
                resolve(1);
            }

        });
    })
}

/**
 * Function is use to Fetch all availability data in ascending order by startDate
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findAvailabilityDataBySort = function findAvailabilityDataBySort(model, cond) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond).sort({
            startDate: 1
        }).exec(function(err, userData) {
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}

/**
 * Function is use to Fetch all availability data in descending order by startDate
 * @access private
 * @return json
 * Created by Saurabh
 * @smartData Enterprises (I) Ltd
 * Created Date 02 Aug 19
 */
commonQuery.findAvailabilityDataBySortDescending = function findAvailabilityDataBySortDescending(model, cond) {
    return new Promise(function(resolve, reject) {
        let tempObj = {
            status: false
        }
        model.find(cond).sort({
            endDate: -1
        }).exec(function(err, userData) {
            if (err) {
                tempObj.error = err;
                reject(tempObj);
            } else {
                tempObj.status = true;
                tempObj.data = userData;
                resolve(tempObj);
            }
        });
    })
}

commonQuery.dateToStringData = function dateToStringData(model, condi) {
    return new Promise((resolve, reject) => {
        model.aggregate(condi).exec(function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }

        })
    })
}


commonQuery.doAggregate = function doAggregate(model, condArr) {
    return new Promise((resolve, reject) => {
        model.aggregate(condArr).exec(function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }

        })
    })
}


commonQuery.findoneBySort = function findoneBySort(model, condition, fetchVal, sortby) {
    return new Promise(function(resolve, reject) {

        if (!sortby) {
            sortby = {
                _id: -1
            };
        }
        model.findOne(condition, fetchVal).sort(sortby).exec(function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
}


commonQuery.countStaffData = function countStaffData(model, cond) {
    return new Promise(function(resolve, reject) {
        model.countDocuments(cond).exec(function(err, userData) {
            if (err) {
                reject(err);
            } else {
                resolve(userData);
            }

        });
    })
}

commonQuery.FindOne = function FindOne(model, cond = {}, projection = {}) {
    return new Promise((resolve, reject) => {
        try {
            if (!model || !Object.keys(cond).length)
                return reject({
                    statusCode: 400,
                    message: !model ? 'table' : 'condition to find'
                });
            model.findOne(cond, projection).exec(function(err, data) {
                if (err) {
                    console.log(err);
                    return reject(err);
                } else {
                    // console.log(data);
                    return resolve(data);
                }

            });
        } catch (error) {
            return reject({
                statusCode: 500,
                message: 'Internal server error'
            });
        }
    });
}

commonQuery.mongoObjectId = function(data) {
    if (data && data !== null && data !== undefined) {
        return mongoose.Types.ObjectId(data);
    } else {
        return false;
    }
}

commonQuery.bytesToSize = function(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}


commonQuery.getValidationErrors = function(validationErrors) {
    let errorMsgList = [];
    // let errorPathList = [];
    try {

        /* ERROR MSG EXAMPLE: medicalnegligence validation failed: lawyer_id: Lawyer is required., firm_id: Firm id is required. */
        let splitAtColon = validationErrors.message.split(':');
        splitAtColon.splice(0, 1);
        errorMsgList = splitAtColon.toString().split(',');
        for (let i = 0; i < errorMsgList.length; i++) {

            // errorPathList.push(errorMsgList[i].trim());
            errorMsgList.splice(i, 1);
        }

    } catch (e) {
        errorMsgList = [];
    }

    return errorMsgList;
}

/**
 * Function is use to emit msg
 * @access private
 * @param (name,obj)
 * obj : title : str ,msg:str, to:arr of user id
 * Created by prakash kumar soni
 * @smartData Enterprises (I) Ltd
 * Created Date 03 Aug 19
 */
commonQuery.emit = function(name, obj) {
    if (obj && obj.receiver && Array.isArray(obj.receiver)) {
        let rec = obj.receiver;
        rec.forEach(id => {
            let touser = socketClientList[id];
            console.log("touser", touser)
            _socketio.to(touser).emit(name, obj);
        });
    }

}

commonQuery.isValidMongoObjectId = function(data) {
    try {
        if (data && !_.isNil(data) && !_.isEmpty(data)) {
            return mongoose.Types.ObjectId.isValid(data);
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

/**
 * Function is use to upsert document
 * @access private
 * @return json
 * @smartData Enterprises (I) Ltd
 * Created Date 25 Feb 2020
 */
commonQuery.upsertDocument = function upsertDocument(model, findCondition, userUpsertData) {
    return new Promise(function(resolve, reject) {
        model.findOneAndUpdate(findCondition, {
                $set: userUpsertData
            }, {
                upsert: true,
                new: true
            })
            .lean().exec(function(err, updateInfo) {

                let tempObj = {
                    status: false
                }
                if (err) {
                    tempObj.error = err;
                    reject(tempObj);
                } else {
                    tempObj.status = true;
                    tempObj.data = updateInfo;
                    resolve(tempObj);
                }
            });
    })
}

module.exports = commonQuery;