const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    // // //
    blacklistedChannels: { type: String, required: false, default: [] },
    blacklistedItems: { type: String, required: false, default: [] }
    // // //
});

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

module.exports = Blacklist;