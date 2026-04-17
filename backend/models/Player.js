const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    positions: {
        type: [String],
        validate: [v => v.length > 0 && v.length <= 3, 'Select between 1 and 3 positions']
    },
    profilePhoto: { type: String }, // storing as base64 or URL
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    registrationDate: { type: Date, default: Date.now },
    accessPass: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model('Player', playerSchema);
