const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    userId: { type: String, required: true, primaryKey: true},
    // // //
    username: { type: String, required: true },
    displayName: { type: String, required: false },
    // // //
    languageToId: { type: String, required: false, default: [] }, // Include language to and channel ID, if not specified keep null
    languageFromId: { type: String, required: false, default: [] }, // Include language from and channel ID, if not specified keep null
});

module.exports = mongoose.model("Users", serverSchema);
