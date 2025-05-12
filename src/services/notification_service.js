const { messaging } = require('../firebase/firebase_admin');
const User = require('../models/user/User');
const Notification = require('../models/Notification');
const { logError } = require("../utils/helper");

const NotificationService = {

    /**
     * @function sendToUser
     * @description Sends a notification to a single user and stores it in MongoDB
     * @param {Object} res - Express response object
     * @param {String} user_id - ID of the user to receive the notification
     * @param {String} title - Notification title
     * @param {String} body - Notification message
     * @param {Object} data - Additional data (default: {})
     * @param {String} type - Notification type (default: 'info')
     * @param {String|null} image - Optional image URL
     */
    async sendToUser(res, user_id, title, body, data = {}, type = 'info', image = null) {
        try {
            // Get user and their FCM tokens
            const user = await User.findById(user_id).select('fcmTokens').lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (!user.fcmTokens || user.fcmTokens.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "User has no registered devices"
                });
            }

            // Prepare Firebase message
            const message = {
                notification: { title, body },
                data,
                token: user.fcmTokens[0] // Send to first token
            };

            const result = await messaging.send(message);

            // Save notification in database
            await Notification.create({
                userId: user_id,
                title,
                body,
                type,
                image,
                data,
                isDelivered: true,
                deliveredAt: new Date()
            });

            return res.status(200).json({
                success: true,
                message: "Notification sent and stored successfully",
                firebase: result
            });

        } catch (error) {
            // Log error and save failed notification
            await logError("NotificationService.sendToUser", error);

            await Notification.create({
                userId: user_id,
                title,
                body,
                type,
                image,
                data,
                isDelivered: false
            });

            return res.status(500).json({
                success: false,
                message: "Failed to send notification",
                error: error.message
            });
        }
    },

    /**
     * @function sendToUsers
     * @description Sends a notification to multiple users and stores each notification
     * @param {Object} res - Express response object
     * @param {Array} user_ids - Array of user IDs
     * @param {String} title - Notification title
     * @param {String} body - Notification message
     * @param {Object} data - Additional data (default: {})
     * @param {String} type - Notification type (default: 'info')
     * @param {String|null} image - Optional image URL
     */
    async sendToUsers(res, user_ids, title, body, data = {}, type = 'info', image = null) {
        try {
            // Find users with FCM tokens
            const users = await User.find({
                _id: { $in: user_ids },
                fcmTokens: { $exists: true, $not: { $size: 0 } }
            }).select('fcmTokens').lean();

            const allTokens = users.flatMap(user => user.fcmTokens);
            if (allTokens.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No registered devices found for these users"
                });
            }

            // Send notification to all tokens
            const message = {
                notification: { title, body },
                data,
                tokens: allTokens
            };

            const result = await messaging.sendEachForMulticast(message);

            // Store notification for each user
            await Promise.all(user_ids.map(userId => {
                return Notification.create({
                    userId,
                    title,
                    body,
                    type,
                    image,
                    data,
                    isDelivered: true,
                    deliveredAt: new Date()
                });
            }));

            return res.status(200).json({
                success: true,
                message: "Notifications sent and stored successfully",
                firebase: result
            });

        } catch (error) {
            await logError("NotificationService.sendToUsers", error);

            await Promise.all(user_ids.map(userId => {
                return Notification.create({
                    userId,
                    title,
                    body,
                    type,
                    image,
                    data,
                    isDelivered: false
                });
            }));

            return res.status(500).json({
                success: false,
                message: "Failed to send notifications",
                error: error.message
            });
        }
    },

    /**
     * @function sendTaskNotification
     * @description Sends task-specific notifications to multiple users
     * @param {Array} user_ids - Array of user IDs
     * @param {String} task_id - Task ID associated with the event
     * @param {String} eventType - Type of event (e.g., created, updated, completed)
     * @param {String} type - Notification type (default: 'alert')
     */
    async sendTaskNotification(user_ids, task_id, eventType, type = 'alert') {
        try {
            const title = `Task ${eventType}`;
            const body = `Task (${task_id}) triggered an event: ${eventType}`;

            // Get all tokens from users
            const users = await User.find({
                _id: { $in: user_ids },
                fcmTokens: { $exists: true, $not: { $size: 0 } }
            }).select('fcmTokens').lean();

            const allTokens = users.flatMap(user => user.fcmTokens);
            if (allTokens.length === 0) {
                return {
                    success: false,
                    message: "No registered devices found for these users"
                };
            }

            // Send multicast message
            const message = {
                notification: { title, body },
                data: { task_id, eventType },
                tokens: allTokens
            };

            const result = await messaging.sendEachForMulticast(message);

            // Save notifications
            await Promise.all(user_ids.map(userId => {
                return Notification.create({
                    userId,
                    title,
                    body,
                    type,
                    data: { task_id, eventType },
                    isDelivered: true,
                    deliveredAt: new Date()
                });
            }));

            return {
                success: true,
                message: "Task notifications sent and stored successfully",
                firebase: result
            };

        } catch (error) {
            await logError("NotificationService.sendTaskNotification", error);

            await Promise.all(user_ids.map(userId => {
                return Notification.create({
                    userId,
                    title: `Task ${eventType}`,
                    body: `Task (${task_id}) triggered an event: ${eventType}`,
                    type,
                    data: { task_id, eventType },
                    isDelivered: false
                });
            }));

            return {
                success: false,
                message: "Failed to send task notifications",
                error: error.message
            };
        }
    }
};

module.exports = NotificationService;