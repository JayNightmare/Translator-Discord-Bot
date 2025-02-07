const User = require('../models/User.js');
const { log } = require('../utils/utils-logger');

async function registerUser(userId, username) {
    let user = await User.findOne({ userId });
    if (!user) {
        user = await User.create({ userId, username });
        log(`New user registered: ${username}`);
    }
    return user;
}

module.exports = { registerUser };