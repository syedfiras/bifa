const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { protect } = require('../middleware/auth');

// Initialize Supabase Client using the admin service role to read/write auth data
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ADMIN LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please provide username and password' });
        }

        // 1. Fetch admin from Supabase instead of MongoDB
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 2. Check the password 
        // NOTE: If you are hashing passwords (highly recommended!), use bcrypt.compareSync(password, admin.password) here instead of direct matching.
        const isMatch = (password === admin.password); 
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Generate Token using Supabase ID (admin.id instead of Mongoose admin._id)
        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.status(200).json({ success: true, token });
    } catch (error) {
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

        // 1. Fetch current admin from Supabase
        const { data: admin, error: fetchError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', req.adminId)
            .single();

        if (fetchError || !admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        // 2. Validate current password
        const isMatch = (currentPassword === admin.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        // 3. Update password in Supabase
        const { error: updateError } = await supabase
            .from('admins')
            .update({ password: newPassword })
            .eq('id', req.adminId);

        if (updateError) throw updateError;

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;