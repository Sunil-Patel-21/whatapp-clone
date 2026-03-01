const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reportedMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    reason: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    resolvedAt: Date,
    action: String
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
