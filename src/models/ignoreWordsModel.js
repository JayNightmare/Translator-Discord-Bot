const mongoose = require('mongoose');

const ignoreWordsSchema = new mongoose.Schema({
    serverId: { type: String, ref: "serverId", required: true, foreignKey: "serverId" },
    // //
    word: { type: String, required: true, unique: true },
    addedAt: { type: Date, default: Date.now }
});

const IgnoreWord = mongoose.model('IgnoreWord', ignoreWordsSchema);

module.exports = IgnoreWord;