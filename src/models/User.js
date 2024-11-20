const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    userId: { type: String, required: true, primaryKey: true},
    // //
    serverId: { type: String, ref: "ServerId", required: true },
    // // //
    blacklistedChannels: { type: String, required: false, default: [] },
    allowedChannels: { type: String, required: false, default: [] },
    loggingChannelId: { type: String, required: false, default: null },
    // // //
    languageTo: { type: String, required: false, default: null },
    languageFrom: { type: String, required: false, default: null },
});

module.exports = mongoose.model("User", serverSchema);





