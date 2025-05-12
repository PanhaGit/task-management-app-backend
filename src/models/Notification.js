const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'alert', 'promotion', 'reminder'],
        default: 'info'
    },
    image: {
        type: String,
        default: null
    },
    data: {
        type: Map,
        of: String,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date
    },
    readAt: {
        type: Date
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
