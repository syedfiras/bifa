const express = require('express');
const router = express.Router();
const Referee = require('../models/Referee');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
    try {
        const refData = { ...req.body, addedBy: req.adminId };
        const referee = await Referee.create(refData);
        res.status(201).json({ success: true, data: referee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const referees = await Referee.find().populate('addedBy', 'username');
        res.status(200).json({ success: true, data: referees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const referee = await Referee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!referee) return res.status(404).json({ success: false, message: 'Referee not found' });
        res.status(200).json({ success: true, data: referee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const referee = await Referee.findByIdAndDelete(req.params.id);
        if (!referee) return res.status(404).json({ success: false, message: 'Referee not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
