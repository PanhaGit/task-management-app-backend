const nodemailer = require('nodemailer');
const testSmtp = async () => {
    try {
        console.log('Environment variables:', {
            MAIL_HOST: process.env.MAIL_HOST,
            MAIL_PORT: process.env.MAIL_PORT,
            EMAIL_USER: process.env.EMAIL_USER,
            EMAIL_PASS: process.env.EMAIL_PASS ? '[REDACTED]' : 'MISSING',
        });

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT, 10),
            secure: process.env.MAIL_PORT == 465, // Use SSL for port 465, TLS for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            logger: true,
            debug: true,
        });

        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection successful');
    } catch (error) {
        console.error('SMTP connection failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
        });
    }
};

require('dotenv').config();
testSmtp();