const mongoose = require('mongoose');

const scheduledMessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ""
    },
    imageOrVideoUrl: {
        type: String
    },
    contentType: {
        type: String,
        enum: ['text', 'image', 'video']
    },
    scheduledTime: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    isOneTimeMedia: {
        type: Boolean,
        default: false
    },
    viewLimit: {
        type: Number,
        default: null
    },
    mediaExpiryDuration: {
        type: Number,
        default: null
    },
    failureReason: {
        type: String
    },
    sentAt: {
        type: Date
    },
    retryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

scheduledMessageSchema.index({ scheduledTime: 1, status: 1 });

const ScheduledMessage = mongoose.model('ScheduledMessage', scheduledMessageSchema);

module.exports = ScheduledMessage;
