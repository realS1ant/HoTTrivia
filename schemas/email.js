const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    used: {
        type: Boolean,
        required: true
    },
    displayName: {
        type: String,
        required: false
    },
    gameState: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Email', emailSchema);