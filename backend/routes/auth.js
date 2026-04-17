const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please provide username and password' });
        }
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        const admin = await Admin.findById(req.adminId);

        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        admin.password = newPassword;
        await admin.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
