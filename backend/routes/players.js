const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/email');

const generateAccessPass = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for (let i = 0; i < 4; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BIFA-${pass}`;
};

router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, dateOfBirth, positions, profilePhoto } = req.body;

        if (!positions || positions.length === 0 || positions.length > 3) {
            return res.status(400).json({ success: false, message: 'Must select between 1 and 3 positions' });
        }

        const player = await Player.create({
            fullName, email, phone, dateOfBirth, positions, profilePhoto
        });

        res.status(201).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const { position, status } = req.query;
        let query = {};
        if (position) query.positions = { $in: [position] };
        if (status) query.status = status;
        const players = await Player.find(query).sort('-registrationDate');
        res.status(200).json({ success: true, data: players });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        res.status(200).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id/accept', protect, async (req, res) => {
    try {
        let player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        if (player.status === 'accepted') return res.status(400).json({ success: false, message: 'Already accepted' });

        const accessPass = generateAccessPass();
        player.status = 'accepted';
        player.accessPass = accessPass;
        await player.save();

        try {
            const htmlMsg = `
        <div style="font-family: Arial, sans-serif; background-color: #f4ea26; padding: 20px; color: #000;">
          <div style="background-color: #000; padding: 20px; border-radius: 8px;">
            <h1 style="color: #f4ea26; text-align: center;">Welcome to BIFA Football Club!</h1>
            <p style="color: #fff; font-size: 16px;">Hello ${player.fullName},</p>
            <p style="color: #fff; font-size: 16px;">Your registration for positions: <strong>${player.positions.join(', ')}</strong> has been approved.</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: #f4ea26; color: #000; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 5px;">
                ${accessPass}
              </span>
            </div>
            <p style="color: #fff; font-size: 16px;">Please present this unique club access pass at the club gate.</p>
            <p style="color: #fff; font-size: 16px;">Best Regards,<br>BIFA Admin Team</p>
          </div>
        </div>
      `;
            await sendEmail({ email: player.email, subject: 'Welcome to BIFA - Access Pass', html: htmlMsg });
        } catch (e) {
            console.log('Email delivery failed:', e.message);
        }

        res.status(200).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id/decline', protect, async (req, res) => {
    try {
        const player = await Player.findByIdAndUpdate(req.params.id, { status: 'declined' }, { new: true, runValidators: true });
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        res.status(200).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const player = await Player.findByIdAndDelete(req.params.id);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
