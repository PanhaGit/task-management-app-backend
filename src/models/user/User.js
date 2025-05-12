const mongoose = require('mongoose');

/**
 * Mongoose schema for the User model.
 *
 * Defines the structure for user data, including personal details, authentication
 * fields, OTP verification, and references to roles, images, and teams.
 */
const UserSchema = new mongoose.Schema(
    {
        /** @type {String} First name of the user, required and trimmed */
        first_name: {
            type: String,
            required: true,
            trim: true,
        },
        /** @type {String} Last name of the user, required and trimmed */
        last_name: {
            type: String,
            required: true,
            trim: true,
        },
        /** @type {Date} Date of birth, required */
        dob: {
            type: Date,
            required: true,
        },
        /** @type {String} Unique phone number, required and trimmed */
        phone_number: {
            type: String,
            required: false,
            unique: true,
            trim: true,
            default: null,
        },
        /** @type {String} Unique email address, required, trimmed, and lowercase */
        email: {
            type: String,
            required: false,
            unique: true,
            trim: true,
            lowercase: true,
        },
        /** @type {String} Hashed password, required, minimum length 6 */
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        /** @type {String} One-time password for verification, nullable */
        otp_code: {
            type: String,
            default: null,
            required: false,
        },
        /** @type {Boolean} Indicates if the user is verified, defaults to false */
        is_verify: {
            type: Boolean,
            default: false,
        },
        /** @type {Date} Expiration time for OTP, nullable */
        otp_expires_at : {
            type: Date,
            required: false,
        },
        /** @type {mongoose.Schema.Types.ObjectId} Reference to the user's role */
        role_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'role',
        },
        /** @type {mongoose.Schema.Types.ObjectId} Reference to the user's images, optional */
        image_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'images_user',
            required: false,
        },
        /** @type {String} Store token FCM */
        fcmTokens:{
            type: [String],
            default: []
        },
        /** @type {mongoose.Schema.Types.ObjectId} Reference to the user's team, nullable */
        team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', UserSchema);