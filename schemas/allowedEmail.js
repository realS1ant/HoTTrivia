const mongoose = require('mongoose');

const allowedEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    uses: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('AllowedEmail', allowedEmailSchema);