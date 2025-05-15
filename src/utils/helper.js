require("dotenv").config();
const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");
const { logError } = require("./logError");

// Ensure storage directory exists
const ensureDirExists = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
};

// Initialize storage directory
const initStorage = async () => {
    try {
        await ensureDirExists(process.env.IMAGE_PATH);
    } catch (err) {
        logError('Storage initialization', err.message);
        throw new Error('Failed to initialize storage');
    }
};

// Call initialization when module loads
initStorage().catch(console.error);

exports.uploadFile = multer({
    storage: multer.diskStorage({
        destination: async function (req, file, callback) {
            try {
                await ensureDirExists(process.env.IMAGE_PATH);
                callback(null, process.env.IMAGE_PATH);
            } catch (err) {
                callback(err);
            }
        },
        filename: function (req, file, callback) {
            const ext = path.extname(file.originalname);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            callback(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
    }),
    limits: {
        fileSize: 1024 * 1024 * 3, // 3MB
    },
    fileFilter: function (req, file, callback) {
        const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
        if (!validTypes.includes(file.mimetype)) {
            return callback(new Error("Only image files are allowed (PNG, JPG, JPEG, WEBP)"), false);
        }
        callback(null, true);
    },
});

exports.removeFile = async (fileName) => {
    try {
        const filePath = path.join(process.env.IMAGE_PATH, fileName);
        await fs.unlink(filePath);
        return { success: true, message: "File deleted successfully" };
    } catch (err) {
        if (err.code === 'ENOENT') {
            return { success: false, message: "File not found" };
        }
        logError('File removal', err.message);
        return { success: false, message: "Error deleting file" };
    }
};