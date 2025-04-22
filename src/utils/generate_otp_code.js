/**
 * Generates a 6-digit one-time password (OTP) for user verification.
 *
 * This function creates a random numeric OTP in the range of 100000 to 999999,
 * suitable for use in authentication flows, such as email or phone verification.
 * The OTP is returned as a string to match the User schema's otp field.
 *
 * @returns {string} A 6-digit OTP as a string.
 * @example
 * const otp = generate_otp_code(); // e.g., "123456"
 */
const generate_otp_code = () => {
    // Generate a 6-digit OTP by creating a random number between 100000 and 999999
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};

module.exports = generate_otp_code;