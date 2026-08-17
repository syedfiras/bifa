const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const Attendance = require('../models/Attendance');
const { protect, protectPlayer } = require('../middleware/auth');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseDate = (value) => {
    if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
        return null;
    }
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : value;
};

const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// GET /api/attendance?date=YYYY-MM-DD
// Admin only. Returns all accepted players with their attendance status for the date.
router.get('/', protect, async (req, res) => {
    try {
        const date = req.query.date ? parseDate(req.query.date) : toLocalDateString(new Date());
        if (!date) {
            return res.status(400).json({ success: false, message: 'date must be in YYYY-MM-DD format' });
        }

        const [playersResult, recordsResult] = await Promise.all([
            supabase.from('players').select('*').eq('status', 'accepted').order('full_name', { ascending: true }),
            Attendance.findByDate(date)
        ]);

        if (playersResult.error) {
            throw new Error(playersResult.error.message);
        }

        const statusByPlayer = {};
        for (const record of recordsResult) {
            statusByPlayer[record.playerId] = record.status;
        }

        const data = (playersResult.data || []).map(row => ({
            _id: row.id,
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            phone: row.phone,
            positions: row.positions || [],
            ageCategory: row.age_category,
            profilePhoto: row.profile_photo,
            attendance: statusByPlayer[row.id] || null
        }));

        res.status(200).json({ success: true, data, date });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/attendance
// Admin only. Bulk upsert attendance for a single date.
// Body: { date: "YYYY-MM-DD", records: [{ playerId, status }] }
router.put('/', protect, async (req, res) => {
    try {
        const { date, records } = req.body;

        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).json({ success: false, message: 'date must be in YYYY-MM-DD format' });
        }
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'records must be a non-empty array' });
        }

        for (const record of records) {
            if (!record.playerId || !['present', 'absent'].includes(record.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Each record must have a playerId and a status of "present" or "absent"'
                });
            }
        }

        const saved = [];
        for (const record of records) {
            const result = await Attendance.upsert(record.playerId, parsedDate, record.status);
            if (result) {
                saved.push(result);
            }
        }

        res.status(200).json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/attendance/me
// Player only. Returns the player's own attendance history (read-only view).
router.get('/me', protectPlayer, async (req, res) => {
    try {
        const records = await Attendance.findByPlayer(req.playerId);

        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        res.status(200).json({
            success: true,
            data: records.map(r => ({ id: r.id, practiceDate: r.practiceDate, status: r.status })),
            summary: { total, present, absent, rate }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
