const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    userId: { type: String, required: true, primaryKey: true},
    // //
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    // // //
    blacklistedChannels: { type: String, required: false, default: [] },
    allowedChannels: { type: String, required: false, default: [] },
    loggingChannelId: { type: String, required: false, default: null },
    // // //
    languageToId: { type: String, required: false, default: [] }, // Include language to and channel ID, if not specified keep null
    languageFromId: { type: String, required: false, default: [] }, // Include language from and channel ID, if not specified keep null
});

module.exports = mongoose.model("Users", serverSchema);





