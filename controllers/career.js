var _ = require('lodash')
const utility = require('../config/utility')
const careerModal = require('../model/career');



async function saveCareerForm(req, res) {
    try {

        const { body } = req;

        let obj = {
            email: body.email,
            phonenumber: body.phonenumber,
            fname: body.fname,
            lname: body.lname,
            isWeekend: body.isWeekend,
            pEndorsement: body.pEndorsement,
            comments: body.comments,
        }

        await new careerModal(obj).save()
        utility.sucesshandler(res, 'form Subbmitted')
    
    } catch (e) {
        utility.internalerrorhandler(e)
    }
}



module.exports = {
    saveCareerForm,
}