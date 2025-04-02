const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    // // //
    allowedChannels: { type: [String], required: false, default: [] },
    loggingChannelId: { type: String, required: false, default: null },
    // // //
    languageTo: { type: String, required: false, default: 'en' },
    languageFrom: { type: String, required: false, default: 'auto' },
    // //
    messageType: { type: String, required: false, default: 'embed' },
});

const Settings = mongoose.model("Settings", serverSchema);
module.exports = Settings;