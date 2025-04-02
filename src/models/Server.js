const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, primaryKey: true },
    name: { type: String, required: false, default: '> No Server Name <' },
    memberCount: { type: String, required: false, default: 0 },
    ownerId: { type: String, required: false, default: null },
});

const Server = mongoose.model("Server", serverSchema);
module.exports = Server;
