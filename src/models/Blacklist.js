const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    // // //
    blacklistedChannels: { type: String, required: false, default: [] },
    blacklistedItems: { type: String, required: false, default: [] }
    // // //
});

module.exports = mongoose.model("Blacklist", blacklistSchema);