const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "ServerId", required: true },
    blacklistedChannels: { type: String, required: false, default: [] },
    allowedChannel: { type: String, required: false, default: null },
    loggingChannelId: { type: String, required: false, default: null },
});

module.exports = mongoose.model("Settings", serverSchema);





