const otp_expires_at_1minute = ()=>{
    const otp_expires_at_1 = new Date(Date.now() + 1 * 60 * 1000);  // 1 minute

    return otp_expires_at_1;
}

module.exports = otp_expires_at_1minute;