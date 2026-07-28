require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./lib/supabase');

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const refereeRoutes = require('./routes/referees');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const verifySupabaseConnection = async () => {
    const { error } = await supabase.from('admins').select('id').limit(1);
    if (error) {
        throw new Error(`Supabase connection failed: ${error.message}`);
    }
    console.log('Supabase connected');
};

app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/referees', refereeRoutes);

app.get('/', (req, res) => {
    res.send('API running');
});

const PORT = process.env.PORT || 5000;

verifySupabaseConnection()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
