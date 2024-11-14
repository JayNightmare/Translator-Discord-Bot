const User = require('../models/User.js');

async function registerUser(userId, username) {
    let user = await User.findOne({ userId });
    if (!user) {
        user = await User.create({ userId, username });
        console.log(`New user registered: ${username}`);
    }
    return user;
}