var mongoose = require('mongoose');
let emailtemplate = new mongoose.Schema({

    title: { type: String },
    subject: { type: String },
    content: { type: String, required: "Description is required" },
    findBy: { type: String, default: "None" },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
},
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }

)

module.exports = emailtemplate = mongoose.model('emailtemplate', emailtemplate)


