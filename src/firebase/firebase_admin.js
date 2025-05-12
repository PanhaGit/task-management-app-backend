const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../../node-js-task-notification-firebase-adminsdk-fbsvc-1c7eb84134.json');


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Get initialized messaging instance
const messaging = admin.messaging();

module.exports = { admin, messaging };














// const firebaseConfig = {
//     apiKey: "AIzaSyCy3jEUfDz3Gt-jUdlHTQ_13u30P-9OCwY",
//     authDomain: "node-js-task-notification.firebaseapp.com",
//     projectId: "node-js-task-notification",
//     storageBucket: "node-js-task-notification.firebasestorage.app",
//     messagingSenderId: "517094763462",
//     appId: "1:517094763462:web:52cd8a74e44c2fb35760c7",
//     measurementId: "G-1485N0N5F4"
// };