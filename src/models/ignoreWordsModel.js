import mongoose from 'mongoose';

const ignoreWordsSchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true }
});

export default mongoose.model('IgnoreWord', ignoreWordsSchema);
