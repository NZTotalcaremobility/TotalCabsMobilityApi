var Notification = require('../model/notification');
const utility = require("../config/utility");



const tripIssue = async (req, res) => {
    try {
        const body = req.body;
        body.type = 'system';

        const response = await new Notification(body).save();
        if (response) {
            utility.sucesshandler(res,"Issue genrate successfully",response)
            // res.status(200).send({
            //     msg: 'Issue logged Successfully'
            // });
        } else {
            res.status(201).send({
                msg: 'Error'
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}
const riderHelp = async (req, res) => {
    try {
        const body = req.body;
        body.type = 'system';

        const response = await new Notification(body).save();
        if (response) {
            utility.sucesshandler(res,"Issue genrate successfully",response)
            // res.status(200).send({
            //     msg: 'Issue logged Successfully'
            // });
        } else {
            res.status(201).send({
                msg: 'Error'
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}


const addNotification = async (req, res) => {
    try {
        const body = req.body;
        const response = await new Notification(body).save();
        if (response) {
            return res.status(200).json({
                message: 'Notification Saved'
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}

const showSystemNotification = async (req, res) => {
    try {
        const response = await Notification.find(
            { type: 'system', isSeen: false },
            {}
        ).populate('from', 'name userType imagefile').sort({ updatedAt: -1 }).limit(10);
        if (response) {
            return res.status(200).json({
                message: "List of latest notification",
                code: 200,
                data: response,
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}

const showMessageNotification = async (req, res) => {
    try {
        const response = await Notification.find(
            { type: 'chat', isSeen: false },
            {}
        ).populate('from', 'name userType imagefile').sort({ updatedAt: -1 }).limit(10);
        if (response) {
            return res.status(200).json({
                message: "List of latest messages",
                code: 200,
                data: response,
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}

const readNotification = async (req, res) => {
    console.log('readNotification---', req.body);
    try {
        const { id } = req.body;
        const updateResponse = await Notification.updateOne({ _id: id }, { isSeen: true });
        console.log('-----------', updateResponse.nModified)
        if (updateResponse.nModified == 1) {
            return res.status(200).json({
                message: "Notification Read",
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);

    }
}

const notificationMarkRead = async (req, res) => {
    console.log('readNotification---', req.body);
    try {
        const id = req.body._id;
        const updateResponse = await Notification.findByIdAndUpdate({ _id: id }, { isSeen: true });
        console.log('-----------', updateResponse.nModified)
        if (updateResponse.nModified == 1) {
            return res.status(200).json({
                message: "Notification Read",
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);

    }
}

const listAllChatNotification = async (req, res) => {
    try {
        const response = await Notification.find({ type: 'chat' }, { __v: 0 }).populate('from', 'name userType imagefile').sort({ updatedAt: -1 });
        if (response) {
            return res.status(200).json({
                message: "List of Chat messages",
                code: 200,
                data: response,
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}

const listAllSystemNotification = async (req, res) => {
    try {
        const response = await Notification.find({ type: 'system' }, { __v: 0 }).populate('from', 'name userType imagefile').sort({ updatedAt: -1 });
        if (response) {
            return res.status(200).json({
                message: "List of system notification",
                code: 200,
                data: response,
            });
        }
    } catch (error) {
        console.log(error.message || 'Internal Server Error');
        utility.internalerrorhandler(error);
    }
}

module.exports = {
    addNotification,
    showSystemNotification,
    showMessageNotification,
    readNotification,
    notificationMarkRead,
    listAllChatNotification,
    listAllSystemNotification,
    tripIssue,
    riderHelp
}