const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    // // //
    allowedChannels: { type: String, required: false, default: [] },
    loggingChannelId: { type: String, required: false, default: null },
    // // //
    languageTo: { type: String, required: false, default: 'english' },
    languageFrom: { type: String, required: false, default: null },
});

module.exports = mongoose.model("Settings", serverSchema);