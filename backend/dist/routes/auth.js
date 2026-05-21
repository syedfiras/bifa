const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { protect } = require('../middleware/auth');
// Initialize Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// ADMIN LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please provide username and password' });
        }
        const cleanUsername = username.trim();
        const cleanPassword = password.trim();
        // 1. Fetch admin from Supabase
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', cleanUsername)
            .single();
        if (error || !admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        // 2. Use bcrypt to compare the typed password with the 60-character database hash
        const isMatch = await bcrypt.compare(cleanPassword, admin.password.trim());
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        // 3. Generate Token using Supabase ID
        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ success: true, token });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// UPDATE PASSWORD ROUTE
router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        const { data: admin, error: fetchError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', req.adminId)
            .single();
        if (fetchError || !admin)
            return res.status(404).json({ success: false, message: 'Admin not found' });
        // Use bcrypt here too for updating passwords!
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        // Hash the new password before storing it back to Supabase
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        const { error: updateError } = await supabase
            .from('admins')
            .update({ password: hashedNewPassword })
            .eq('id', req.adminId);
        if (updateError)
            throw updateError;
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = router;
