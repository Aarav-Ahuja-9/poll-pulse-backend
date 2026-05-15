const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    pollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll',
        required: true
    },
    respondentId: {
        type: String,
        default: 'Anonymous'
    },
    answers: [
        {
            questionIndex: { type: Number, required: true },
            selectedOption: { type: mongoose.Schema.Types.Mixed, required: true }
        }
    ]
}, { timestamps: true });



module.exports = mongoose.model('Response', responseSchema);