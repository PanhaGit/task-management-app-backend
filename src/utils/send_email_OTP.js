require('dotenv').config();
const nodemailer = require('nodemailer');
const { logError } = require('./logError');
const path = require('path');
const send_email_OTP = async (to_email, user_name, otp_code) => {
    try {
        if (!to_email || !user_name || !otp_code) {
            throw new Error('Missing required parameters for sending OTP email');
        }

        console.log('SMTP configuration:', {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        });

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT, 10),
            secure: process.env.MAIL_PORT == 465, // Use TLS for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            logger: true,
            debug: true,
        });

        const mailOptions = {
            from: `"${process.env.NAME_APP}" <${process.env.EMAIL_USER}>`,
            to: to_email,
            subject: 'Use the code below to log in to MONGKOL APP',
            // subject:`<img src="${process.env.LOGO}" >`,
            text: `Hello ${user_name},\n\nUse the code ${otp_code} to log in to your account. This code will expire in 10 minutes.\n\nThank you for using ${process.env.NAME_APP}!`,
            attachments: [
                {
                    filename: 'M.png',
                    path: path.resolve(__dirname, '../image/M.png'), // this resolves to src/image/M.png
                    cid: 'logo' // this is your content ID for the email embed
                }
            ],
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="text-align: center;">
                        <h2>Hello, ${user_name}</h2>
                        <img src="cid:logo" style="height: 200px;" alt="logo"/>
                        <p>Use the code below to log in to your account:</p>
                        <h1 style="background: #f0f0f0; padding: 8px 15px; display: inline-block;">${otp_code}</h1>
                        <p>This code will expire in 10 minutes.</p>
                        <br/>
                        <p>Thank you for using ${process.env.NAME_APP}!</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to_email}: ${info.messageId}`);
        return { otp_code, messageId: info.messageId };
    } catch (error) {
        console.error(`Failed to send OTP email to ${to_email}:`, error);
        await logError('send_email_OTP', error.message);
        throw error;
    }
};

module.exports = send_email_OTP;