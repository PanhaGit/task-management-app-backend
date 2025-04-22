const Otp_expires_at_10minute = ()=>{
    const otp_expires_at_10  = new Date(Date.now() + 10 * 60 * 1000); // 10 minute

    return otp_expires_at_10;
}

module.exports = Otp_expires_at_10minute;