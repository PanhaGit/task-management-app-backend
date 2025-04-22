const fs = require("fs/promises");
const path = require("path");


const logDir = path.join(__dirname, "../logs");

exports.logError = async (controller, message_error, res = "") => {
  try {
    const logPath = path.join(logDir, `${controller}.txt`);
    const logMessage = `${new Date().toISOString()} - ${message_error}\n`;
    await fs.appendFile(logPath, logMessage);
  } catch (error) {
    console.error("Error writing to log file:", error);
  }

  if (res) {
    res.status(500).send("Internal Server Error!");
  }
};
