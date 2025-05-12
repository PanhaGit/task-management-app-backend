const NotificationService = require('../services/notification_service');

const NotificationController = {

    /**
     * Send notification to a single user
     */
    async sendToUser(req, res) {
        try {
            const { user_id, title, body, data = {} } = req.body;

            if (!user_id || !title || !body) {
                return res.status(400).json({
                    success: false,
                    message: "User ID, title, and body are required"
                });
            }

            const result = await NotificationService.sendToUser(res, user_id, title, body, data);
            return result;

        } catch (error) {
            console.error('Notification Error:', error);
            return res.status(500).json({
                success: false,
                message: "Failed to send notification",
                error: error.message
            });
        }
    },

    /**
     * Send notification to multiple users
     */
    async sendToUsers(req, res) {
        try {
            const { user_ids, title, body, data = {} } = req.body;

            if (!user_ids || !Array.isArray(user_ids)) {
                return res.status(400).json({
                    success: false,
                    message: "User IDs must be an array"
                });
            }

            if (!title || !body) {
                return res.status(400).json({
                    success: false,
                    message: "Title and body are required"
                });
            }

            const result = await NotificationService.sendToUsers(res, user_ids, title, body, data);
            return result;

        } catch (error) {
            console.error('Bulk Notification Error:', error);
            return res.status(500).json({
                success: false,
                message: "Failed to send bulk notifications",
                error: error.message
            });
        }
    },

    /**
     * Send task-related notification
     */
    async sendTaskNotification(req, res) {
        try {
            const { user_ids, task_id, eventType } = req.body;

            if (!user_ids || !Array.isArray(user_ids)) {
                return res.status(400).json({
                    success: false,
                    message: "User IDs must be an array"
                });
            }

            if (!task_id || !eventType) {
                return res.status(400).json({
                    success: false,
                    message: "Task ID and event type are required"
                });
            }

            const result = await NotificationService.sendTaskNotification(user_ids, task_id, eventType);
            return res.status(200).json(result);

        } catch (error) {
            console.error('Task Notification Error:', error);
            return res.status(500).json({
                success: false,
                message: "Failed to send task notification",
                error: error.message
            });
        }
    }
};

module.exports = NotificationController;