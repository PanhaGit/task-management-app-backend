require("dotenv").config();
const path = require("path");
const connection = require("../config/database");
const { logError } = require("./logError");
const fs = require("fs/promises");
const multer = require("multer");

exports.db = connection;
exports.logError = logError;

exports.uploadFile = multer({
    storage: multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, process.env.IMAGE_PATH);
        },
        filename: function (req, file, callback) {
            const originalName = file.originalname;

            const newFilename = `${file.fieldname}-${originalName}`;

            callback(null, newFilename);
        },
    }),
    limits: {
        fileSize: 1024 * 1024 * 3, // max 3MB
    },
    fileFilter: function (req, file, callback) {
        const validTypes = ["image/png", "image/jpg", "image/jpeg"];
        if (!validTypes.includes(file.mimetype)) {
            callback(null, false);
            return res.status(400).json({ message: "Only image files are allowed" });
        } else {
            callback(null, true);
        }
    },
});

exports.removeFile = async (fileName) => {
    const filePath = path.join(process.env.IMAGE_PATH, fileName);
    try {
        await fs.unlink(filePath);
        return "File deleted successfully";
    } catch (err) {
        console.error("Error deleting file:", err);
        return true; // or return a custom error string
    }
};
