require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const refereeRoutes = require('./routes/referees');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB error:', err));
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/referees', refereeRoutes);
app.get('/', (req, res) => {
    res.send('API running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
