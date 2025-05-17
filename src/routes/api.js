/**
 * API Main Router
 * @module apiRouter
 * @description Main router for all API endpoints (v1)
 * @requires ./routes/auth/auth
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('../routes/auth/auth');
const taskRoutes = require('../routes/task_router');
const notificationRoutes = require('../routes/notification_router');
const categoryRoutes = require('../routes/category_router');
/**
 * API v1 Routes
 * @namespace api/v1
 */

// Mount authentication routes
router.use('/api/v1', authRoutes); // Now routes will be /api/v1/auth/signup, etc.

// task
router.use('/api/v1/task', taskRoutes);

//notification
router.use('/api/v1/notifications/', notificationRoutes);

//category
router.use('/api/v1/category', categoryRoutes);
/**
 * Health Check Endpoint
 * @name get/status
 * @function
 * @memberof api/v1
 */
router.get('/api/v1/status', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;