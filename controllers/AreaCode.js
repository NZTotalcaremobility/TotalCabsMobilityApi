const utility = require("../config/utility");
const customermodel = require("../model/user");

var constantmessage = require("../config/constants");
const query = require("../config/common_query");
var emailtemplate = require("../model/emailtemplate");
var AreaCode = require("../model/Areacode");
var handlebars = require("handlebars");
const _ = require("lodash");
const axios = require("axios");
var mongoose = require("mongoose");
const bodyParser = require("body-parser");
const async = require("async");
var jwt = require("jsonwebtoken");
module.exports = {
  addAreaCode: addAreaCode,
};
function addAreaCode(req, res) {
  console.log("body data", req.body);

  async function add_addAreaCode() {
    try {
     // const { id } = req.body;
      console.log("body dta--", req.body);
      // console.log({user});
      let dataObj = {};
      dataObj.areacode = req.body.areacode;
      dataObj.areaname = req.body.areaname;
      //console.log("code--",areacode);

      let customerObj = await query.uniqueInsertIntoCollection( AreaCode, dataObj );

      if (customerObj.status == 200) { console.log("ok");
        utility.sucesshandler( res, constantmessage.messages.AreaCodeAdded, customerObj );
      } else {
        utility.sucesshandler( res, constantmessage.validationMessages.Invaliddata
        );
      }
    } catch (e) {
      console.log("e", e);
      //return Response(res, constant.statusCode.internalservererror, constant.messages.SOMETHING_WENT_WRONG, e);
    }
  }

  add_addAreaCode(function () {});
}
