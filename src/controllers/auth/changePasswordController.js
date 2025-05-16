const User = require('../../models/user/User');
const bcrypt = require('bcryptjs');
const { logError } = require("../../utils/logError");
const { validatePasswordChange } = require('../../validators/validate_password');

const changePasswordController = {
    changePassword: async (req, res) => {
        try {
            // Validate request
            const { error, value } = validatePasswordChange({
                params: req.params,
                body: req.body
            });

            if (error) {
                const errors = error.details.map(detail => detail.message);
                return res.status(400).json({
                    success: false,
                    messages: errors
                });
            }

            const { _id } = value.params;
            const { current_password, new_password } = value.body;

            // Find user
            const user = await User.findById(_id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(current_password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Current password is incorrect"
                });
            }

            // Check if new password is different
            if (await bcrypt.compare(new_password, user.password)) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be different from current password"
                });
            }

            // Hash and update password
            user.password = await bcrypt.hash(new_password, 12);
            user.passwordChangedAt = Date.now();
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Password updated successful"
            });

        } catch (err) {
            await logError("changePassword", err, res);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
};

module.exports = changePasswordController;