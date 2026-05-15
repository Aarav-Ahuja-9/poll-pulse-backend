const mongoose = require('mongoose');


const questionSchema = new mongoose.Schema({
    questionType: {
        type: String,
        enum: ['CHOICE', 'TEXT', 'RATING'],
        default: 'CHOICE'
    },
    text: {
        type: String,
        required: [true, 'Question text is required']
    },
    imageUrl: {
        type: String,
        default: ''
    },
    options: {
        type: [String],
        default: []
    },
    correctOptions: {
        type: [Number],
        default: []
    },
    timeLimit: {
        type: Number,
        default: null
    },
    isMandatory: {
        type: Boolean,
        default: true
    }
});


const pollSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Campaign Title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    questions: [questionSchema],


    pollSessionExpiry: {
        type: String,
        enum: ['1', '24', '168', 'never'],
        default: '24'
    },
    maxVotes: {
        type: Number,
        default: null
    },
    resultsVisibility: {
        type: String,
        enum: ['after_vote', 'after_timer', 'after_expiry'],
        default: 'after_vote'
    },
    accentColor: {
        type: String,
        default: '#38bdf8'
    },


    collectVoterDetails: {
        type: Boolean,
        default: false
    },
    isPasswordProtected: {
        type: Boolean,
        default: false
    },
    pollPassword: {
        type: String,
        default: ''
    },


    isActive: {
        type: Boolean,
        default: true
    },
    totalResponses: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);