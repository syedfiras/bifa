require('dotenv').config();
const Admin = require('./models/Admin');

const run = async () => {
    try {
        console.log('Seeding admin in Supabase...');
        const exist = await Admin.findOne({ username: 'admin' });
        if (!exist) {
            await Admin.create({ username: 'admin', password: 'password123' });
            console.log('Admin user created: admin / password123');
        } else {
            console.log('Admin already exists');
        }
        process.exit(0);
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
};

run();
