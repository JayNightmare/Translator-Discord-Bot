const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "ServerId", required: true, primaryKey: true },
    name: { type: String, required: true },
    memberCount: { type: Number, required: 0 },
    // //
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: false, default: null }
});

module.exports = mongoose.model("Server", serverSchema);
