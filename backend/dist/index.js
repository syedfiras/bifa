require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const refereeRoutes = require('./routes/referees');

const app = express();

// 1. Unrestricted CORS for development and production stability
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Request Body Parser
app.use(express.json({ limit: '10mb' }));

// 3. API Routes (Make sure these are using your Supabase client internally!)
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/referees', refereeRoutes);

// Base route to check if server is up
app.get('/', (req, res) => {
    res.send('API running perfectly without MongoDB');
});

// 4. Global Error Handler (Prevents server crashes from killing CORS response)
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal Server Error' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));