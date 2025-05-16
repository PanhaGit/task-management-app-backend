const express = require('express');
const router = express.Router();
const userAuthController = require('../../controllers/auth/authController');
const changePasswordController = require('../../controllers/auth/changePasswordController');
const authMiddleware = require('../../middlewares/authMiddleware');
const verifyOtpController = require('../../controllers/auth/verifyOtpController');
const { uploadFile } = require('../../utils/helper');
const  forgetPasswordController = require('../../controllers/auth/forgetPasswordController');
// Signup Route
router.post(
    '/auth/signup',
    uploadFile.fields([
        { name: 'image_profile', maxCount: 1 },
        { name: 'image_cover', maxCount: 1 },
    ]),
    userAuthController.signup
);

// Login
router.post('/auth/login', userAuthController.login);

// Resend OTP
router.post('/auth/resend', verifyOtpController.resendOtp);

// Verify OTP
router.post('/auth/verify_otp', verifyOtpController.verifyOtp);

// Get all users
router.get('/auth/get_all', authMiddleware.validateToken(), userAuthController.getAllUsers);

// Update user by ID
router.put(
    '/auth/update/:_id',
    authMiddleware.validateToken(),
    uploadFile.fields([
        { name: 'image_profile', maxCount: 1 },
        { name: 'image_cover', maxCount: 1 },
    ]),
    userAuthController.editAccount
);

// Delete account
router.delete('/auth/delete/:_id', authMiddleware.validateToken(), userAuthController.deleteAccount);

// Change password
router.post(
    '/auth/change_password/:_id',
    authMiddleware.validateToken(),
    changePasswordController.changePassword
);

// forget password
router.post('/forget_password',forgetPasswordController.requestOtp);
router.post('/reset_password', forgetPasswordController.resetPassword);

module.exports = router;