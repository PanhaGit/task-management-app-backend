const User = require('../../models/user/User');
const { logError } = require('../../utils/logError');
const generate_otp_code = require('../../utils/generate_otp_code');
const send_email_OTP = require('../../utils/send_email_OTP');
const otp_expires_at_10minute = require('../../utils/otp_expires_at_10minute');
/**
 * Controller for verifying one-time passwords (OTPs) to mark users as verified.
 */
const verifyOtpController = {

    // verify email
    verifyOtp: async (req, res) => {
        try {
            const { email, otp_code } = req.body;

            if (!email || !otp_code) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required',
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            if (user.otp_expires_at  && user.otp_expires_at  < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP has expired',
                });
            }

            if (user.otp_code !== otp_code) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP',
                });
            }

            user.is_verify = true;
            user.otp_code = null;
            user.otp_expires_at  = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Successfully verified OTP',
            });
        } catch (error) {
            await logError('verifyOtpController.verifyOtp', error.message, res);
            return res.status(500).json({
                success: false,
                message: 'Server error during OTP verification',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    },

    verify_password_OTP: async (req, res) => {
        try {
            const { email, otp_code } = req.body;

            if (!email || !otp_code) {
                return res.status(400).json({ message: "Email and OTP code are required." });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            if (user.otp_code !== otp_code) {
                return res.status(400).json({ message: "Invalid OTP code." });
            }

            // check expiration
            if (user.otp_expires_at  && user.otp_expires_at < Date.now()) {
                return res.status(400).json({ message: "OTP expired." });
            }

            // Mark user as verified
            user.is_verify = true;
            await user.save();

            return res.status(200).json({ success: true, message: "OTP verified successfully." });

        } catch (err) {
            await logError('verify_password_OTP', err.message, res);
        }
    },


    resendOtp: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required',
                });
            }

            console.log('Resending OTP for:', email);
            console.log('SMTP configuration:', {
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS ? '[REDACTED]' : 'MISSING',
            });

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const otp_code = generate_otp_code();
            const  otp_expires_at_10 = otp_expires_at_10minute()

            const updatedUser = await User.findOneAndUpdate(
                { email },
                { otp_code, otp_expires_at_10  },
                { new: true }
            );

            const user_name = `${user.first_name} ${user.last_name}`;
            await send_email_OTP(email, user_name, otp_code);

            return res.status(200).json({
                success: true,
                message: 'OTP resent successfully',
                user: {
                    email: updatedUser.email,
                    otp_expires_at : updatedUser.otp_expires_at ,
                },
            });
        } catch (err) {
            console.error('resendOtp error:', err);
            await logError('resendOtpController.resendOtp', err.message, res);
            return res.status(500).json({
                success: false,
                message: 'Server error during OTP resend',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined,
            });
        }
    },
};

module.exports = verifyOtpController;