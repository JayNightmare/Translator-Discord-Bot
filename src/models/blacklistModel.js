import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true }
});

export default mongoose.model('Blacklist', blacklistSchema);
