require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {


        await mongoose.connect(process.env.URL_DB, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:");
        console.error("- Full error:", error);
        console.error("- Connection string:", process.env.URL_DB.replace(/:\/\/[^@]+@/, '://***:***@'));
        process.exit(1);
    }
};

module.exports = connectDB;
