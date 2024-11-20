const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "ServerId", required: true, foreignKey: "serverId" },
    // // //
    blacklistedChannels: { type: String, required: false, default: [] },
    allowedChannels: { type: String, required: false, default: [] },
    loggingChannelId: { type: String, required: false, default: null },
    // // //
    languageTo: { type: String, required: false, default: null },
    languageFrom: { type: String, required: false, default: null },
});

module.exports = mongoose.model("Settings", serverSchema);





