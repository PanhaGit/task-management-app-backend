require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("Attempting to connect with:",
            process.env.URL_DB.replace(/:\/\/[^@]+@/, '://***:***@'));

        await mongoose.connect(process.env.URL_DB, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000
        });
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:");
        console.error("- Error code:", error.code);
        console.error("- Raw error:", JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

module.exports = connectDB;