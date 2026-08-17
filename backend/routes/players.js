const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');
const Player = require('../models/Player');
const Referee = require('../models/Referee');
const { protect, protectPlayer } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const { uploadPlayerPhoto, deletePlayerPhoto } = require('../utils/playerPhotos');

const DEFAULT_PLAYER_PASSWORD = '12345678';

const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];

const generateAccessPass = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for (let i = 0; i < 4; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BIFA-${pass}`;
};

router.post('/', protect, async (req, res) => {
    try {
        const { fullName, email, phone, dateOfBirth, positions, profilePhoto, ageCategory, joiningYear, matchesPlayed, goals, assists, goalsConceded, cleanSheets } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, message: 'fullName is required' });
        }
        if (!positions || positions.length === 0 || positions.length > 3) {
            return res.status(400).json({ success: false, message: 'Must select between 1 and 3 positions' });
        }
        if (!ageCategory || !AGE_CATEGORIES.includes(ageCategory)) {
            return res.status(400).json({ success: false, message: `ageCategory must be one of: ${AGE_CATEGORIES.join(', ')}` });
        }

        const stats = {};
        for (const key of ['matchesPlayed', 'goals', 'assists', 'goalsConceded', 'cleanSheets']) {
            if (req.body[key] === undefined || req.body[key] === null || req.body[key] === '') {
                stats[key] = 0;
            } else {
                const n = Number(req.body[key]);
                if (!Number.isInteger(n) || n < 0) {
                    return res.status(400).json({ success: false, message: `${key} must be a non-negative integer` });
                }
                stats[key] = n;
            }
        }

        let parsedYear;
        if (joiningYear !== undefined && joiningYear !== null && joiningYear !== '') {
            parsedYear = Number(joiningYear);
            if (Number.isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear()) {
                return res.status(400).json({ success: false, message: 'joiningYear must be a valid year' });
            }
        }

        const photoUrl = await uploadPlayerPhoto(profilePhoto);

        const player = await Player.create({
            fullName: fullName.trim(),
            email: email || null,
            phone: phone || null,
            dateOfBirth,
            positions,
            profilePhoto: photoUrl,
            ageCategory,
            joiningYear: parsedYear,
            status: 'accepted',
            ...stats
        });

        res.status(201).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, dateOfBirth, positions, profilePhoto, ageCategory, joiningYear } = req.body;

        if (!positions || positions.length === 0 || positions.length > 3) {
            return res.status(400).json({ success: false, message: 'Must select between 1 and 3 positions' });
        }

        if (!ageCategory || !AGE_CATEGORIES.includes(ageCategory)) {
            return res.status(400).json({ success: false, message: `ageCategory must be one of: ${AGE_CATEGORIES.join(', ')}` });
        }

        const parsedYear = Number(joiningYear);
        if (!joiningYear || Number.isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: 'joiningYear must be a valid year' });
        }

        const photoUrl = await uploadPlayerPhoto(profilePhoto);

        const player = await Player.create({
            fullName,
            email: email || null,
            phone,
            dateOfBirth,
            positions,
            profilePhoto: photoUrl,
            ageCategory,
            joiningYear: parsedYear
        });

        res.status(201).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const { position, status, ageCategory, inStats } = req.query;
        let query = {};
        if (position) query.positions = { $in: [position] };
        if (status) query.status = status;
        if (ageCategory) query.ageCategory = ageCategory;
        if (inStats !== undefined) query.inStats = inStats === 'true';
        const players = await Player.find(query).sort('-registrationDate');
        res.status(200).json({ success: true, data: players });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { accessPass, password } = req.body;

        if (!accessPass || !password) {
            return res.status(400).json({ success: false, message: 'Please provide access pass and password' });
        }

        const cleanPass = accessPass.trim().toUpperCase();
        const { data: player, error } = await supabase
            .from('players')
            .select('*')
            .eq('access_pass', cleanPass)
            .maybeSingle();

        if (error) throw error;
        if (!player) {
            return res.status(401).json({ success: false, message: 'Invalid access pass or password' });
        }
        if (player.status !== 'accepted') {
            return res.status(403).json({ success: false, message: 'Your registration has not been approved yet' });
        }

        let valid;
        if (!player.password) {
            valid = password === DEFAULT_PLAYER_PASSWORD;
        } else {
            valid = await bcrypt.compare(password, player.password);
        }
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid access pass or password' });
        }

        const token = jwt.sign({ id: player.id, role: 'player' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/me', protectPlayer, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        res.status(200).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/password', protectPlayer, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        if (String(newPassword).length < 4) {
            return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
        }

        const player = await Player.findById(req.playerId);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

        let valid;
        if (!player.password) {
            valid = currentPassword === DEFAULT_PLAYER_PASSWORD;
        } else {
            valid = await bcrypt.compare(currentPassword, player.password);
        }
        if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await Player.findByIdAndUpdate(player.id, { password: hashedNewPassword });
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

        const linkedReferee = await Referee.findByContact({ email: player.email, phone: player.phone });
        res.status(200).json({ success: true, data: { ...player, linkedReferee } });
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
            if (player.email) {
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
            }
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
        const player = await Player.findByIdAndDelete(req.params.id);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        await deletePlayerPhoto(player.profilePhoto);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id/stats', protect, async (req, res) => {
    try {
        const { matchesPlayed, goals, assists, goalsConceded, cleanSheets } = req.body;

        const toInt = (value) => value === undefined || value === null ? undefined : Number(value);
        const values = { matchesPlayed: toInt(matchesPlayed), goals: toInt(goals), assists: toInt(assists), goalsConceded: toInt(goalsConceded), cleanSheets: toInt(cleanSheets) };

        if (['matchesPlayed', 'goals', 'assists', 'goalsConceded', 'cleanSheets'].every(key => values[key] === undefined)) {
            return res.status(400).json({ success: false, message: 'Provide at least one of matchesPlayed, goals, assists, goalsConceded, cleanSheets' });
        }

        for (const key of ['matchesPlayed', 'goals', 'assists', 'goalsConceded', 'cleanSheets']) {
            if (values[key] !== undefined && (!Number.isInteger(values[key]) || values[key] < 0)) {
                return res.status(400).json({ success: false, message: `${key} must be a non-negative integer` });
            }
        }

        const player = await Player.findByIdAndUpdate(req.params.id, values);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

        res.status(200).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id/in-stats', protect, async (req, res) => {
    try {
        const { active } = req.body;
        if (active !== undefined && typeof active !== 'boolean') {
            return res.status(400).json({ success: false, message: 'active must be a boolean' });
        }

        const player = await Player.findByIdAndUpdate(req.params.id, { inStats: active === undefined ? true : active });
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
        await deletePlayerPhoto(player.profilePhoto);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
