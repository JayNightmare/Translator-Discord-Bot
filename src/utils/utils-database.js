const mongoose = require("mongoose");
const { MONGODB_URI } = require("../config/config.js");
const { log } = require("./utils-logger.js");

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        log("Connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}

module.exports = { connectToDatabase };
