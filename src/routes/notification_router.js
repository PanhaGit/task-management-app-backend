const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const User = require('../models/user/User');
// Single user notification
router.post('/send_to_user', NotificationController.sendToUser);

// Multiple users notification
router.post('/send_to_users', NotificationController.sendToUsers);

// Task notification
router.post('/send_task_notification', NotificationController.sendTaskNotification);

router.post('/register-fcm', async (req, res) => {
    try {
        const { userId, fcmToken } = req.body;

        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { fcmTokens: fcmToken } },
            { upsert: false }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * @route POST /notifications/register-test-device
 * @description Register a test device with mock FCM token
 */
router.post('/register-test-device', async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "user_id is required"
            });
        }

        // Generate mock FCM token
        const mockToken = `mock-fcm-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Register token with user
        const user = await User.findByIdAndUpdate(
            user_id,
            { $addToSet: { fcmTokens: mockToken } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Test device registered successfully",
            user_id,
            fcm_token: mockToken,
            current_tokens: user.fcmTokens
        });

    } catch (error) {
        console.error('Device registration error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to register test device",
            error: error.message
        });
    }
});

// Test notification endpoint
router.post('/test_notification', async (req, res) => {
    try {
        const { user_id, title, body } = req.body;

        // Validation
        if (!user_id || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'user_id, title, and body are required'
            });
        }

        let NotificationService = require('../services/notification_service');
        // Call service
        await NotificationService.sendToUser(res, user_id, title, body);

    } catch (error) {
        console.error('Test notification error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;