const User = require('../../models/user/User');
const bcrypt = require('bcryptjs');
const { logError } = require('../../utils/logError');
const { generate_otp_code } = require('../../utils/generate_otp_code');
const { Otp_expires_at_10minute } = require('../../utils/otp_expires_at_10minute');
const send_email_OTP = require('../../utils/send_email_OTP');

const forgetPasswordController = {
    // Step 1: Request OTP for password reset
    requestOtp: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Email is required"
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "No account found with this email"
                });
            }

            // Generate OTP
            const otp = generate_otp_code();
            const otpExpiry = Otp_expires_at_10minute();

            // Save OTP to user
            user.otp = otp;
            user.otp_expires_at = otpExpiry;
            await user.save();

            // Send OTP email
            await send_email_OTP(email, user.name || 'User', otp);

            return res.status(200).json({
                success: true,
                message: "OTP sent to your email",
                otp_expires_at: otpExpiry
            });

        } catch (err) {
            await logError("forgetPasswordRequest", err, res);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    },

    // Step 2: Verify OTP and reset password
    resetPassword: async (req, res) => {
        try {
            const { email, otp, new_password, confirm_password } = req.body;

            // Validate inputs
            if (!email || !otp || !new_password || !confirm_password) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }

            if (new_password !== confirm_password) {
                return res.status(400).json({
                    success: false,
                    message: "Passwords do not match"
                });
            }

            // Find user
            const user = await User.findOne({
                email,
                otp,
                otp_expires_at: { $gt: new Date() } // Check OTP not expired
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid OTP or OTP expired"
                });
            }

            // Update password
            user.password = await bcrypt.hash(new_password, 12);
            user.otp = undefined;
            user.otp_expires_at = undefined;
            user.passwordChangedAt = Date.now();
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Password has been reset successfully"
            });

        } catch (err) {
            await logError("forgetPasswordReset", err, res);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
};

module.exports = forgetPasswordController;