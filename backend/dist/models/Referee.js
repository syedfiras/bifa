const mongoose = require('mongoose');
const refereeSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Referee', refereeSchema);
