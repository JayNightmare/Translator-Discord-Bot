const Blacklist = require('../models/Blacklist');
const Settings = require('../models/Settings');
const IgnoreWord = require('../models/ignoreWordsModel');
const Server = require('../models/Server');
const User = require('../models/User');

// Fetch server settings by serverId
async function getServerSettings(serverId) {
    return await Settings.findOne({ serverId });
}

// Fetch blacklist by serverId
async function getBlacklist(serverId) {
    return await Blacklist.findOne({ serverId });
}

// Fetch ignored words by serverId
async function getIgnoredWords(serverId) {
    return await IgnoreWord.find({ serverId });
}

// Fetch server details by serverId
async function getServerDetails(serverId) {
    return await Server.findOne({ serverId });
}

// Fetch user details by userId
async function getUserDetails(userId) {
    return await User.findOne({ userId });
}

module.exports = {
    getServerSettings,
    getBlacklist,
    getIgnoredWords,
    getServerDetails,
    getUserDetails
};